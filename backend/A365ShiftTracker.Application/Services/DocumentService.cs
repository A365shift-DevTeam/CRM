using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class DocumentService : IDocumentService
{
    private readonly IUnitOfWork _uow;

    public DocumentService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<DocumentDto>> GetAllAsync(int orgId)
    {
        var docs = await _uow.Documents.FindAsync(d => d.OrgId == orgId && !d.IsDeleted);
        return docs.OrderByDescending(d => d.CreatedAt).Select(MapToDto);
    }

    public async Task<IEnumerable<DocumentDto>> GetByEntityAsync(string entityType, int entityId, int orgId)
    {
        var docs = await _uow.Documents.FindAsync(d =>
            d.OrgId == orgId && d.EntityType == entityType && d.EntityId == entityId);
        return docs.OrderByDescending(d => d.CreatedAt).Select(MapToDto);
    }

    public async Task<DocumentDto> CreateAsync(CreateDocumentRequest request, int userId, int orgId)
    {
        var entity = new Document
        {
            UserId = userId,
            OrgId = orgId,
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            FileName = request.FileName,
            FileUrl = request.FileUrl,
            FileType = request.FileType,
            FileSize = request.FileSize
        };
        await _uow.Documents.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId, int orgId)
    {
        var entity = await _uow.Documents.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Document {id} not found.");
        if (entity.OrgId != orgId) throw new UnauthorizedAccessException();
        await _uow.Documents.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static DocumentDto MapToDto(Document d) => new()
    {
        Id = d.Id, EntityType = d.EntityType, EntityId = d.EntityId,
        FileName = d.FileName, FileUrl = d.FileUrl, FileType = d.FileType,
        FileSize = d.FileSize, CreatedAt = d.CreatedAt
    };
}
