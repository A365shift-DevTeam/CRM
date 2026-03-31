using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService) => _adminService = adminService;

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
}
