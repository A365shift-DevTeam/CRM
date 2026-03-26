using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IDocumentService
{
    Task<IEnumerable<DocumentDto>> GetAllAsync(int userId);
    Task<IEnumerable<DocumentDto>> GetByEntityAsync(string entityType, int entityId, int userId);
    Task<DocumentDto> CreateAsync(CreateDocumentRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
