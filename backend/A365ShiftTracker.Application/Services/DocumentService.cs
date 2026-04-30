using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class DocumentService : IDocumentService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(IUnitOfWork uow, ILogger<DocumentService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<IEnumerable<DocumentDto>> GetAllAsync(int orgId)
    {
        try
        {
            var docs = await _uow.Documents.FindAsync(d => d.OrgId == orgId && !d.IsDeleted);
            return docs.OrderByDescending(d => d.CreatedAt).Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetAllAsync));
            throw;
        }
    }

    public async Task<IEnumerable<DocumentDto>> GetByEntityAsync(string entityType, int entityId, int orgId)
    {
        try
        {
            var docs = await _uow.Documents.FindAsync(d =>
                d.OrgId == orgId && d.EntityType == entityType && d.EntityId == entityId);
            return docs.OrderByDescending(d => d.CreatedAt).Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetByEntityAsync));
            throw;
        }
    }

    public async Task<DocumentDto> CreateAsync(CreateDocumentRequest request, int userId, int orgId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task DeleteAsync(int id, int userId, int orgId)
    {
        try
        {
            var entity = await _uow.Documents.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Document {id} not found.");
            if (entity.OrgId != orgId) throw new UnauthorizedAccessException();
            await _uow.Documents.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
    }

    private static DocumentDto MapToDto(Document d) => new()
    {
        Id = d.Id, EntityType = d.EntityType, EntityId = d.EntityId,
        FileName = d.FileName, FileUrl = d.FileUrl, FileType = d.FileType,
        FileSize = d.FileSize, CreatedAt = d.CreatedAt
    };
}

