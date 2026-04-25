using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IAuthService _authService;
    private readonly ITicketService _ticketService;
    private readonly IUnitOfWork _uow;
    private readonly IMemoryCache _cache;

    public AdminController(IAdminService adminService, IAuthService authService, ITicketService ticketService, IUnitOfWork uow, IMemoryCache cache)
    {
        _authService = authService;
        _adminService = adminService;
        _ticketService = ticketService;
        _uow = uow;
        _cache = cache;
    }

    // ─── Users ─────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetAllUsers()
    {
        var users = await _adminService.GetAllUsersAsync();
        return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(users));
    }

    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser(CreateUserRequest request)
    {
        var user = await _adminService.CreateUserAsync(request);
        return Ok(ApiResponse<UserDto>.Ok(user, "User created."));
    }

    [HttpPut("users/{userId}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(int userId, UpdateUserRequest request)
    {
        var user = await _adminService.UpdateUserAsync(userId, request);
        return Ok(ApiResponse<UserDto>.Ok(user, "User updated."));
    }

    [HttpPut("users/{userId}/roles")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUserRoles(int userId, UpdateUserRolesRequest request)
    {
        var user = await _adminService.UpdateUserRolesAsync(userId, request);
        return Ok(ApiResponse<UserDto>.Ok(user, "User roles updated."));
    }

    [HttpPut("users/{userId}/status")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUserStatus(int userId, UpdateUserStatusRequest request)
    {
        var user = await _adminService.UpdateUserStatusAsync(userId, request);
        return Ok(ApiResponse<UserDto>.Ok(user, $"User {(request.IsActive ? "activated" : "deactivated")}."));
    }

    [HttpDelete("users/{userId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteUser(int userId)
    {
        await _adminService.DeleteUserAsync(userId);
        return Ok(ApiResponse<object>.Ok(null!, "User deleted."));
    }

    [HttpPut("users/{userId}/reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetUserPassword(int userId, AdminResetPasswordRequest request)
    {
        await _adminService.AdminResetPasswordAsync(userId, request);
        return Ok(ApiResponse<object>.Ok(null!, "Password reset successfully."));
    }

    [HttpPut("users/{userId}/plan")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateUserPlan(int userId, [FromBody] UpdateUserPlanRequest request)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        user.Plan = request.Plan;
        user.PlanExpiresAt = request.PlanExpiresAt;
        if (request.Plan != "Free") user.PlanPurchasedAt = DateTime.UtcNow;

        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "User plan updated."));
    }

    // ─── Roles ─────────────────────────────────────────────────

    [HttpGet("roles")]
    public async Task<ActionResult<ApiResponse<IEnumerable<RoleDto>>>> GetAllRoles()
    {
        var roles = await _adminService.GetAllRolesAsync();
        return Ok(ApiResponse<IEnumerable<RoleDto>>.Ok(roles));
    }

    [HttpPost("roles")]
    public async Task<ActionResult<ApiResponse<RoleDto>>> CreateRole(CreateRoleRequest request)
    {
        var role = await _adminService.CreateRoleAsync(request);
        return Ok(ApiResponse<RoleDto>.Ok(role, "Role created."));
    }

    [HttpPut("roles/{roleId}")]
    public async Task<ActionResult<ApiResponse<RoleDto>>> UpdateRole(int roleId, UpdateRoleRequest request)
    {
        var role = await _adminService.UpdateRoleAsync(roleId, request);
        return Ok(ApiResponse<RoleDto>.Ok(role, "Role updated."));
    }

    [HttpDelete("roles/{roleId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRole(int roleId)
    {
        await _adminService.DeleteRoleAsync(roleId);
        return Ok(ApiResponse<object>.Ok(null!, "Role deleted."));
    }

    // ─── Permissions ───────────────────────────────────────────

    [HttpGet("permissions")]
    public async Task<ActionResult<ApiResponse<IEnumerable<PermissionDto>>>> GetAllPermissions()
    {
        var permissions = await _adminService.GetAllPermissionsAsync();
        return Ok(ApiResponse<IEnumerable<PermissionDto>>.Ok(permissions));
    }

    // ─── 2FA Management ────────────────────────────────────────

    [HttpPost("users/{id}/2fa")]
    public async Task<ActionResult<ApiResponse<bool>>> SetUserTwoFactor(int id, Require2FARequest request)
    {
        var users = await _uow.Users.FindAsync(u => u.Id == id);
        var user = users.FirstOrDefault()
            ?? throw new KeyNotFoundException($"User {id} not found.");

        user.TwoFactorRequired = request.Required;
        user.TwoFactorMethod = request.Method;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        // Invalidate permission cache for this user
        _cache.Remove($"permissions:{id}");

        return Ok(ApiResponse<bool>.Ok(true,
            request.Required ? $"2FA ({request.Method}) required for user {id}." : $"2FA disabled for user {id}."));
    }

    [HttpDelete("users/{id}/2fa")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveUserTwoFactor(int id)
    {
        var users = await _uow.Users.FindAsync(u => u.Id == id);
        var user = users.FirstOrDefault()
            ?? throw new KeyNotFoundException($"User {id} not found.");

        user.TwoFactorRequired = false;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
        _cache.Remove($"permissions:{id}");

        return Ok(ApiResponse<bool>.Ok(true, $"2FA disabled for user {id}."));
    }

    [HttpDelete("users/{id}/totp")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetUserTotp(int id)
    {
        await _authService.AdminResetUserTotpAsync(id);
        _cache.Remove($"permissions:{id}");
        return Ok(ApiResponse<bool>.Ok(true, $"TOTP reset for user {id}."));
    }

    // ─── Support Tickets ───────────────────────────────────────

    [HttpGet("tickets")]
    public async Task<ActionResult<ApiResponse<PagedResult<TicketDto>>>> GetAllTickets(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var result = await _ticketService.GetAllForAdminAsync(page, pageSize);
        return Ok(ApiResponse<PagedResult<TicketDto>>.Ok(result));
    }

    [HttpGet("tickets/{id}")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> GetTicket(int id)
    {
        var result = await _ticketService.GetByIdForAdminAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<TicketDto>.Ok(result));
    }

    [HttpPost("tickets/{id}/reply")]
    public async Task<ActionResult<ApiResponse<TicketCommentDto>>> ReplyToTicket(int id, [FromBody] CreateTicketCommentRequest req)
    {
        var adminUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value ?? "0");
        var result = await _ticketService.AdminReplyAsync(id, req, adminUserId);
        return Ok(ApiResponse<TicketCommentDto>.Ok(result, "Reply sent."));
    }

    [HttpPatch("tickets/{id}/status")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> SetTicketStatus(int id, [FromBody] AdminSetStatusRequest req)
    {
        var result = await _ticketService.AdminSetStatusAsync(id, req.Status);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<TicketDto>.Ok(result, "Status updated."));
    }

    [HttpPost("users/{id}/require-totp")]
    public async Task<ActionResult<ApiResponse<bool>>> RequireUserTotp(int id)
    {
        var users = await _uow.Users.FindAsync(u => u.Id == id);
        var user = users.FirstOrDefault()
            ?? throw new KeyNotFoundException($"User {id} not found.");

        if (user.IsTotpEnabled)
            return BadRequest(ApiResponse<bool>.Fail("User already has TOTP enabled."));

        user.TwoFactorRequired = true;
        user.TwoFactorMethod = "totp";
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
        _cache.Remove($"permissions:{id}");

        return Ok(ApiResponse<bool>.Ok(true, $"TOTP required for user {id}. User must set it up via Settings."));
    }

    // ─── Organizations ────────────────────────────────────────
    [HttpGet("organizations")]
    public async Task<ActionResult<ApiResponse<IEnumerable<OrganizationDto>>>> GetAllOrganizations()
    {
        var orgs = await _uow.Organizations.GetAllAsync();
        var result = orgs.Select(o => new OrganizationDto
        {
            Id = o.Id,
            Name = o.Name,
            Slug = o.Slug,
            CreatedAt = o.CreatedAt
        });
        return Ok(ApiResponse<IEnumerable<OrganizationDto>>.Ok(result));
    }

    [HttpPost("organizations")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> CreateOrganization([FromBody] CreateOrganizationRequest request)
    {
        var slug = request.Slug.Trim().ToLowerInvariant();
        var existing = (await _uow.Organizations.FindAsync(o => o.Slug == slug)).FirstOrDefault();
        if (existing is not null)
            return BadRequest(ApiResponse<OrganizationDto>.Fail($"Slug '{slug}' is already taken."));

        var org = new Organization { Name = request.Name.Trim(), Slug = slug };
        await _uow.Organizations.AddAsync(org);
        await _uow.SaveChangesAsync();

        return Ok(ApiResponse<OrganizationDto>.Ok(new OrganizationDto
        {
            Id = org.Id, Name = org.Name, Slug = org.Slug, CreatedAt = org.CreatedAt
        }, "Organization created."));
    }

    [HttpDelete("organizations/{orgId:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteOrganization(int orgId)
    {
        var org = await _uow.Organizations.GetByIdAsync(orgId);
        if (org is null) return NotFound(ApiResponse<bool>.Fail("Organization not found."));

        await _uow.Organizations.DeleteAsync(org);
        await _uow.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Organization deleted."));
    }
}
