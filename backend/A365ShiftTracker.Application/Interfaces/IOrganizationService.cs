using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IOrganizationService
{
    Task<OrganizationDto?> GetCurrentOrgAsync(int orgId);
    Task<OrgSalesSettingsDto> GetSalesSettingsAsync(int orgId);
    Task<OrgSalesSettingsDto> UpsertSalesSettingsAsync(int orgId, UpsertOrgSalesSettingsRequest request);
}
