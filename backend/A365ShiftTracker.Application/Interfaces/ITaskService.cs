using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITaskService
{
    Task<PagedResult<TaskDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<TaskDto> CreateAsync(CreateTaskRequest request, int userId);
    Task<TaskDto> UpdateAsync(int id, UpdateTaskRequest request, int userId);
    Task DeleteAsync(int id, int userId);

    // Columns (per-org, shared across users within the org)
    Task<List<TaskColumnDto>> GetColumnsAsync(int orgId);
    Task<TaskColumnDto> AddColumnAsync(CreateTaskColumnRequest request, int orgId);
    Task<TaskColumnDto> UpdateColumnAsync(string colId, UpdateTaskColumnRequest request, int orgId);
    Task DeleteColumnAsync(string colId, int orgId);
    Task ReorderColumnsAsync(ReorderTaskColumnsRequest request, int orgId);
}
