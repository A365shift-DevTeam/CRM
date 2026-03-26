using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class NoteService : INoteService
{
    private readonly IUnitOfWork _uow;

    public NoteService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<NoteDto>> GetByEntityAsync(string entityType, int entityId, int userId)
    {
        var notes = await _uow.Notes.FindAsync(n =>
            n.UserId == userId && n.EntityType == entityType && n.EntityId == entityId);
        return notes.OrderByDescending(n => n.CreatedAt).Select(MapToDto);
    }

    public async Task<NoteDto> CreateAsync(CreateNoteRequest request, int userId)
    {
        var entity = new Note
        {
            UserId = userId,
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            Content = request.Content
        };
        await _uow.Notes.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<NoteDto> UpdateAsync(int id, UpdateNoteRequest request, int userId)
    {
        var entity = await _uow.Notes.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Note {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        entity.Content = request.Content;
        await _uow.Notes.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Notes.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Note {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        await _uow.Notes.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static NoteDto MapToDto(Note n) => new()
    {
        Id = n.Id,
        UserId = n.UserId,
        EntityType = n.EntityType,
        EntityId = n.EntityId,
        Content = n.Content,
        CreatedAt = n.CreatedAt,
        UpdatedAt = n.UpdatedAt
    };
}
