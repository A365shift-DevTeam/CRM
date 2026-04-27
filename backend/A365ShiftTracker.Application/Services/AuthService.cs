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

    // ── Login ───────────────────────────────────────────────

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email == request.Email)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated. Contact your administrator.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        // Org status check (non-SUPER_ADMIN)
        if (user.Role != "SUPER_ADMIN" && user.Organization != null &&
            user.Organization.Status == "SUSPENDED")
            throw new UnauthorizedAccessException("Your organization has been suspended. Contact support.");

        user.LastLoginAt = DateTime.UtcNow;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        // 2FA required
        if (user.TwoFactorRequired || user.IsTotpEnabled)
        {
            if (user.TwoFactorMethod == "totp" && !user.IsTotpEnabled)
            {
                var permissions = await GetPermissionsAsync(user);
                return new LoginResponse
                {
                    Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
                    Token = GenerateJwtToken(user, permissions),
                    Role = user.Role, Permissions = permissions,
                    IsTotpEnabled = false,
                    TwoFactorRequired = user.TwoFactorRequired,
                    TwoFactorMethod = user.TwoFactorMethod,
                    TotpSetupRequired = true,
                    OrgId = user.OrgId,
                    IsFirstLogin = user.IsFirstLogin,
                    OrgStatus = user.Organization?.Status
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

        var perms = await GetPermissionsAsync(user);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user, perms),
            Role = user.Role, Permissions = perms,
            Requires2FA = false,
            IsTotpEnabled = user.IsTotpEnabled,
            TwoFactorRequired = user.TwoFactorRequired,
            TwoFactorMethod = user.TwoFactorMethod,
            OrgId = user.OrgId,
            IsFirstLogin = user.IsFirstLogin,
            OrgStatus = user.Organization?.Status
        };
    }

    // ── First-login password reset ──────────────────────────

    public async Task ResetFirstPasswordAsync(int userId, string newPassword)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!user.IsFirstLogin)
            throw new InvalidOperationException("Password has already been reset.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.IsFirstLogin = false;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
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

        var user = await _uow.Users.Query()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (user.OtpCode is null || user.OtpExpiry is null || user.OtpExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("OTP expired. Request a new code.");

        if (!BCrypt.Net.BCrypt.Verify(request.Code, user.OtpCode))
        {
            IncrementAttempts(request.PartialToken, user.Id);
            throw new InvalidOperationException("Invalid code. Please try again.");
        }

        user.OtpCode = null;
        user.OtpExpiry = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        var perms = await GetPermissionsAsync(user);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user, perms),
            Role = user.Role, Permissions = perms,
            IsTotpEnabled = user.IsTotpEnabled,
            TwoFactorRequired = user.TwoFactorRequired,
            TwoFactorMethod = user.TwoFactorMethod,
            OrgId = user.OrgId,
            IsFirstLogin = user.IsFirstLogin,
            OrgStatus = user.Organization?.Status
        };
    }

    // ── TOTP ─────────────────────────────────────────────────

    public async Task<LoginResponse> VerifyTotpAsync(VerifyTotpRequest request)
    {
        var (userId, attempts) = ValidatePartialToken(request.PartialToken);
        if (attempts >= 5)
            throw new InvalidOperationException("Too many attempts. Please log in again.");

        var user = await _uow.Users.Query()
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (!user.IsTotpEnabled || user.TotpSecret is null)
            throw new UnauthorizedAccessException("TOTP not configured.");

        var secretBytes = Base32Encoding.ToBytes(user.TotpSecret);
        var totp = new Totp(secretBytes);
        if (!totp.VerifyTotp(request.Code, out _, new VerificationWindow(previous: 1, future: 1)))
        {
            IncrementAttempts(request.PartialToken, user.Id);
            throw new InvalidOperationException("Invalid authenticator code. Please try again.");
        }

        var perms = await GetPermissionsAsync(user);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user, perms),
            Role = user.Role, Permissions = perms,
            IsTotpEnabled = user.IsTotpEnabled,
            TwoFactorRequired = user.TwoFactorRequired,
            TwoFactorMethod = user.TwoFactorMethod,
            OrgId = user.OrgId,
            IsFirstLogin = user.IsFirstLogin,
            OrgStatus = user.Organization?.Status
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

    // ── Token helpers ────────────────────────────────────────

    public string GenerateJwtToken(int userId, string email)
        => GenerateJwtToken(new Domain.Entities.User { Id = userId, Email = email, Role = "EMPLOYEE" }, new List<string>());

    public string GenerateJwtToken(Domain.Entities.User user, List<string> permissions)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, user.Role),
            new(ClaimTypes.Name, user.DisplayName ?? user.Email),
            new("is_first_login", user.IsFirstLogin.ToString().ToLower())
        };
        foreach (var perm in permissions)
            claims.Add(new Claim("permission", perm));
        if (user.OrgId.HasValue)
            claims.Add(new Claim("org_id", user.OrgId.Value.ToString()));

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
                ValidateIssuer = true, ValidateAudience = true,
                ValidateLifetime = true, ValidateIssuerSigningKey = true,
                ValidIssuer = _config["Jwt:Issuer"], ValidAudience = _config["Jwt:Audience"],
                IssuerSigningKey = key
            }, out _);

            if (principal.FindFirst("2fa_pending")?.Value != "true")
                throw new UnauthorizedAccessException("Invalid partial token.");

            var sub = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                   ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
            var userId = int.Parse(sub);
            var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? string.Empty;
            var jtiAttempts = _cache.TryGetValue($"2fa_attempts:{jti}", out int j) ? j : 0;
            var userAttempts = _cache.TryGetValue($"2fa_attempts:user:{userId}", out int u) ? u : 0;
            return (userId, Math.Max(jtiAttempts, userAttempts));
        }
        catch (SecurityTokenException)
        {
            throw new UnauthorizedAccessException("Partial token expired or invalid. Please log in again.");
        }
    }

    private void IncrementAttempts(string partialToken, int userId)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(partialToken);
            var jti = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
            if (jti is not null)
            {
                var jtiCount = _cache.TryGetValue($"2fa_attempts:{jti}", out int j) ? j : 0;
                _cache.Set($"2fa_attempts:{jti}", jtiCount + 1, TimeSpan.FromMinutes(6));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse partial token for 2FA tracking userId={UserId}", userId);
        }

        var userKey = $"2fa_attempts:user:{userId}";
        var userCount = _cache.TryGetValue(userKey, out int uc) ? uc : 0;
        _cache.Set(userKey, userCount + 1, TimeSpan.FromMinutes(5));
    }

    // ── Permission resolution ────────────────────────────────

    private async Task<List<string>> GetPermissionsAsync(Domain.Entities.User user)
    {
        // SUPER_ADMIN and ORG_ADMIN have all permissions (not stored in DB)
        if (user.Role == "SUPER_ADMIN" || user.Role == "ORG_ADMIN")
            return await _uow.Permissions.Query().Select(p => p.Code).ToListAsync();

        if (!user.OrgId.HasValue)
            return new List<string>();

        var cacheKey = $"org_perms:{user.OrgId}:{user.Role}";
        if (_cache.TryGetValue(cacheKey, out List<string>? cached) && cached != null)
            return cached;

        var perms = await _uow.OrgRolePermissions.Query()
            .Where(p => p.OrgId == user.OrgId && p.Role == user.Role)
            .Select(p => p.PermissionCode)
            .ToListAsync();

        _cache.Set(cacheKey, perms, TimeSpan.FromMinutes(5));
        return perms;
    }
}
