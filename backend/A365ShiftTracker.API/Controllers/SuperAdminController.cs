using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/super-admin")]
[Authorize(Policy = "SuperAdminOnly")]
public class SuperAdminController : BaseApiController
{
    private readonly ISuperAdminService _service;
    private readonly ITicketService _tickets;

    public SuperAdminController(ISuperAdminService service, ITicketService tickets)
    {
        _service = service;
        _tickets = tickets;
    }

    [HttpGet("organizations")]
    public async Task<ActionResult<ApiResponse<List<OrganizationDto>>>> GetAllOrganizations()
    {
        try
        {
            var result = await _service.GetAllOrganizationsAsync();
            return Ok(ApiResponse<List<OrganizationDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("organizations")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> CreateOrganization(CreateOrganizationRequest request)
    {
        try
        {
            var result = await _service.CreateOrganizationAsync(request);
            return Ok(ApiResponse<OrganizationDto>.Ok(result, "Organization created."));
        }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPatch("organizations/{orgId:int}/status")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> UpdateStatus(int orgId, UpdateOrgStatusRequest request)
    {
        try
        {
            var result = await _service.UpdateOrganizationStatusAsync(orgId, request.Status);
            return Ok(ApiResponse<OrganizationDto>.Ok(result, "Status updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (ArgumentException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPatch("organizations/{orgId:int}/user-limit")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> SetUserLimit(int orgId, SetUserLimitRequest request)
    {
        try
        {
            var result = await _service.SetUserLimitAsync(orgId, request.UserLimit);
            return Ok(ApiResponse<OrganizationDto>.Ok(result, "User limit updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("organizations/{orgId:int}/users")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetOrgUsers(int orgId)
    {
        try
        {
            var result = await _service.GetOrgUsersAsync(orgId);
            return Ok(ApiResponse<List<UserDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("organizations/{orgId:int}/users")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateOrgAdmin(int orgId, CreateUserRequest request)
    {
        try
        {
            var result = await _service.CreateOrgAdminAsync(orgId, request);
            return Ok(ApiResponse<UserDto>.Ok(result, "Organization admin created. Welcome email sent."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (ArgumentException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPatch("organizations/{orgId:int}/users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateOrgUser(int orgId, int userId, UpdateUserRequest request)
    {
        try
        {
            var result = await _service.UpdateOrgUserAsync(orgId, userId, request);
            return Ok(ApiResponse<UserDto>.Ok(result, "User updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (ArgumentException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPatch("organizations/{orgId:int}/users/{userId:int}/status")]
    public async Task<ActionResult<ApiResponse<UserDto>>> ToggleUserStatus(int orgId, int userId, ToggleUserStatusRequest request)
    {
        try
        {
            var result = await _service.ToggleUserActiveAsync(orgId, userId, request.IsActive);
            return Ok(ApiResponse<UserDto>.Ok(result, request.IsActive ? "User activated." : "User deactivated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("organizations/{orgId:int}/users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteOrgUser(int orgId, int userId)
    {
        try
        {
            await _service.DeleteOrgUserAsync(orgId, userId);
            return Ok(ApiResponse<bool>.Ok(true, "User removed from organization."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ── Support Tickets (CXO → SuperAdmin) ──────────────────────

    [HttpGet("support-tickets")]
    public async Task<ActionResult<ApiResponse<PagedResult<TicketDto>>>> GetSupportTickets(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var result = await _tickets.GetAllForAdminAsync(page, pageSize);
            return Ok(ApiResponse<PagedResult<TicketDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPatch("support-tickets/{id:int}")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> UpdateSupportTicket(int id,
        [FromBody] AdminSetStatusRequest request)
    {
        try
        {
            var result = await _tickets.AdminSetStatusAsync(id, request.Status);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Ticket not found."));
            return Ok(ApiResponse<TicketDto>.Ok(result, "Status updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("support-tickets/{id:int}/reply")]
    public async Task<ActionResult<ApiResponse<TicketCommentDto>>> ReplySupportTicket(int id,
        [FromBody] CreateTicketCommentRequest request)
    {
        try
        {
            var result = await _tickets.AdminReplyAsync(id, request, GetCurrentUserId());
            return Ok(ApiResponse<TicketCommentDto>.Ok(result, "Reply sent."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ── Audit Logs ───────────────────────────────────────────────

    [HttpGet("audit-logs")]
    public async Task<ActionResult<ApiResponse<SuperAdminAuditLogPageDto>>> GetAuditLogs(
        [FromQuery] int? orgId,
        [FromQuery] int? userId,
        [FromQuery] string? entityName,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var result = await _service.GetAuditLogsAsync(orgId, userId, entityName, startDate, endDate, page, pageSize);
            return Ok(ApiResponse<SuperAdminAuditLogPageDto>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

