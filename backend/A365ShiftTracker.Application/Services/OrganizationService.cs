using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class OrganizationService : IOrganizationService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<OrganizationService> _logger;

    public OrganizationService(IUnitOfWork uow, ILogger<OrganizationService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<OrganizationDto?> GetCurrentOrgAsync(int orgId)
    {
        try
        {
            var org = await _uow.Organizations.Query()
                .Include(o => o.Members)
                .FirstOrDefaultAsync(o => o.Id == orgId);
            return org is null ? null : MapToDto(org, org.Members.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetCurrentOrgAsync));
            throw;
        }
    }

    public async Task<OrgSalesSettingsDto> GetSalesSettingsAsync(int orgId)
    {
        try
        {
            var settings = (await _uow.OrgSalesSettings.FindAsync(s => s.OrgId == orgId)).FirstOrDefault();
            return settings is not null ? MapSettingsToDto(settings) : DefaultSettings(orgId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetSalesSettingsAsync));
            throw;
        }
    }

    public async Task<OrgSalesSettingsDto> UpsertSalesSettingsAsync(int orgId, UpsertOrgSalesSettingsRequest request)
    {
        try
        {
            var settings = (await _uow.OrgSalesSettings.FindAsync(s => s.OrgId == orgId)).FirstOrDefault();
    
            if (settings is null)
            {
                settings = new OrgSalesSettings { OrgId = orgId };
                ApplyRequest(settings, request);
                await _uow.OrgSalesSettings.AddAsync(settings);
            }
            else
            {
                ApplyRequest(settings, request);
                settings.UpdatedAt = DateTime.UtcNow;
                await _uow.OrgSalesSettings.UpdateAsync(settings);
            }
    
            await _uow.SaveChangesAsync();
            return MapSettingsToDto(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpsertSalesSettingsAsync));
            throw;
        }
    }

    private static void ApplyRequest(OrgSalesSettings s, UpsertOrgSalesSettingsRequest r)
    {
        if (r.ProductStages is not null)  s.ProductStages  = JsonSerializer.Serialize(r.ProductStages);
        if (r.ServiceStages is not null)  s.ServiceStages  = JsonSerializer.Serialize(r.ServiceStages);
        if (r.DeliveryStages is not null) s.DeliveryStages = JsonSerializer.Serialize(r.DeliveryStages);
        if (r.FinanceStages is not null)  s.FinanceStages  = JsonSerializer.Serialize(r.FinanceStages);
        if (r.LegalStages is not null)    s.LegalStages    = JsonSerializer.Serialize(r.LegalStages);
        s.ProductLabel = r.ProductLabel;
        s.ServiceLabel = r.ServiceLabel;
    }

    private static OrgSalesSettingsDto MapSettingsToDto(OrgSalesSettings s) => new()
    {
        OrgId          = s.OrgId,
        ProductStages  = JsonSerializer.Deserialize<object>(s.ProductStages),
        ServiceStages  = JsonSerializer.Deserialize<object>(s.ServiceStages),
        DeliveryStages = JsonSerializer.Deserialize<object>(s.DeliveryStages),
        FinanceStages  = JsonSerializer.Deserialize<object>(s.FinanceStages),
        LegalStages    = JsonSerializer.Deserialize<object>(s.LegalStages),
        ProductLabel   = s.ProductLabel,
        ServiceLabel   = s.ServiceLabel,
        UpdatedAt      = s.UpdatedAt,
    };

    private static OrgSalesSettingsDto DefaultSettings(int orgId) => new()
    {
        OrgId = orgId, ProductLabel = "Products", ServiceLabel = "Services",
        UpdatedAt = DateTime.UtcNow,
    };

    private static OrganizationDto MapToDto(Organization o, int userCount) => new()
    {
        Id = o.Id, Name = o.Name, Slug = o.Slug,
        Status = o.Status, CreatedAt = o.CreatedAt,
        TrialEndsAt = o.TrialEndsAt, SuspendedAt = o.SuspendedAt,
        UserCount = userCount, UserLimit = o.UserLimit
    };
}

