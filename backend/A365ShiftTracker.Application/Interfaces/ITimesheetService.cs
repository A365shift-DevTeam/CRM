using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITimesheetService
{
    // Entries
    Task<IEnumerable<TimesheetEntryDto>> GetEntriesAsync();
    Task<TimesheetEntryDto> CreateEntryAsync(CreateTimesheetEntryRequest request);
    Task<TimesheetEntryDto> UpdateEntryAsync(int id, UpdateTimesheetEntryRequest request);
    Task DeleteEntryAsync(int id);

    // Columns
    Task<IEnumerable<TimesheetColumnDto>> GetColumnsAsync();
    Task<TimesheetColumnDto> AddColumnAsync(CreateTimesheetColumnRequest request);
    Task<TimesheetColumnDto> UpdateColumnAsync(string colId, UpdateTimesheetColumnRequest request);
    Task DeleteColumnAsync(string colId);
    Task ReorderColumnsAsync(List<string> orderedColIds);
}
