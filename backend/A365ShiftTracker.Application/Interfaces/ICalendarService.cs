using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ICalendarService
{
    Task<CalendarDataDto> GetEventsAsync(int userId, int month, int year);
}
