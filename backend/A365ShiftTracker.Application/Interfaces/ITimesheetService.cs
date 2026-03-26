using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITimesheetService
{
    // Entries
    Task<IEnumerable<TimesheetEntryDto>> GetEntriesAsync(int userId);
    Task<TimesheetEntryDto> CreateEntryAsync(CreateTimesheetEntryRequest request, int userId);
    Task<TimesheetEntryDto> UpdateEntryAsync(int id, UpdateTimesheetEntryRequest request, int userId);
    Task DeleteEntryAsync(int id, int userId);

    // Columns (shared across users)
    Task<IEnumerable<TimesheetColumnDto>> GetColumnsAsync();
    Task<TimesheetColumnDto> AddColumnAsync(CreateTimesheetColumnRequest request);
    Task<TimesheetColumnDto> UpdateColumnAsync(string colId, UpdateTimesheetColumnRequest request);
    Task DeleteColumnAsync(string colId);
    Task ReorderColumnsAsync(List<string> orderedColIds);
}
