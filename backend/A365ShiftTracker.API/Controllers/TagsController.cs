using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TagsController : BaseApiController
{
    private readonly ITagService _service;

    public TagsController(ITagService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<TagDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllTagsAsync(userId);
        return Ok(ApiResponse<IEnumerable<TagDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TagDto>>> Create(CreateTagRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateTagAsync(request, userId);
        return Ok(ApiResponse<TagDto>.Ok(result, "Tag created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<TagDto>>> Update(int id, CreateTagRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateTagAsync(id, request, userId);
        return Ok(ApiResponse<TagDto>.Ok(result, "Tag updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteTagAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Tag deleted."));
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EntityTagDto>>>> GetEntityTags(string entityType, int entityId)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetEntityTagsAsync(entityType, entityId, userId);
        return Ok(ApiResponse<IEnumerable<EntityTagDto>>.Ok(result));
    }

    [HttpPost("attach")]
    public async Task<ActionResult<ApiResponse<bool>>> Attach(AttachTagRequest request)
    {
        var userId = GetCurrentUserId();
        await _service.AttachTagAsync(request, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Tag attached."));
    }

    [HttpDelete("detach/{tagId}/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<bool>>> Detach(int tagId, string entityType, int entityId)
    {
        var userId = GetCurrentUserId();
        await _service.DetachTagAsync(tagId, entityType, entityId, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Tag detached."));
    }
}
