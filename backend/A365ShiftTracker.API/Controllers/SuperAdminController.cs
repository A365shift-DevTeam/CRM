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

    [HttpDelete("organizations/{orgId:int}/users/{userId:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveUser(int orgId, int userId)
    {
        await _service.RemoveUserFromOrgAsync(orgId, userId);
        return Ok(ApiResponse<bool>.Ok(true, "User removed from organization."));
    }
}
