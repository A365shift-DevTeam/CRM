using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITagService
{
    Task<IEnumerable<TagDto>> GetAllTagsAsync(int userId);
    Task<TagDto> CreateTagAsync(CreateTagRequest request, int userId);
    Task<TagDto> UpdateTagAsync(int id, CreateTagRequest request, int userId);
    Task DeleteTagAsync(int id, int userId);
    Task<IEnumerable<EntityTagDto>> GetEntityTagsAsync(string entityType, int entityId, int userId);
    Task AttachTagAsync(AttachTagRequest request, int userId);
    Task DetachTagAsync(int tagId, string entityType, int entityId, int userId);
}
