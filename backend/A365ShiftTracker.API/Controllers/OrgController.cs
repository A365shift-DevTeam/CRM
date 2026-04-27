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
        var result = await _service.GetUsersAsync(GetRequiredOrgId());
        return Ok(ApiResponse<List<UserDto>>.Ok(result));
    }

    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser(CreateUserRequest request)
    {
        var result = await _service.CreateUserAsync(GetRequiredOrgId(), request);
        return Ok(ApiResponse<UserDto>.Ok(result, "User created. Welcome email sent."));
    }

    [HttpPatch("users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(int userId, UpdateUserRequest request)
    {
        var result = await _service.UpdateUserAsync(GetRequiredOrgId(), userId, request);
        return Ok(ApiResponse<UserDto>.Ok(result, "User updated."));
    }

    [HttpDelete("users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeactivateUser(int userId)
    {
        await _service.DeactivateUserAsync(GetRequiredOrgId(), userId);
        return Ok(ApiResponse<bool>.Ok(true, "User deactivated."));
    }

    [HttpGet("role-permissions/{role}")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetRolePermissions(string role)
    {
        var result = await _service.GetRolePermissionsAsync(GetRequiredOrgId(), role);
        return Ok(ApiResponse<List<string>>.Ok(result));
    }

    [HttpPut("role-permissions/{role}")]
    public async Task<ActionResult<ApiResponse<bool>>> SetRolePermissions(string role, SetRolePermissionsRequest request)
    {
        await _service.SetRolePermissionsAsync(GetRequiredOrgId(), role, request.PermissionCodes);
        return Ok(ApiResponse<bool>.Ok(true, "Permissions updated."));
    }

    [HttpGet("sales-settings")]
    [Authorize(Policy = "Authenticated")]
    public async Task<ActionResult<ApiResponse<OrgSalesSettingsDto>>> GetSalesSettings()
    {
        var result = await _orgService.GetSalesSettingsAsync(GetRequiredOrgId());
        return Ok(ApiResponse<OrgSalesSettingsDto>.Ok(result));
    }

    [HttpPut("sales-settings")]
    public async Task<ActionResult<ApiResponse<OrgSalesSettingsDto>>> UpsertSalesSettings(UpsertOrgSalesSettingsRequest request)
    {
        var result = await _orgService.UpsertSalesSettingsAsync(GetRequiredOrgId(), request);
        return Ok(ApiResponse<OrgSalesSettingsDto>.Ok(result, "Settings saved."));
    }

    [HttpGet("profile")]
    [Authorize(Policy = "Authenticated")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> GetOrgProfile()
    {
        var result = await _orgService.GetCurrentOrgAsync(GetRequiredOrgId());
        if (result == null) return NotFound(ApiResponse<object>.Fail("Organization not found."));
        return Ok(ApiResponse<OrganizationDto>.Ok(result));
    }
}
