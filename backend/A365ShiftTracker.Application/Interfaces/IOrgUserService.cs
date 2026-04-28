using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IOrgUserService
{
    Task<List<UserDto>> GetUsersAsync(int orgId);
    Task<UserDto> CreateUserAsync(int orgId, CreateUserRequest request);
    Task<UserDto> UpdateUserAsync(int orgId, int userId, UpdateUserRequest request);
    Task DeactivateUserAsync(int orgId, int userId);
    Task<List<string>> GetRolePermissionsAsync(int orgId, string role);
    Task SetRolePermissionsAsync(int orgId, string role, List<string> permissionCodes);

    Task<List<OrgRoleDto>> GetAllRolesAsync(int orgId);
    Task<OrgRoleDto> CreateOrUpdateRoleAsync(int orgId, string roleName, List<string> permissionCodes);
    Task DeleteCustomRoleAsync(int orgId, string roleName);
}
