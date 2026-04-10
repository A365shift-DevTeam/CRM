using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : BaseApiController
{
    private readonly ILeadService _service;

    public LeadsController(ILeadService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<LeadDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<LeadDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LeadDto>>> Create(CreateLeadRequest request)
    {
        var userId = GetCurrentUserId();
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
