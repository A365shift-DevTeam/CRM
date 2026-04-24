using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IOrganizationService
{
    Task<OrganizationDto> CreateAsync(CreateOrganizationRequest request, int userId);
    Task<OrganizationDto?> GetMineAsync(int userId);
    Task JoinAsync(JoinOrganizationRequest request, int userId);
    Task<OrgSalesSettingsDto> GetSalesSettingsAsync(int orgId);
    Task<OrgSalesSettingsDto> UpsertSalesSettingsAsync(int orgId, UpsertOrgSalesSettingsRequest request);
}
