using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface INoteService
{
    Task<IEnumerable<NoteDto>> GetByEntityAsync(string entityType, int entityId, int userId);
    Task<NoteDto> CreateAsync(CreateNoteRequest request, int userId);
    Task<NoteDto> UpdateAsync(int id, UpdateNoteRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
