using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlanController : BaseApiController
{
    private readonly IStorageLimitService _storageLimitService;

    public PlanController(IStorageLimitService storageLimitService)
        => _storageLimitService = storageLimitService;

    [HttpGet("usage")]
    public async Task<ActionResult<ApiResponse<PlanUsageDto>>> GetUsage()
    {
        try
        {
            var userId = GetCurrentUserId();
            var usage = await _storageLimitService.GetUsageAsync(userId);
            return Ok(ApiResponse<PlanUsageDto>.Ok(usage));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

