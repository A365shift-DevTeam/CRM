using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class OrganizationService : IOrganizationService
{
    private readonly IUnitOfWork _uow;

    public OrganizationService(IUnitOfWork uow) => _uow = uow;

    public async Task<OrganizationDto> CreateAsync(CreateOrganizationRequest request, int userId)
    {
        var slug = request.Slug.Trim().ToLowerInvariant();

        var existing = (await _uow.Organizations.FindAsync(o => o.Slug == slug)).FirstOrDefault();
        if (existing is not null)
            throw new InvalidOperationException($"Organization slug '{slug}' is already taken.");

        var org = new Organization { Name = request.Name.Trim(), Slug = slug };
        await _uow.Organizations.AddAsync(org);
        await _uow.SaveChangesAsync();

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");
        user.OrgId = org.Id;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        return MapToDto(org);
    }

    public async Task<OrganizationDto?> GetMineAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user?.OrgId is null) return null;

        var org = await _uow.Organizations.GetByIdAsync(user.OrgId.Value);
        return org is null ? null : MapToDto(org);
    }

    public async Task JoinAsync(JoinOrganizationRequest request, int userId)
    {
        var slug = request.Slug.Trim().ToLowerInvariant();
        var org = (await _uow.Organizations.FindAsync(o => o.Slug == slug)).FirstOrDefault()
            ?? throw new KeyNotFoundException($"Organization '{slug}' not found.");

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");
        user.OrgId = org.Id;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task<OrgSalesSettingsDto> GetSalesSettingsAsync(int orgId)
    {
        var settings = (await _uow.OrgSalesSettings.FindAsync(s => s.OrgId == orgId)).FirstOrDefault();
        return settings is not null ? MapSettingsToDto(settings) : DefaultSettings(orgId);
    }

    public async Task<OrgSalesSettingsDto> UpsertSalesSettingsAsync(int orgId, UpsertOrgSalesSettingsRequest request)
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
        OrgId          = orgId,
        ProductStages  = null,
        ServiceStages  = null,
        DeliveryStages = null,
        FinanceStages  = null,
        LegalStages    = null,
        ProductLabel   = "Products",
        ServiceLabel   = "Services",
        UpdatedAt      = DateTime.UtcNow,
    };

    private static OrganizationDto MapToDto(Organization o) => new()
    {
        Id        = o.Id,
        Name      = o.Name,
        Slug      = o.Slug,
        CreatedAt = o.CreatedAt,
    };
}
