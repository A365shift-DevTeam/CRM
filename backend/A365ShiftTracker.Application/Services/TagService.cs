using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class TagService : ITagService
{
    private readonly IUnitOfWork _uow;

    public TagService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<TagDto>> GetAllTagsAsync(int userId)
    {
        var tags = await _uow.Tags.FindAsync(t => t.UserId == userId);
        return tags.OrderBy(t => t.Name).Select(t => new TagDto { Id = t.Id, Name = t.Name, Color = t.Color });
    }

    public async Task<TagDto> CreateTagAsync(CreateTagRequest request, int userId)
    {
        var entity = new Tag { UserId = userId, Name = request.Name, Color = request.Color };
        await _uow.Tags.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return new TagDto { Id = entity.Id, Name = entity.Name, Color = entity.Color };
    }

    public async Task<TagDto> UpdateTagAsync(int id, CreateTagRequest request, int userId)
    {
        var entity = await _uow.Tags.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Tag {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        entity.Name = request.Name;
        entity.Color = request.Color;
        await _uow.Tags.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return new TagDto { Id = entity.Id, Name = entity.Name, Color = entity.Color };
    }

    public async Task DeleteTagAsync(int id, int userId)
    {
        var entity = await _uow.Tags.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Tag {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        // Also remove entity tags
        var entityTags = await _uow.EntityTags.FindAsync(et => et.TagId == id);
        foreach (var et in entityTags) await _uow.EntityTags.DeleteAsync(et);
        await _uow.Tags.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    public async Task<IEnumerable<EntityTagDto>> GetEntityTagsAsync(string entityType, int entityId, int userId)
    {
        var userTags = await _uow.Tags.FindAsync(t => t.UserId == userId);
        var userTagIds = userTags.Select(t => t.Id).ToHashSet();
        var entityTags = await _uow.EntityTags.FindAsync(et =>
            et.EntityType == entityType && et.EntityId == entityId && userTagIds.Contains(et.TagId));
        var tagLookup = userTags.ToDictionary(t => t.Id);
        return entityTags.Select(et => new EntityTagDto
        {
            TagId = et.TagId,
            TagName = tagLookup.ContainsKey(et.TagId) ? tagLookup[et.TagId].Name : "",
            TagColor = tagLookup.ContainsKey(et.TagId) ? tagLookup[et.TagId].Color : "#3b82f6"
        });
    }

    public async Task AttachTagAsync(AttachTagRequest request, int userId)
    {
        var tag = await _uow.Tags.GetByIdAsync(request.TagId)
            ?? throw new KeyNotFoundException($"Tag {request.TagId} not found.");
        if (tag.UserId != userId) throw new UnauthorizedAccessException();
        var existing = await _uow.EntityTags.FindAsync(et =>
            et.TagId == request.TagId && et.EntityType == request.EntityType && et.EntityId == request.EntityId);
        if (existing.Any()) return;
        await _uow.EntityTags.AddAsync(new EntityTag
        {
            TagId = request.TagId,
            EntityType = request.EntityType,
            EntityId = request.EntityId
        });
        await _uow.SaveChangesAsync();
    }

    public async Task DetachTagAsync(int tagId, string entityType, int entityId, int userId)
    {
        var tag = await _uow.Tags.GetByIdAsync(tagId)
            ?? throw new KeyNotFoundException($"Tag {tagId} not found.");
        if (tag.UserId != userId) throw new UnauthorizedAccessException();
        var entityTags = await _uow.EntityTags.FindAsync(et =>
            et.TagId == tagId && et.EntityType == entityType && et.EntityId == entityId);
        var entityTag = entityTags.FirstOrDefault();
        if (entityTag != null)
        {
            await _uow.EntityTags.DeleteAsync(entityTag);
            await _uow.SaveChangesAsync();
        }
    }
}
