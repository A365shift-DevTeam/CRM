using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/super-admin")]
[Authorize(Policy = "SuperAdminOnly")]
public class SuperAdminController : BaseApiController
{
    private readonly ISuperAdminService _service;

    public SuperAdminController(ISuperAdminService service) => _service = service;

    [HttpGet("organizations")]
    public async Task<ActionResult<ApiResponse<List<OrganizationDto>>>> GetAllOrganizations()
    {
        var result = await _service.GetAllOrganizationsAsync();
        return Ok(ApiResponse<List<OrganizationDto>>.Ok(result));
    }

    [HttpPost("organizations")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> CreateOrganization(CreateOrganizationRequest request)
    {
        var result = await _service.CreateOrganizationAsync(request);
        return Ok(ApiResponse<OrganizationDto>.Ok(result, "Organization created."));
    }

    [HttpPatch("organizations/{orgId:int}/status")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> UpdateStatus(int orgId, UpdateOrgStatusRequest request)
    {
        var result = await _service.UpdateOrganizationStatusAsync(orgId, request.Status);
        return Ok(ApiResponse<OrganizationDto>.Ok(result, "Status updated."));
    }

    [HttpPatch("organizations/{orgId:int}/user-limit")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> SetUserLimit(int orgId, SetUserLimitRequest request)
    {
        var result = await _service.SetUserLimitAsync(orgId, request.UserLimit);
        return Ok(ApiResponse<OrganizationDto>.Ok(result, "User limit updated."));
    }

    [HttpGet("organizations/{orgId:int}/users")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetOrgUsers(int orgId)
    {
        var result = await _service.GetOrgUsersAsync(orgId);
        return Ok(ApiResponse<List<UserDto>>.Ok(result));
    }

    [HttpPost("organizations/{orgId:int}/users")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateOrgAdmin(int orgId, CreateUserRequest request)
    {
        var result = await _service.CreateOrgAdminAsync(orgId, request);
        return Ok(ApiResponse<UserDto>.Ok(result, "Organization admin created. Welcome email sent."));
    }

    [HttpPatch("organizations/{orgId:int}/users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateOrgUser(int orgId, int userId, UpdateUserRequest request)
    {
        var result = await _service.UpdateOrgUserAsync(orgId, userId, request);
        return Ok(ApiResponse<UserDto>.Ok(result, "User updated."));
    }

    [HttpPatch("organizations/{orgId:int}/users/{userId:int}/status")]
    public async Task<ActionResult<ApiResponse<UserDto>>> ToggleUserStatus(int orgId, int userId, ToggleUserStatusRequest request)
    {
        var result = await _service.ToggleUserActiveAsync(orgId, userId, request.IsActive);
        return Ok(ApiResponse<UserDto>.Ok(result, request.IsActive ? "User activated." : "User deactivated."));
    }

    [HttpDelete("organizations/{orgId:int}/users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteOrgUser(int orgId, int userId)
    {
        await _service.DeleteOrgUserAsync(orgId, userId);
        return Ok(ApiResponse<bool>.Ok(true, "User removed from organization."));
    }
}
