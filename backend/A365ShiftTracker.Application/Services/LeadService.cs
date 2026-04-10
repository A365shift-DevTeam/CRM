using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class LeadService : ILeadService
{
    private readonly IUnitOfWork _uow;

    public LeadService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<LeadDto>> GetAllAsync(int userId)
    {
        var leads = await _uow.Leads.FindAsync(l => l.UserId == userId);
        return leads.OrderByDescending(l => l.CreatedAt).Select(MapToDto);
    }

    public async Task<LeadDto> CreateAsync(CreateLeadRequest request, int userId)
    {
        var entity = new Lead
        {
            UserId = userId,
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
            ExpectedCloseDate = request.ExpectedCloseDate,
        };

        await _uow.Leads.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<LeadDto> UpdateAsync(int id, UpdateLeadRequest request, int userId)
    {
        var entity = await _uow.Leads.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Lead {id} not found.");

        if (entity.UserId != userId)
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
        entity.ExpectedCloseDate = request.ExpectedCloseDate;

        await _uow.Leads.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Leads.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Lead {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this lead.");

        await _uow.Leads.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static LeadDto MapToDto(Lead l) => new()
    {
        Id = l.Id, ContactId = l.ContactId, ContactName = l.ContactName,
        Company = l.Company, Source = l.Source, Score = l.Score, Stage = l.Stage,
        AssignedTo = l.AssignedTo, Notes = l.Notes, Type = l.Type, ExpectedValue = l.ExpectedValue,
        ExpectedCloseDate = l.ExpectedCloseDate, CreatedAt = l.CreatedAt,
    };
}
