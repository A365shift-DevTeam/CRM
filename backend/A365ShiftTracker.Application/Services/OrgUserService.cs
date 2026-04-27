using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class OrgUserService : IOrgUserService
{
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _emailService;

    public OrgUserService(IUnitOfWork uow, IEmailService emailService)
    {
        _uow = uow;
        _emailService = emailService;
    }

    public async Task<List<UserDto>> GetUsersAsync(int orgId)
    {
        var users = await _uow.Users.Query()
            .Where(u => u.OrgId == orgId)
            .ToListAsync();

        return users.Select(MapUser).ToList();
    }

    public async Task<UserDto> CreateUserAsync(int orgId, CreateUserRequest request)
    {
        var validRoles = new[] { "MANAGER", "EMPLOYEE" };
        if (!validRoles.Contains(request.Role))
            throw new ArgumentException("ORG_ADMIN can only create MANAGER or EMPLOYEE users.");

        var org = await _uow.Organizations.GetByIdAsync(orgId)
            ?? throw new KeyNotFoundException($"Organization {orgId} not found.");

        var exists = await _uow.Users.Query().AnyAsync(u => u.Email == request.Email);
        if (exists)
            throw new InvalidOperationException("Email already registered.");

        var tempPassword = GenerateTempPassword();
        var user = new User
        {
            Email = request.Email,
            DisplayName = request.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            Role = request.Role,
            OrgId = orgId,
            IsFirstLogin = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();

        await _emailService.SendWelcomeEmailAsync(user.Email, user.DisplayName ?? user.Email, org.Name, tempPassword);

        return MapUser(user);
    }

    public async Task<UserDto> UpdateUserAsync(int orgId, int userId, UpdateUserRequest request)
    {
        var user = await _uow.Users.Query()
            .FirstOrDefaultAsync(u => u.Id == userId && u.OrgId == orgId)
            ?? throw new KeyNotFoundException("User not found in this organization.");

        if (user.Role == "ORG_ADMIN" || user.Role == "SUPER_ADMIN")
            throw new InvalidOperationException("Cannot modify admin-level users.");

        if (request.DisplayName != null)
            user.DisplayName = request.DisplayName;

        if (request.Role != null)
        {
            var validRoles = new[] { "MANAGER", "EMPLOYEE" };
            if (!validRoles.Contains(request.Role))
                throw new ArgumentException("Role must be MANAGER or EMPLOYEE.");
            user.Role = request.Role;
        }

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        return MapUser(user);
    }

    public async Task DeactivateUserAsync(int orgId, int userId)
    {
        var user = await _uow.Users.Query()
            .FirstOrDefaultAsync(u => u.Id == userId && u.OrgId == orgId)
            ?? throw new KeyNotFoundException("User not found in this organization.");

        if (user.Role is "ORG_ADMIN" or "SUPER_ADMIN")
            throw new InvalidOperationException("Cannot deactivate admin-level users.");

        user.IsActive = false;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task<List<string>> GetRolePermissionsAsync(int orgId, string role)
    {
        ValidateConfigurableRole(role);

        return await _uow.OrgRolePermissions.Query()
            .Where(p => p.OrgId == orgId && p.Role == role)
            .Select(p => p.PermissionCode)
            .ToListAsync();
    }

    public async Task SetRolePermissionsAsync(int orgId, string role, List<string> permissionCodes)
    {
        ValidateConfigurableRole(role);

        // Remove existing
        var existing = await _uow.OrgRolePermissions.Query()
            .Where(p => p.OrgId == orgId && p.Role == role)
            .ToListAsync();

        foreach (var e in existing)
            await _uow.OrgRolePermissions.DeleteAsync(e);

        // Add new
        foreach (var code in permissionCodes.Distinct())
        {
            await _uow.OrgRolePermissions.AddAsync(new OrgRolePermission
            {
                OrgId = orgId,
                Role = role,
                PermissionCode = code
            });
        }

        await _uow.SaveChangesAsync();
    }

    private static void ValidateConfigurableRole(string role)
    {
        if (role != "MANAGER" && role != "EMPLOYEE")
            throw new ArgumentException("Only MANAGER and EMPLOYEE permissions are configurable.");
    }

    private static UserDto MapUser(User u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        DisplayName = u.DisplayName,
        Role = u.Role,
        IsActive = u.IsActive,
        IsFirstLogin = u.IsFirstLogin,
        CreatedAt = u.CreatedAt,
        LastLoginAt = u.LastLoginAt,
        OrgId = u.OrgId
    };

    private static string GenerateTempPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
        var rng = System.Security.Cryptography.RandomNumberGenerator.GetBytes(12);
        return new string(rng.Select(b => chars[b % chars.Length]).ToArray());
    }
}
