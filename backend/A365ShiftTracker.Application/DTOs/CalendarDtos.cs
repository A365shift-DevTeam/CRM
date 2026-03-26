namespace A365ShiftTracker.Application.DTOs;

public class CalendarEventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime? EndDate { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? Status { get; set; }
    public string Color { get; set; } = "#3b82f6";
}

public class CalendarDataDto
{
    public List<CalendarEventDto> Events { get; set; } = new();
}
