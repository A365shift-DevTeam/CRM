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
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId, page, pageSize);
        return Ok(ApiResponse<PagedResult<LeadDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LeadDto>>> Create(CreateLeadRequest request)
    {
        var userId = GetCurrentUserId();
        var (allowed, current, limit) = await _limits.CheckLimitAsync(userId, "Leads");
        if (!allowed)
            return StatusCode(402, ApiResponse<object>.Fail($"Lead limit reached ({current}/{limit}). Please upgrade your plan."));
        var result = await _service.CreateAsync(request, userId);
        return Ok(ApiResponse<LeadDto>.Ok(result, "Lead created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<LeadDto>>> Update(int id, UpdateLeadRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, request, userId);
        return Ok(ApiResponse<LeadDto>.Ok(result, "Lead updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Lead deleted."));
    }
}
