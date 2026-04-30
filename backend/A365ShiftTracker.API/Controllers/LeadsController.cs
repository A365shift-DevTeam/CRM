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
public class LeadsController : BaseApiController
{
    private readonly ILeadService _service;
    private readonly IStorageLimitService _limits;

    public LeadsController(ILeadService service, IStorageLimitService limits)
    {
        _service = service;
        _limits = limits;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<LeadDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        try
        {
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.GetAllAsync(orgId, page, pageSize);
            return Ok(ApiResponse<PagedResult<LeadDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LeadDto>>> Create(CreateLeadRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var (allowed, current, limit) = await _limits.CheckLimitAsync(userId, "Leads");
            if (!allowed)
                return StatusCode(402, ApiResponse<object>.Fail($"Lead limit reached ({current}/{limit}). Please upgrade your plan."));
            var result = await _service.CreateAsync(request, userId, orgId);
            return Ok(ApiResponse<LeadDto>.Ok(result, "Lead created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<LeadDto>>> Update(int id, UpdateLeadRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.UpdateAsync(id, request, userId, orgId);
            return Ok(ApiResponse<LeadDto>.Ok(result, "Lead updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            await _service.DeleteAsync(id, userId, orgId);
            return Ok(ApiResponse<bool>.Ok(true, "Lead deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

