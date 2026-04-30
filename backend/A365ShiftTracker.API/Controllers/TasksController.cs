using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : BaseApiController
{
    private readonly ITaskService _service;

    public TasksController(ITaskService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<TaskDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllAsync(userId, page, pageSize);
            return Ok(ApiResponse<PagedResult<TaskDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TaskDto>>> Create(CreateTaskRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.CreateAsync(request, userId);
            return Ok(ApiResponse<TaskDto>.Ok(result, "Task created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<TaskDto>>> Update(int id, UpdateTaskRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateAsync(id, request, userId);
            return Ok(ApiResponse<TaskDto>.Ok(result, "Task updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.DeleteAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Task deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ─── Columns (per-org) ────────────────────────────────

    [HttpGet("columns")]
    public async Task<ActionResult<ApiResponse<List<TaskColumnDto>>>> GetColumns()
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.GetColumnsAsync(orgId);
            return Ok(ApiResponse<List<TaskColumnDto>>.Ok(result));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("columns/add")]
    public async Task<ActionResult<ApiResponse<TaskColumnDto>>> AddColumn(CreateTaskColumnRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.AddColumnAsync(request, orgId);
            return Ok(ApiResponse<TaskColumnDto>.Ok(result, "Column added."));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<TaskColumnDto>>> UpdateColumn(string colId, UpdateTaskColumnRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.UpdateColumnAsync(colId, request, orgId);
            return Ok(ApiResponse<TaskColumnDto>.Ok(result, "Column updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteColumn(string colId)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            await _service.DeleteColumnAsync(colId, orgId);
            return Ok(ApiResponse<bool>.Ok(true, "Column deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("columns/reorder")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderColumns(ReorderTaskColumnsRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            await _service.ReorderColumnsAsync(request, orgId);
            return Ok(ApiResponse<bool>.Ok(true, "Columns reordered."));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}
