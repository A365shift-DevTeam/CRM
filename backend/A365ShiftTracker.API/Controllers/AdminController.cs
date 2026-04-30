using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "OrgAdminOrAbove")]
public class AdminController : BaseApiController
{
    private readonly IAdminService _adminService;
    private readonly IAuthService _authService;
    private readonly ITicketService _ticketService;
    private readonly IUnitOfWork _uow;
    private readonly IMemoryCache _cache;

    public AdminController(IAdminService adminService, IAuthService authService,
        ITicketService ticketService, IUnitOfWork uow, IMemoryCache cache)
    {
        _authService = authService;
        _adminService = adminService;
        _ticketService = ticketService;
        _uow = uow;
        _cache = cache;
    }

    // ─── Permissions (read-only list of all available codes) ───

    [HttpGet("permissions")]
    public async Task<ActionResult<ApiResponse<IEnumerable<PermissionDto>>>> GetAllPermissions()
    {
        try
        {
            var permissions = await _adminService.GetAllPermissionsAsync();
            return Ok(ApiResponse<IEnumerable<PermissionDto>>.Ok(permissions));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ─── 2FA Management ────────────────────────────────────────

    [HttpPost("users/{id}/2fa")]
    public async Task<ActionResult<ApiResponse<bool>>> SetUserTwoFactor(int id, Require2FARequest request)
    {
        try
        {
            var user = (await _uow.Users.FindAsync(u => u.Id == id)).FirstOrDefault();
            if (user == null) return NotFound(ApiResponse<object>.Fail($"User {id} not found."));

            user.TwoFactorRequired = request.Required;
            user.TwoFactorMethod = request.Method;
            await _uow.Users.UpdateAsync(user);
            await _uow.SaveChangesAsync();

            _cache.Remove($"org_perms:{user.OrgId}:{user.Role}");

            return Ok(ApiResponse<bool>.Ok(true,
                request.Required ? $"2FA ({request.Method}) required for user {id}."
                                 : $"2FA disabled for user {id}."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("users/{id}/2fa")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveUserTwoFactor(int id)
    {
        try
        {
            var user = (await _uow.Users.FindAsync(u => u.Id == id)).FirstOrDefault();
            if (user == null) return NotFound(ApiResponse<object>.Fail($"User {id} not found."));

            user.TwoFactorRequired = false;
            await _uow.Users.UpdateAsync(user);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Ok(true, $"2FA disabled for user {id}."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("users/{id}/totp")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetUserTotp(int id)
    {
        try
        {
            await _authService.AdminResetUserTotpAsync(id);
            return Ok(ApiResponse<bool>.Ok(true, $"TOTP reset for user {id}."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("users/{id}/require-totp")]
    public async Task<ActionResult<ApiResponse<bool>>> RequireUserTotp(int id)
    {
        try
        {
            var user = (await _uow.Users.FindAsync(u => u.Id == id)).FirstOrDefault();
            if (user == null) return NotFound(ApiResponse<object>.Fail($"User {id} not found."));

            if (user.IsTotpEnabled)
                return BadRequest(ApiResponse<bool>.Fail("User already has TOTP enabled."));

            user.TwoFactorRequired = true;
            user.TwoFactorMethod = "totp";
            await _uow.Users.UpdateAsync(user);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Ok(true, $"TOTP required for user {id}."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ─── Support Tickets ───────────────────────────────────────

    [HttpGet("tickets")]
    public async Task<ActionResult<ApiResponse<PagedResult<TicketDto>>>> GetAllTickets(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        try
        {
            var result = await _ticketService.GetAllForAdminAsync(page, pageSize);
            return Ok(ApiResponse<PagedResult<TicketDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("tickets/{id}")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> GetTicket(int id)
    {
        try
        {
            var result = await _ticketService.GetByIdForAdminAsync(id);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
            return Ok(ApiResponse<TicketDto>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("tickets/{id}/reply")]
    public async Task<ActionResult<ApiResponse<TicketCommentDto>>> ReplyToTicket(int id,
        [FromBody] CreateTicketCommentRequest req)
    {
        try
        {
            var result = await _ticketService.AdminReplyAsync(id, req, GetCurrentUserId());
            return Ok(ApiResponse<TicketCommentDto>.Ok(result, "Reply sent."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPatch("tickets/{id}/status")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> SetTicketStatus(int id,
        [FromBody] AdminSetStatusRequest req)
    {
        try
        {
            var result = await _ticketService.AdminSetStatusAsync(id, req.Status);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
            return Ok(ApiResponse<TicketDto>.Ok(result, "Status updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

