using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class NoteService : INoteService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<NoteService> _logger;

    public NoteService(IUnitOfWork uow, ILogger<NoteService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<IEnumerable<NoteDto>> GetByEntityAsync(string entityType, int entityId, int userId)
    {
        try
        {
            var notes = await _uow.Notes.FindAsync(n =>
                n.UserId == userId && n.EntityType == entityType && n.EntityId == entityId);
            return notes.OrderByDescending(n => n.CreatedAt).Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetByEntityAsync));
            throw;
        }
    }

    public async Task<NoteDto> CreateAsync(CreateNoteRequest request, int userId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task<NoteDto> UpdateAsync(int id, UpdateNoteRequest request, int userId)
    {
        try
        {
            var entity = await _uow.Notes.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Note {id} not found.");
            if (entity.UserId != userId) throw new UnauthorizedAccessException();
            entity.Content = request.Content;
            await _uow.Notes.UpdateAsync(entity);
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateAsync));
            throw;
        }
    }

    public async Task DeleteAsync(int id, int userId)
    {
        try
        {
            var entity = await _uow.Notes.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Note {id} not found.");
            if (entity.UserId != userId) throw new UnauthorizedAccessException();
            await _uow.Notes.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
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

