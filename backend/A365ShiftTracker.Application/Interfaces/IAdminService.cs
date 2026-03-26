using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IAdminService
{
    // Users
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto> UpdateUserRolesAsync(int userId, UpdateUserRolesRequest request);
    Task<UserDto> UpdateUserStatusAsync(int userId, UpdateUserStatusRequest request);

    // Roles
    Task<IEnumerable<RoleDto>> GetAllRolesAsync();
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request);
    Task<RoleDto> UpdateRoleAsync(int roleId, UpdateRoleRequest request);
    Task DeleteRoleAsync(int roleId);

    // Permissions
    Task<IEnumerable<PermissionDto>> GetAllPermissionsAsync();
}
