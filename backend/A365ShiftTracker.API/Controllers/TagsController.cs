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
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllTagsAsync(userId);
            return Ok(ApiResponse<IEnumerable<TagDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TagDto>>> Create(CreateTagRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.CreateTagAsync(request, userId);
            return Ok(ApiResponse<TagDto>.Ok(result, "Tag created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<TagDto>>> Update(int id, CreateTagRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateTagAsync(id, request, userId);
            return Ok(ApiResponse<TagDto>.Ok(result, "Tag updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.DeleteTagAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Tag deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EntityTagDto>>>> GetEntityTags(string entityType, int entityId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetEntityTagsAsync(entityType, entityId, userId);
            return Ok(ApiResponse<IEnumerable<EntityTagDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("attach")]
    public async Task<ActionResult<ApiResponse<bool>>> Attach(AttachTagRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.AttachTagAsync(request, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Tag attached."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("detach/{tagId}/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<bool>>> Detach(int tagId, string entityType, int entityId)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.DetachTagAsync(tagId, entityType, entityId, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Tag detached."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

