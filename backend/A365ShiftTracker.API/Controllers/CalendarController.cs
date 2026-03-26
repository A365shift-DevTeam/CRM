using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarController : BaseApiController
{
    private readonly ICalendarService _service;

    public CalendarController(ICalendarService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<CalendarDataDto>>> GetEvents(
        [FromQuery] int month, [FromQuery] int year)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetEventsAsync(userId, month, year);
        return Ok(ApiResponse<CalendarDataDto>.Ok(result));
    }
}
