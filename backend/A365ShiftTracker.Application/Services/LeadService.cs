using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class LeadService : ILeadService
{
    private readonly IUnitOfWork _uow;

    public LeadService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<LeadDto>> GetAllAsync(int orgId, int page, int pageSize)
    {
        var paged = await _uow.Leads.GetPagedAsync(
            l => l.OrgId == orgId && !l.IsDeleted,
            page,
            pageSize,
            q => q.OrderByDescending(l => l.CreatedAt));
        return new PagedResult<LeadDto>
        {
            Items = paged.Items.Select(MapToDto),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        };
    }

    public async Task<LeadDto> CreateAsync(CreateLeadRequest request, int userId, int orgId)
    {
        var entity = new Lead
        {
            UserId = userId,
            OrgId = orgId,
            ContactId = request.ContactId,
            ContactName = request.ContactName,
            Company = request.Company,
            Source = request.Source ?? "Inbound",
            Score = request.Score ?? "Warm",
            Stage = request.Stage ?? "New",
            AssignedTo = request.AssignedTo,
            Notes = request.Notes,
            Type = request.Type,
            ExpectedValue = request.ExpectedValue,
            ExpectedCloseDate = ToUtc(request.ExpectedCloseDate),
        };

        await _uow.Leads.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<LeadDto> UpdateAsync(int id, UpdateLeadRequest request, int userId, int orgId)
    {
        var entity = await _uow.Leads.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Lead {id} not found.");

        if (entity.OrgId != orgId)
            throw new UnauthorizedAccessException("You do not have access to this lead.");

        entity.ContactId = request.ContactId;
        entity.ContactName = request.ContactName;
        entity.Company = request.Company;
        entity.Source = request.Source ?? entity.Source;
        entity.Score = request.Score ?? entity.Score;
        entity.Stage = request.Stage ?? entity.Stage;
        entity.AssignedTo = request.AssignedTo;
        entity.Notes = request.Notes;
        entity.Type = request.Type;
        entity.ExpectedValue = request.ExpectedValue;
        entity.ExpectedCloseDate = ToUtc(request.ExpectedCloseDate);

        await _uow.Leads.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId, int orgId)
    {
        var entity = await _uow.Leads.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Lead {id} not found.");

        if (entity.OrgId != orgId)
            throw new UnauthorizedAccessException("You do not have access to this lead.");

        await _uow.Leads.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static DateTime? ToUtc(DateTime? dt) =>
        dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

    private static LeadDto MapToDto(Lead l) => new()
    {
        Id = l.Id, ContactId = l.ContactId, ContactName = l.ContactName,
        Company = l.Company, Source = l.Source, Score = l.Score, Stage = l.Stage,
        AssignedTo = l.AssignedTo, Notes = l.Notes, Type = l.Type, ExpectedValue = l.ExpectedValue,
        ExpectedCloseDate = l.ExpectedCloseDate, CreatedAt = l.CreatedAt,
    };
}
