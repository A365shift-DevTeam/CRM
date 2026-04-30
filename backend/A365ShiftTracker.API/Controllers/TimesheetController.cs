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
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string? customer = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetEntriesAsync(userId, page, pageSize, customer);
            return Ok(ApiResponse<PagedResult<TimesheetEntryDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("entries")]
    public async Task<ActionResult<ApiResponse<TimesheetEntryDto>>> CreateEntry(CreateTimesheetEntryRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.CreateEntryAsync(request, userId);
            return Ok(ApiResponse<TimesheetEntryDto>.Ok(result, "Entry created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("entries/{id}")]
    public async Task<ActionResult<ApiResponse<TimesheetEntryDto>>> UpdateEntry(int id, UpdateTimesheetEntryRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateEntryAsync(id, request, userId);
            return Ok(ApiResponse<TimesheetEntryDto>.Ok(result, "Entry updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("entries/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteEntry(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.DeleteEntryAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Entry deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ─── Columns (per-org) ──────────────────────────────
    [HttpGet("columns")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TimesheetColumnDto>>>> GetColumns()
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.GetColumnsAsync(orgId);
            return Ok(ApiResponse<IEnumerable<TimesheetColumnDto>>.Ok(result));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("columns")]
    public async Task<ActionResult<ApiResponse<TimesheetColumnDto>>> AddColumn(CreateTimesheetColumnRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.AddColumnAsync(request, orgId);
            return Ok(ApiResponse<TimesheetColumnDto>.Ok(result, "Column added."));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<TimesheetColumnDto>>> UpdateColumn(string colId, UpdateTimesheetColumnRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.UpdateColumnAsync(colId, request, orgId);
            return Ok(ApiResponse<TimesheetColumnDto>.Ok(result, "Column updated."));
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
    public async Task<ActionResult<ApiResponse<bool>>> ReorderColumns(ReorderColumnsRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            await _service.ReorderColumnsAsync(request.OrderedColIds, orgId);
            return Ok(ApiResponse<bool>.Ok(true, "Columns reordered."));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}
