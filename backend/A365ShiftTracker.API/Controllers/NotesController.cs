using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotesController : BaseApiController
{
    private readonly INoteService _service;

    public NotesController(INoteService service) => _service = service;

    [HttpGet("{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<NoteDto>>>> GetByEntity(string entityType, int entityId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetByEntityAsync(entityType, entityId, userId);
            return Ok(ApiResponse<IEnumerable<NoteDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NoteDto>>> Create(CreateNoteRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.CreateAsync(request, userId);
            return Ok(ApiResponse<NoteDto>.Ok(result, "Note created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<NoteDto>>> Update(int id, UpdateNoteRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateAsync(id, request, userId);
            return Ok(ApiResponse<NoteDto>.Ok(result, "Note updated."));
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
            await _service.DeleteAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Note deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

