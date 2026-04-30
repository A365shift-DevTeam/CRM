using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITimesheetService
{
    // Entries
    Task<PagedResult<TimesheetEntryDto>> GetEntriesAsync(int userId, int page, int pageSize, string? customer = null);
    Task<TimesheetEntryDto> CreateEntryAsync(CreateTimesheetEntryRequest request, int userId);
    Task<TimesheetEntryDto> UpdateEntryAsync(int id, UpdateTimesheetEntryRequest request, int userId);
    Task DeleteEntryAsync(int id, int userId);

    // Columns (per-org, shared across users within the org)
    Task<IEnumerable<TimesheetColumnDto>> GetColumnsAsync(int orgId);
    Task<TimesheetColumnDto> AddColumnAsync(CreateTimesheetColumnRequest request, int orgId);
    Task<TimesheetColumnDto> UpdateColumnAsync(string colId, UpdateTimesheetColumnRequest request, int orgId);
    Task DeleteColumnAsync(string colId, int orgId);
    Task ReorderColumnsAsync(List<string> orderedColIds, int orgId);
}
