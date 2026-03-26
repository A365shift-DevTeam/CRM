using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimesheetController : ControllerBase
{
    private readonly ITimesheetService _service;

    public TimesheetController(ITimesheetService service) => _service = service;

    // ─── Entries ───────────────────────────────────────
    [HttpGet("entries")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TimesheetEntryDto>>>> GetEntries()
    {
        var result = await _service.GetEntriesAsync();
        return Ok(ApiResponse<IEnumerable<TimesheetEntryDto>>.Ok(result));
    }

    [HttpPost("entries")]
    public async Task<ActionResult<ApiResponse<TimesheetEntryDto>>> CreateEntry(CreateTimesheetEntryRequest request)
    {
        var result = await _service.CreateEntryAsync(request);
        return Ok(ApiResponse<TimesheetEntryDto>.Ok(result, "Entry created."));
    }

    [HttpPut("entries/{id}")]
    public async Task<ActionResult<ApiResponse<TimesheetEntryDto>>> UpdateEntry(int id, UpdateTimesheetEntryRequest request)
    {
        var result = await _service.UpdateEntryAsync(id, request);
        return Ok(ApiResponse<TimesheetEntryDto>.Ok(result, "Entry updated."));
    }

    [HttpDelete("entries/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteEntry(int id)
    {
        await _service.DeleteEntryAsync(id);
        return Ok(ApiResponse<bool>.Ok(true, "Entry deleted."));
    }

    // ─── Columns ───────────────────────────────────────
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
