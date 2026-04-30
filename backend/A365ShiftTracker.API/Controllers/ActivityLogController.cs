using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
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
    public async Task<ActionResult<ApiResponse<PagedResult<ActivityLogDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllAsync(userId, page, pageSize);
            return Ok(ApiResponse<PagedResult<ActivityLogDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("recent")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ActivityLogDto>>>> GetRecent([FromQuery] int count = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetRecentAsync(userId, count);
            return Ok(ApiResponse<IEnumerable<ActivityLogDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ActivityLogDto>>>> GetByEntity(string entityType, int entityId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetByEntityAsync(entityType, entityId, userId);
            return Ok(ApiResponse<IEnumerable<ActivityLogDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

