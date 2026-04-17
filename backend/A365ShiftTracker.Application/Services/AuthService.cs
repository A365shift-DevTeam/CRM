using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OtpNet;

namespace A365ShiftTracker.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly IMemoryCache _cache;

    public AuthService(IUnitOfWork uow, IConfiguration config, IEmailService emailService, IMemoryCache cache)
    {
        _uow = uow;
        _config = config;
        _emailService = emailService;
        _cache = cache;
    }

    // ── Register ────────────────────────────────────────────

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existing = await _uow.Users.FindAsync(u => u.Email == request.Email);
        if (existing.Any())
            throw new InvalidOperationException("Email already registered.");

        var user = new Domain.Entities.User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName
        };

        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();

        var defaultRole = (await _uow.Roles.FindAsync(r => r.Name == "User")).FirstOrDefault();
        if (defaultRole != null)
        {
            await _uow.UserRoles.AddAsync(new Domain.Entities.UserRole
            {
                UserId = user.Id,
                RoleId = defaultRole.Id
            });
            await _uow.SaveChangesAsync();
        }

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new AuthResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions
        };
    }

    // ── Login ───────────────────────────────────────────────

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var users = await _uow.Users.FindAsync(u => u.Email == request.Email);
        var user = users.FirstOrDefault()
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated. Contact your administrator.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        user.LastLoginAt = DateTime.UtcNow;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        // 2FA required — issue partial token
        if (user.TwoFactorRequired)
        {
            var partialToken = GeneratePartialToken(user.Id, user.Email, user.TwoFactorMethod);
            return new LoginResponse
            {
                Requires2FA = true,
                TwoFactorMethod = user.TwoFactorMethod,
                PartialToken = partialToken
            };
        }

        // No 2FA — issue full token
        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions,
            Requires2FA = false
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
            throw new UnauthorizedAccessException("Too many attempts. Please log in again.");

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (user.OtpCode is null || user.OtpExpiry is null || user.OtpExpiry < DateTime.UtcNow)
            throw new UnauthorizedAccessException("OTP expired. Request a new code.");

        if (!BCrypt.Net.BCrypt.Verify(request.Code, user.OtpCode))
        {
            IncrementAttempts(request.PartialToken);
            throw new UnauthorizedAccessException("Invalid code.");
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
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions
        };
    }

    // ── TOTP ─────────────────────────────────────────────────

    public async Task<LoginResponse> VerifyTotpAsync(VerifyTotpRequest request)
    {
        var (userId, attempts) = ValidatePartialToken(request.PartialToken);
        if (attempts >= 5)
            throw new UnauthorizedAccessException("Too many attempts. Please log in again.");

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (!user.IsTotpEnabled || user.TotpSecret is null)
            throw new UnauthorizedAccessException("TOTP not configured.");

        var secretBytes = Base32Encoding.ToBytes(user.TotpSecret);
        var totp = new Totp(secretBytes);
        if (!totp.VerifyTotp(request.Code, out _, VerificationWindow.RfcSpecifiedNetworkDelay))
        {
            IncrementAttempts(request.PartialToken);
            throw new UnauthorizedAccessException("Invalid authenticator code.");
        }

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions
        };
    }

    public async Task<TotpSetupResponse> GetTotpSetupAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

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
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task DisableTotpAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsTotpEnabled = false;
        user.TotpSecret = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Password Reset ───────────────────────────────────────

    public async Task<string> RequestPasswordResetAsync(string email)
    {
        var users = await _uow.Users.FindAsync(u => u.Email == email);
        var user = users.FirstOrDefault()
            ?? throw new KeyNotFoundException("No account found with that email.");

        var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.ResetToken = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
        return token;
    }

    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var users = await _uow.Users.FindAsync(u =>
            u.ResetToken == token && u.ResetTokenExpiry > DateTime.UtcNow);
        var user = users.FirstOrDefault()
            ?? throw new InvalidOperationException("Invalid or expired reset token.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Token Helpers ────────────────────────────────────────

    public string GenerateJwtToken(int userId, string email)
        => GenerateJwtToken(userId, email, "User", new List<string>());

    public string GenerateJwtToken(int userId, string email, string role, List<string> permissions)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, role)
        };
        foreach (var perm in permissions)
            claims.Add(new Claim("permission", perm));

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

            var userId = int.Parse(principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "0");
            var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? string.Empty;
            var attempts = _cache.TryGetValue($"2fa_attempts:{jti}", out int stored) ? stored : 0;
            return (userId, attempts);
        }
        catch (SecurityTokenException)
        {
            throw new UnauthorizedAccessException("Partial token expired or invalid. Please log in again.");
        }
    }

    private void IncrementAttempts(string partialToken)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(partialToken);
            var jti = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
            if (jti is null) return;
            var current = _cache.TryGetValue($"2fa_attempts:{jti}", out int stored) ? stored : 0;
            _cache.Set($"2fa_attempts:{jti}", current + 1, TimeSpan.FromMinutes(6));
        }
        catch { /* ignore parse errors */ }
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
