using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _uow;

    public AdminService(IUnitOfWork uow) => _uow = uow;

    // ─── Users ─────────────────────────────────────────────────

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _uow.Users.Query()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .AsNoTracking()
            .ToListAsync();

        return users.Select(MapUserToDto);
    }

    public async Task<UserDto> UpdateUserRolesAsync(int userId, UpdateUserRolesRequest request)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        // Remove existing roles
        var existingRoles = await _uow.UserRoles.FindAsync(ur => ur.UserId == userId);
        foreach (var ur in existingRoles)
            await _uow.UserRoles.DeleteAsync(ur);

        // Add new roles
        foreach (var roleId in request.RoleIds)
        {
            await _uow.UserRoles.AddAsync(new UserRole
            {
                UserId = userId,
                RoleId = roleId
            });
        }

        await _uow.SaveChangesAsync();

        // Return updated user
        var updated = await _uow.Users.Query()
            .Where(u => u.Id == userId)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstAsync();

        return MapUserToDto(updated);
    }

    public async Task<UserDto> UpdateUserStatusAsync(int userId, UpdateUserStatusRequest request)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = request.IsActive;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        var updated = await _uow.Users.Query()
            .Where(u => u.Id == userId)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstAsync();

        return MapUserToDto(updated);
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        // Remove user roles first
        var userRoles = await _uow.UserRoles.FindAsync(ur => ur.UserId == userId);
        foreach (var ur in userRoles)
            await _uow.UserRoles.DeleteAsync(ur);

        await _uow.Users.DeleteAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task AdminResetPasswordAsync(int userId, AdminResetPasswordRequest request)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            throw new InvalidOperationException("Password must be at least 6 characters.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ─── Roles ─────────────────────────────────────────────────

    public async Task<IEnumerable<RoleDto>> GetAllRolesAsync()
    {
        var roles = await _uow.Roles.Query()
            .Include(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .AsNoTracking()
            .ToListAsync();

        return roles.Select(r => new RoleDto
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            IsSystem = r.IsSystem,
            Permissions = r.RolePermissions.Select(rp => rp.Permission.Code).ToList()
        });
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request)
    {
        var existing = await _uow.Roles.FindAsync(r => r.Name == request.Name);
        if (existing.Any())
            throw new InvalidOperationException("Role name already exists.");

        var role = new Role
        {
            Name = request.Name,
            Description = request.Description,
            IsSystem = false
        };

        await _uow.Roles.AddAsync(role);
        await _uow.SaveChangesAsync();

        // Assign permissions
        foreach (var permId in request.PermissionIds)
        {
            await _uow.RolePermissions.AddAsync(new RolePermission
            {
                RoleId = role.Id,
                PermissionId = permId
            });
        }
        await _uow.SaveChangesAsync();

        return (await GetAllRolesAsync()).First(r => r.Id == role.Id);
    }

    public async Task<RoleDto> UpdateRoleAsync(int roleId, UpdateRoleRequest request)
    {
        var role = await _uow.Roles.GetByIdAsync(roleId)
            ?? throw new KeyNotFoundException("Role not found.");

        if (role.IsSystem && request.Name != null && request.Name != role.Name)
            throw new InvalidOperationException("Cannot rename system roles.");

        if (request.Name != null) role.Name = request.Name;
        if (request.Description != null) role.Description = request.Description;

        await _uow.Roles.UpdateAsync(role);

        // Update permissions if provided
        if (request.PermissionIds != null)
        {
            var existingPerms = await _uow.RolePermissions.FindAsync(rp => rp.RoleId == roleId);
            foreach (var rp in existingPerms)
                await _uow.RolePermissions.DeleteAsync(rp);

            foreach (var permId in request.PermissionIds)
            {
                await _uow.RolePermissions.AddAsync(new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = permId
                });
            }
        }

        await _uow.SaveChangesAsync();
        return (await GetAllRolesAsync()).First(r => r.Id == roleId);
    }

    public async Task DeleteRoleAsync(int roleId)
    {
        var role = await _uow.Roles.GetByIdAsync(roleId)
            ?? throw new KeyNotFoundException("Role not found.");

        if (role.IsSystem)
            throw new InvalidOperationException("Cannot delete system roles.");

        await _uow.Roles.DeleteAsync(role);
        await _uow.SaveChangesAsync();
    }

    // ─── Permissions ───────────────────────────────────────────

    public async Task<IEnumerable<PermissionDto>> GetAllPermissionsAsync()
    {
        var permissions = await _uow.Permissions.GetAllAsync();
        return permissions.Select(p => new PermissionDto
        {
            Id = p.Id,
            Module = p.Module,
            Action = p.Action,
            Code = p.Code,
            Description = p.Description
        });
    }

    // ─── Helpers ───────────────────────────────────────────────

    private static UserDto MapUserToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        DisplayName = user.DisplayName,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
        Permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList()
    };
}
