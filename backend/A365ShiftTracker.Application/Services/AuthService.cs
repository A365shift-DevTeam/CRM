using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using OtpNet;

namespace A365ShiftTracker.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IUnitOfWork uow, IConfiguration config, IEmailService emailService,
        IMemoryCache cache, ILogger<AuthService> logger)
    {
        _uow = uow;
        _config = config;
        _emailService = emailService;
        _cache = cache;
        _logger = logger;
    }

    // ── Register ────────────────────────────────────────────

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var exists = await _uow.Users.Query().AnyAsync(u => u.Email == request.Email);
        if (exists)
            throw new InvalidOperationException("Email already registered.");

        await using var tx = await _uow.BeginTransactionAsync();
        try
        {
            var user = new Domain.Entities.User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                DisplayName = request.DisplayName
            };

            await _uow.Users.AddAsync(user);
            await _uow.SaveChangesAsync(); // generates user.Id

            var defaultRole = await _uow.Roles.Query().FirstOrDefaultAsync(r => r.Name == "User");
            if (defaultRole != null)
            {
                await _uow.UserRoles.AddAsync(new Domain.Entities.UserRole
                {
                    UserId = user.Id,
                    RoleId = defaultRole.Id
                });
                await _uow.SaveChangesAsync();
            }

            await tx.CommitAsync();

            var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
            return new AuthResponse
            {
                Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
                Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions, user.DisplayName, user.OrgId, user.Plan),
                Role = roleName, Permissions = permissions,
                IsTotpEnabled = user.IsTotpEnabled,
                TwoFactorRequired = user.TwoFactorRequired,
                TwoFactorMethod = user.TwoFactorMethod,
                OrgId = user.OrgId,
                Plan = user.Plan ?? "Free",
                PlanExpiresAt = user.PlanExpiresAt
            };
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // ── Login ───────────────────────────────────────────────

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.Email == request.Email)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated. Contact your administrator.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        user.LastLoginAt = DateTime.UtcNow;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        // 2FA required — issue partial token
        // Check both the admin-controlled flag and user-enabled TOTP
        if (user.TwoFactorRequired || user.IsTotpEnabled)
        {
            // TOTP is required by admin but user hasn't configured it yet — let them in, prompt setup
            if (user.TwoFactorMethod == "totp" && !user.IsTotpEnabled)
            {
                var (rn, perms) = await GetUserRoleAndPermissionsAsync(user.Id);
                return new LoginResponse
                {
                    Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
                    Token = GenerateJwtToken(user.Id, user.Email, rn, perms, user.DisplayName, user.OrgId, user.Plan),
                    Role = rn, Permissions = perms,
                    IsTotpEnabled = false,
                    TwoFactorRequired = user.TwoFactorRequired,
                    TwoFactorMethod = user.TwoFactorMethod,
                    TotpSetupRequired = true,
                    OrgId = user.OrgId,
                    Plan = user.Plan ?? "Free",
                    PlanExpiresAt = user.PlanExpiresAt
                };
            }

            var method = user.IsTotpEnabled ? "totp" : user.TwoFactorMethod;
            var partialToken = GeneratePartialToken(user.Id, user.Email, method);
            return new LoginResponse
            {
                Requires2FA = true,
                TwoFactorMethod = method,
                PartialToken = partialToken
            };
        }

        // No 2FA — issue full token
        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions, user.DisplayName, user.OrgId, user.Plan),
            Role = roleName, Permissions = permissions,
            Requires2FA = false,
            IsTotpEnabled = user.IsTotpEnabled,
            TwoFactorRequired = user.TwoFactorRequired,
            TwoFactorMethod = user.TwoFactorMethod,
            OrgId = user.OrgId,
            Plan = user.Plan ?? "Free",
            PlanExpiresAt = user.PlanExpiresAt
        };
    }

    // ── Email OTP ────────────────────────────────────────────

    public async Task SendOtpAsync(string partialToken)
    {
        var (userId, _) = ValidatePartialToken(partialToken);
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        var code = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        user.OtpCode = BCrypt.Net.BCrypt.HashPassword(code);
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(5);
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        await _emailService.SendOtpEmailAsync(user.Email, user.DisplayName ?? user.Email, code);
    }

    public async Task<LoginResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var (userId, attempts) = ValidatePartialToken(request.PartialToken);
        if (attempts >= 5)
            throw new InvalidOperationException("Too many attempts. Please log in again.");

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (user.OtpCode is null || user.OtpExpiry is null || user.OtpExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("OTP expired. Request a new code.");

        if (!BCrypt.Net.BCrypt.Verify(request.Code, user.OtpCode))
        {
            IncrementAttempts(request.PartialToken, user.Id);
            throw new InvalidOperationException("Invalid code. Please try again.");
        }

        // Clear OTP
        user.OtpCode = null;
        user.OtpExpiry = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions, user.DisplayName, user.OrgId, user.Plan),
            Role = roleName, Permissions = permissions,
            IsTotpEnabled = user.IsTotpEnabled,
            TwoFactorRequired = user.TwoFactorRequired,
            TwoFactorMethod = user.TwoFactorMethod,
            OrgId = user.OrgId,
            Plan = user.Plan ?? "Free",
            PlanExpiresAt = user.PlanExpiresAt
        };
    }

    // ── TOTP ─────────────────────────────────────────────────

    public async Task<LoginResponse> VerifyTotpAsync(VerifyTotpRequest request)
    {
        var (userId, attempts) = ValidatePartialToken(request.PartialToken);
        if (attempts >= 5)
            throw new InvalidOperationException("Too many attempts. Please log in again.");

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (!user.IsTotpEnabled || user.TotpSecret is null)
            throw new UnauthorizedAccessException("TOTP not configured.");

        var secretBytes = Base32Encoding.ToBytes(user.TotpSecret);
        var totp = new Totp(secretBytes);
        // Allow ±1 time step (±30 seconds) to handle minor clock drift
        if (!totp.VerifyTotp(request.Code, out _, new VerificationWindow(previous: 1, future: 1)))
        {
            IncrementAttempts(request.PartialToken, user.Id);
            throw new InvalidOperationException("Invalid authenticator code. Please try again.");
        }

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions, user.DisplayName, user.OrgId, user.Plan),
            Role = roleName, Permissions = permissions,
            IsTotpEnabled = user.IsTotpEnabled,
            TwoFactorRequired = user.TwoFactorRequired,
            TwoFactorMethod = user.TwoFactorMethod,
            OrgId = user.OrgId,
            Plan = user.Plan ?? "Free",
            PlanExpiresAt = user.PlanExpiresAt
        };
    }

    public async Task<TotpSetupResponse> GetTotpSetupAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.IsTotpEnabled)
            throw new InvalidOperationException("TOTP is already active. Disable it before reconfiguring.");

        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(secretBytes);

        // Store tentatively — only committed on verify-setup
        user.TotpSecret = secret;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        var issuer = Uri.EscapeDataString("A365 CRM");
        var account = Uri.EscapeDataString(user.Email);
        var qrUri = $"otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30";

        return new TotpSetupResponse { QrCodeUri = qrUri, Secret = secret };
    }

    public async Task VerifyAndEnableTotpAsync(int userId, VerifyTotpSetupRequest request)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.TotpSecret is null)
            throw new InvalidOperationException("No TOTP secret found. Call setup first.");

        var secretBytes = Base32Encoding.ToBytes(user.TotpSecret);
        var totp = new Totp(secretBytes);
        if (!totp.VerifyTotp(request.Code, out _, VerificationWindow.RfcSpecifiedNetworkDelay))
            throw new UnauthorizedAccessException("Invalid code. TOTP not enabled.");

        user.IsTotpEnabled = true;
        user.TwoFactorRequired = true;
        user.TwoFactorMethod = "totp";
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task DisableTotpAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsTotpEnabled = false;
        user.TotpSecret = null;
        user.TwoFactorRequired = false;
        user.TwoFactorMethod = "email";
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Email OTP Self-Enrollment ────────────────────────────

    public async Task SendEmailOtpEnableAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.TwoFactorRequired && user.TwoFactorMethod == "email" && !user.IsTotpEnabled)
            throw new InvalidOperationException("Email OTP is already enabled.");

        var code = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        user.OtpCode = BCrypt.Net.BCrypt.HashPassword(code);
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        await _emailService.SendOtpEmailAsync(user.Email, user.DisplayName ?? user.Email, code);
    }

    public async Task VerifyAndEnableEmailOtpAsync(int userId, string code)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.OtpCode is null || user.OtpExpiry is null || user.OtpExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("OTP expired. Request a new code.");

        if (!BCrypt.Net.BCrypt.Verify(code, user.OtpCode))
            throw new UnauthorizedAccessException("Invalid code. Please try again.");

        user.OtpCode = null;
        user.OtpExpiry = null;
        user.TwoFactorRequired = true;
        user.TwoFactorMethod = "email";
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task DisableEmailOtpAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.IsTotpEnabled)
            throw new InvalidOperationException("TOTP is active. Disable it first.");

        user.TwoFactorRequired = false;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Admin TOTP Management ────────────────────────────────

    public async Task AdminResetUserTotpAsync(int userId)
    {
        var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        user.IsTotpEnabled = false;
        user.TotpSecret = null;
        user.TwoFactorRequired = false;
        user.TwoFactorMethod = "email";
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Password Reset ───────────────────────────────────────

    public async Task RequestPasswordResetAsync(string email)
    {
        // Use a generic response to avoid account enumeration
        var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return;

        var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        var encodedToken = Uri.EscapeDataString(token);

        user.ResetToken = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        var baseUrl = _config["App:FrontendBaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var resetLink = $"{baseUrl}/reset-password?token={encodedToken}";
        await _emailService.SendPasswordResetEmailAsync(user.Email, user.DisplayName ?? user.Email, resetLink);
    }

    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _uow.Users.Query()
            .FirstOrDefaultAsync(u => u.ResetToken == token && u.ResetTokenExpiry > DateTime.UtcNow)
            ?? throw new InvalidOperationException("Invalid or expired reset token.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Token Helpers ────────────────────────────────────────

    public string GenerateJwtToken(int userId, string email)
        => GenerateJwtToken(userId, email, "User", new List<string>(), null, null, null);

    public string GenerateJwtToken(int userId, string email, string role, List<string> permissions, string? displayName = null, int? orgId = null, string? plan = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, role),
            new(ClaimTypes.Name, displayName ?? email)
        };
        foreach (var perm in permissions)
            claims.Add(new Claim("permission", perm));
        if (orgId.HasValue)
            claims.Add(new Claim("org_id", orgId.Value.ToString()));
        if (!string.IsNullOrEmpty(plan))
            claims.Add(new Claim("plan", plan));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GeneratePartialToken(int userId, string email, string method)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var jti = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, jti),
            new("2fa_pending", "true"),
            new("2fa_method", method)
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private (int userId, int attempts) ValidatePartialToken(string partialToken)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(partialToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidAudience = _config["Jwt:Audience"],
                IssuerSigningKey = key
            }, out _);

            var pending = principal.FindFirst("2fa_pending")?.Value;
            if (pending != "true")
                throw new UnauthorizedAccessException("Invalid partial token.");

            var subValue = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? "0";
            var userId = int.Parse(subValue);
            var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? string.Empty;
            var jtiAttempts = _cache.TryGetValue($"2fa_attempts:{jti}", out int jtiStored) ? jtiStored : 0;
            var userAttempts = _cache.TryGetValue($"2fa_attempts:user:{userId}", out int userStored) ? userStored : 0;
            return (userId, Math.Max(jtiAttempts, userAttempts));
        }
        catch (SecurityTokenException)
        {
            throw new UnauthorizedAccessException("Partial token expired or invalid. Please log in again.");
        }
    }

    private void IncrementAttempts(string partialToken, int userId)
    {
        // Track per JTI (covers current partial token) and per user (covers re-login with fresh JTI).
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(partialToken);
            var jti = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
            if (jti is not null)
            {
                var jtiCount = _cache.TryGetValue($"2fa_attempts:{jti}", out int jtiStored) ? jtiStored : 0;
                _cache.Set($"2fa_attempts:{jti}", jtiCount + 1, TimeSpan.FromMinutes(6));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse partial token for 2FA attempt tracking for userId={UserId}", userId);
        }

        var userKey = $"2fa_attempts:user:{userId}";
        var userCount = _cache.TryGetValue(userKey, out int userStored) ? userStored : 0;
        _cache.Set(userKey, userCount + 1, TimeSpan.FromMinutes(5));
    }

    // ── Permission Caching ───────────────────────────────────

    private async Task<(string roleName, List<string> permissions)> GetUserRoleAndPermissionsAsync(int userId)
    {
        var cacheKey = $"permissions:{userId}";
        if (_cache.TryGetValue(cacheKey, out (string role, List<string> perms) cached))
            return cached;

        var userRoles = await _uow.UserRoles.Query()
            .Where(ur => ur.UserId == userId)
            .Include(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .ToListAsync();

        if (!userRoles.Any())
            return ("User", new List<string>());

        var roleOrder = new[] { "Admin", "Manager", "User" };
        var primaryRole = userRoles
            .OrderBy(ur => Array.IndexOf(roleOrder, ur.Role.Name) is var idx && idx < 0 ? 999 : idx)
            .First().Role;

        var permissions = userRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();

        var result = (primaryRole.Name, permissions);
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));
        return result;
    }
}
