using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ISuperAdminService
{
    Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationRequest request);
    Task<List<OrganizationDto>> GetAllOrganizationsAsync();
    Task<OrganizationDto> UpdateOrganizationStatusAsync(int orgId, string status);
    Task<UserDto> CreateOrgAdminAsync(int orgId, CreateUserRequest request);
    Task<List<UserDto>> GetOrgUsersAsync(int orgId);
    Task RemoveUserFromOrgAsync(int orgId, int userId);
}
