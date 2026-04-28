using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ISuperAdminService
{
    Task<OrganizationDto> CreateOrganizationAsync(CreateOrganizationRequest request);
    Task<List<OrganizationDto>> GetAllOrganizationsAsync();
    Task<OrganizationDto> UpdateOrganizationStatusAsync(int orgId, string status);
    Task<OrganizationDto> SetUserLimitAsync(int orgId, int userLimit);
    Task<UserDto> CreateOrgAdminAsync(int orgId, CreateUserRequest request);
    Task<List<UserDto>> GetOrgUsersAsync(int orgId);
    Task<UserDto> UpdateOrgUserAsync(int orgId, int userId, UpdateUserRequest request);
    Task<UserDto> ToggleUserActiveAsync(int orgId, int userId, bool isActive);
    Task DeleteOrgUserAsync(int orgId, int userId);

    Task<SuperAdminAuditLogPageDto> GetAuditLogsAsync(
        int? orgId, int? userId, string? entityName,
        DateTime? startDate, DateTime? endDate,
        int page, int pageSize);
}
