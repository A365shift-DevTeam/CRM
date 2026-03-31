using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
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
    public async Task<ActionResult<ApiResponse<IEnumerable<TaskDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<TaskDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TaskDto>>> Create(CreateTaskRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(request, userId);
        return Ok(ApiResponse<TaskDto>.Ok(result, "Task created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<TaskDto>>> Update(int id, UpdateTaskRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, request, userId);
        return Ok(ApiResponse<TaskDto>.Ok(result, "Task updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Task deleted."));
    }

    // ─── Columns (shared across users) ───────────────────

    [HttpGet("columns")]
    public async Task<ActionResult<ApiResponse<List<TaskColumnDto>>>> GetColumns()
    {
        var result = await _service.GetColumnsAsync();
        return Ok(ApiResponse<List<TaskColumnDto>>.Ok(result));
    }

    [HttpPost("columns/add")]
    public async Task<ActionResult<ApiResponse<TaskColumnDto>>> AddColumn(CreateTaskColumnRequest request)
    {
        var result = await _service.AddColumnAsync(request);
        return Ok(ApiResponse<TaskColumnDto>.Ok(result, "Column added."));
    }

    [HttpPut("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<TaskColumnDto>>> UpdateColumn(string colId, UpdateTaskColumnRequest request)
    {
        var result = await _service.UpdateColumnAsync(colId, request);
        return Ok(ApiResponse<TaskColumnDto>.Ok(result, "Column updated."));
    }

    [HttpDelete("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteColumn(string colId)
    {
        await _service.DeleteColumnAsync(colId);
        return Ok(ApiResponse<bool>.Ok(true, "Column deleted."));
    }

    [HttpPost("columns/reorder")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderColumns(ReorderTaskColumnsRequest request)
    {
        await _service.ReorderColumnsAsync(request);
        return Ok(ApiResponse<bool>.Ok(true, "Columns reordered."));
    }
}
