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
public class TimesheetController : BaseApiController
{
    private readonly ITimesheetService _service;

    public TimesheetController(ITimesheetService service) => _service = service;

    // ─── Entries ───────────────────────────────────────
    [HttpGet("entries")]
    public async Task<ActionResult<ApiResponse<PagedResult<TimesheetEntryDto>>>> GetEntries(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetEntriesAsync(userId, page, pageSize);
        return Ok(ApiResponse<PagedResult<TimesheetEntryDto>>.Ok(result));
    }

    [HttpPost("entries")]
    public async Task<ActionResult<ApiResponse<TimesheetEntryDto>>> CreateEntry(CreateTimesheetEntryRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateEntryAsync(request, userId);
        return Ok(ApiResponse<TimesheetEntryDto>.Ok(result, "Entry created."));
    }

    [HttpPut("entries/{id}")]
    public async Task<ActionResult<ApiResponse<TimesheetEntryDto>>> UpdateEntry(int id, UpdateTimesheetEntryRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateEntryAsync(id, request, userId);
        return Ok(ApiResponse<TimesheetEntryDto>.Ok(result, "Entry updated."));
    }

    [HttpDelete("entries/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteEntry(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteEntryAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Entry deleted."));
    }

    // ─── Columns (shared across users) ───────────────
    [HttpGet("columns")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TimesheetColumnDto>>>> GetColumns()
    {
        var result = await _service.GetColumnsAsync();
        return Ok(ApiResponse<IEnumerable<TimesheetColumnDto>>.Ok(result));
    }

    [HttpPost("columns")]
    public async Task<ActionResult<ApiResponse<TimesheetColumnDto>>> AddColumn(CreateTimesheetColumnRequest request)
    {
        var result = await _service.AddColumnAsync(request);
        return Ok(ApiResponse<TimesheetColumnDto>.Ok(result, "Column added."));
    }

    [HttpPut("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<TimesheetColumnDto>>> UpdateColumn(string colId, UpdateTimesheetColumnRequest request)
    {
        var result = await _service.UpdateColumnAsync(colId, request);
        return Ok(ApiResponse<TimesheetColumnDto>.Ok(result, "Column updated."));
    }

    [HttpDelete("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteColumn(string colId)
    {
        await _service.DeleteColumnAsync(colId);
        return Ok(ApiResponse<bool>.Ok(true, "Column deleted."));
    }

    [HttpPost("columns/reorder")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderColumns(ReorderColumnsRequest request)
    {
        await _service.ReorderColumnsAsync(request.OrderedColIds);
        return Ok(ApiResponse<bool>.Ok(true, "Columns reordered."));
    }
}
