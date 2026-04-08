using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
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
    public async Task<ActionResult<ApiResponse<IEnumerable<NotificationDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<NotificationDto>>.Ok(result));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetUnreadCountAsync(userId);
        return Ok(ApiResponse<int>.Ok(result));
    }

    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(int id)
    {
        var userId = GetCurrentUserId();
        await _service.MarkAsReadAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Marked as read."));
    }

    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        await _service.MarkAllAsReadAsync(userId);
        return Ok(ApiResponse<bool>.Ok(true, "All marked as read."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Notification deleted."));
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AlertDto>>>> GetAlerts()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GenerateAlertsAsync(userId);
        return Ok(ApiResponse<IEnumerable<AlertDto>>.Ok(result));
    }
}
