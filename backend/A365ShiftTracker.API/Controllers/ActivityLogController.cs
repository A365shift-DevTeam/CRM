using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/activity-log")]
[Authorize]
public class ActivityLogController : BaseApiController
{
    private readonly IActivityLogService _service;

    public ActivityLogController(IActivityLogService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ActivityLogDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<ActivityLogDto>>.Ok(result));
    }

    [HttpGet("recent")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ActivityLogDto>>>> GetRecent([FromQuery] int count = 20)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetRecentAsync(userId, count);
        return Ok(ApiResponse<IEnumerable<ActivityLogDto>>.Ok(result));
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ActivityLogDto>>>> GetByEntity(string entityType, int entityId)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByEntityAsync(entityType, entityId, userId);
        return Ok(ApiResponse<IEnumerable<ActivityLogDto>>.Ok(result));
    }
}
