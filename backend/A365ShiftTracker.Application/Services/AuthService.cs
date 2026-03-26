using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace A365ShiftTracker.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public AuthService(IUnitOfWork uow, IConfiguration config)
    {
        _uow = uow;
        _config = config;
    }

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

        // Assign default "User" role (Id = 3)
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
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName,
            Permissions = permissions
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
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

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);

        return new AuthResponse
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName,
            Permissions = permissions
        };
    }

    public string GenerateJwtToken(int userId, string email)
    {
        return GenerateJwtToken(userId, email, "User", new List<string>());
    }

    public string GenerateJwtToken(int userId, string email, string role, List<string> permissions)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, role)
        };

        // Add each permission as a claim
        foreach (var perm in permissions)
        {
            claims.Add(new Claim("permission", perm));
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

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

    private async Task<(string roleName, List<string> permissions)> GetUserRoleAndPermissionsAsync(int userId)
    {
        // Get user's roles
        var userRoles = await _uow.UserRoles.Query()
            .Where(ur => ur.UserId == userId)
            .Include(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .ToListAsync();

        if (!userRoles.Any())
            return ("User", new List<string>());

        // Use the highest-priority role (Admin > Manager > User)
        var roleOrder = new[] { "Admin", "Manager", "User" };
        var primaryRole = userRoles
            .OrderBy(ur => Array.IndexOf(roleOrder, ur.Role.Name) is var idx && idx < 0 ? 999 : idx)
            .First().Role;

        // Collect all permissions from all assigned roles (union)
        var permissions = userRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();

        return (primaryRole.Name, permissions);
    }
}
