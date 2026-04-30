using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class CalendarService : ICalendarService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<CalendarService> _logger;

    public CalendarService(IUnitOfWork uow, ILogger<CalendarService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<CalendarDataDto> GetEventsAsync(int userId, int month, int year)
    {
        try
        {
            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);
            var events = new List<CalendarEventDto>();
    
            // Tasks by DueDate
            var tasks = await _uow.Tasks.FindAsync(t =>
                t.UserId == userId && t.DueDate.HasValue &&
                t.DueDate.Value >= startDate && t.DueDate.Value < endDate);
            foreach (var t in tasks)
            {
                events.Add(new CalendarEventDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Date = t.DueDate!.Value,
                    EventType = "task",
                    Status = t.Status,
                    Color = "#3b82f6"
                });
            }
    
            // Timesheet entries
            var entries = await _uow.TimesheetEntries.FindAsync(e =>
                e.UserId == userId &&
                e.StartDatetime.HasValue &&
                e.StartDatetime.Value >= startDate && e.StartDatetime.Value < endDate);
            foreach (var e in entries)
            {
                events.Add(new CalendarEventDto
                {
                    Id = e.Id,
                    Title = e.Task ?? "Timesheet Entry",
                    Date = e.StartDatetime!.Value,
                    EndDate = e.EndDatetime,
                    EventType = "timesheet",
                    Color = "#10b981"
                });
            }
    
            // Milestones (via ProjectFinance)
            var finances = await _uow.ProjectFinances.FindAsync(pf => pf.UserId == userId);
            var financeIds = finances.Select(f => f.Id).ToList();
            if (financeIds.Any())
            {
                var milestones = await _uow.Milestones.FindAsync(m =>
                    financeIds.Contains(m.ProjectFinanceId) &&
                    m.InvoiceDate.HasValue &&
                    m.InvoiceDate.Value >= startDate && m.InvoiceDate.Value < endDate);
                foreach (var m in milestones)
                {
                    events.Add(new CalendarEventDto
                    {
                        Id = m.Id,
                        Title = m.Name ?? "Milestone",
                        Date = m.InvoiceDate!.Value,
                        EventType = "milestone",
                        Status = m.Status,
                        Color = "#f59e0b"
                    });
                }
            }
    
            return new CalendarDataDto { Events = events.OrderBy(e => e.Date).ToList() };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetEventsAsync));
            throw;
        }
    }
}

