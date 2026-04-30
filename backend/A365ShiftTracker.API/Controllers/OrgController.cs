using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/org")]
[Authorize(Policy = "OrgAdminOrAbove")]
public class OrgController : BaseApiController
{
    private readonly IOrgUserService _service;
    private readonly IOrganizationService _orgService;

    public OrgController(IOrgUserService service, IOrganizationService orgService)
    {
        _service = service;
        _orgService = orgService;
    }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetUsers()
    {
        try
        {
            var result = await _service.GetUsersAsync(GetRequiredOrgId());
            return Ok(ApiResponse<List<UserDto>>.Ok(result));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser(CreateUserRequest request)
    {
        try
        {
            var result = await _service.CreateUserAsync(GetRequiredOrgId(), request);
            return Ok(ApiResponse<UserDto>.Ok(result, "User created. Welcome email sent."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (ArgumentException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPatch("users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(int userId, UpdateUserRequest request)
    {
        try
        {
            var result = await _service.UpdateUserAsync(GetRequiredOrgId(), userId, request);
            return Ok(ApiResponse<UserDto>.Ok(result, "User updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (ArgumentException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeactivateUser(int userId)
    {
        try
        {
            await _service.DeactivateUserAsync(GetRequiredOrgId(), userId);
            return Ok(ApiResponse<bool>.Ok(true, "User deactivated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("role-permissions/{role}")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetRolePermissions(string role)
    {
        try
        {
            var result = await _service.GetRolePermissionsAsync(GetRequiredOrgId(), role);
            return Ok(ApiResponse<List<string>>.Ok(result));
        }
        catch (ArgumentException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("role-permissions/{role}")]
    public async Task<ActionResult<ApiResponse<bool>>> SetRolePermissions(string role, SetRolePermissionsRequest request)
    {
        try
        {
            await _service.SetRolePermissionsAsync(GetRequiredOrgId(), role, request.PermissionCodes);
            return Ok(ApiResponse<bool>.Ok(true, "Permissions updated."));
        }
        catch (ArgumentException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("roles")]
    public async Task<ActionResult<ApiResponse<List<OrgRoleDto>>>> GetAllRoles()
    {
        try
        {
            var result = await _service.GetAllRolesAsync(GetRequiredOrgId());
            return Ok(ApiResponse<List<OrgRoleDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("roles")]
    public async Task<ActionResult<ApiResponse<OrgRoleDto>>> CreateRole(CreateRoleRequest request)
    {
        try
        {
            var result = await _service.CreateOrUpdateRoleAsync(GetRequiredOrgId(), request.Name.Trim(), request.PermissionCodes);
            return Ok(ApiResponse<OrgRoleDto>.Ok(result, "Role created."));
        }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("roles/{roleName}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRole(string roleName)
    {
        try
        {
            await _service.DeleteCustomRoleAsync(GetRequiredOrgId(), roleName);
            return Ok(ApiResponse<bool>.Ok(true, "Role deleted."));
        }
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("sales-settings")]
    [Authorize(Policy = "Authenticated")]
    public async Task<ActionResult<ApiResponse<OrgSalesSettingsDto>>> GetSalesSettings()
    {
        try
        {
            var result = await _orgService.GetSalesSettingsAsync(GetRequiredOrgId());
            return Ok(ApiResponse<OrgSalesSettingsDto>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("sales-settings")]
    public async Task<ActionResult<ApiResponse<OrgSalesSettingsDto>>> UpsertSalesSettings(UpsertOrgSalesSettingsRequest request)
    {
        try
        {
            var result = await _orgService.UpsertSalesSettingsAsync(GetRequiredOrgId(), request);
            return Ok(ApiResponse<OrgSalesSettingsDto>.Ok(result, "Settings saved."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("profile")]
    [Authorize(Policy = "Authenticated")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> GetOrgProfile()
    {
        try
        {
            var result = await _orgService.GetCurrentOrgAsync(GetRequiredOrgId());
            if (result == null) return NotFound(ApiResponse<object>.Fail("Organization not found."));
            return Ok(ApiResponse<OrganizationDto>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

