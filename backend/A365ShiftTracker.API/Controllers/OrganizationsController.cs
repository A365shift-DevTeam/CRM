using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationsController : BaseApiController
{
    private readonly IOrganizationService _service;

    public OrganizationsController(IOrganizationService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> Create(CreateOrganizationRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(request, userId);
        return Ok(ApiResponse<OrganizationDto>.Ok(result, "Organization created."));
    }

    [HttpGet("mine")]
    public async Task<ActionResult<ApiResponse<OrganizationDto?>>> GetMine()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetMineAsync(userId);
        return Ok(ApiResponse<OrganizationDto?>.Ok(result));
    }

    [HttpPost("join")]
    public async Task<ActionResult<ApiResponse<bool>>> Join(JoinOrganizationRequest request)
    {
        var userId = GetCurrentUserId();
        await _service.JoinAsync(request, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Joined organization."));
    }

    [HttpGet("{orgId:int}/sales-settings")]
    public async Task<ActionResult<ApiResponse<OrgSalesSettingsDto>>> GetSalesSettings(int orgId)
    {
        var result = await _service.GetSalesSettingsAsync(orgId);
        return Ok(ApiResponse<OrgSalesSettingsDto>.Ok(result));
    }

    [HttpPut("{orgId:int}/sales-settings")]
    public async Task<ActionResult<ApiResponse<OrgSalesSettingsDto>>> UpsertSalesSettings(
        int orgId, UpsertOrgSalesSettingsRequest request)
    {
        var result = await _service.UpsertSalesSettingsAsync(orgId, request);
        return Ok(ApiResponse<OrgSalesSettingsDto>.Ok(result, "Settings saved."));
    }
}
