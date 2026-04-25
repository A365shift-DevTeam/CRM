using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IDocumentService
{
    Task<IEnumerable<DocumentDto>> GetAllAsync(int orgId);
    Task<IEnumerable<DocumentDto>> GetByEntityAsync(string entityType, int entityId, int orgId);
    Task<DocumentDto> CreateAsync(CreateDocumentRequest request, int userId, int orgId);
    Task DeleteAsync(int id, int userId, int orgId);
}
