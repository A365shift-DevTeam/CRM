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
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllAsync(userId, page, pageSize);
            return Ok(ApiResponse<PagedResult<NotificationDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetUnreadCountAsync(userId);
            return Ok(ApiResponse<int>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.MarkAsReadAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Marked as read."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.MarkAllAsReadAsync(userId);
            return Ok(ApiResponse<bool>.Ok(true, "All marked as read."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.DeleteAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Notification deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AlertDto>>>> GetAlerts()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GenerateAlertsAsync(userId);
            return Ok(ApiResponse<IEnumerable<AlertDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

