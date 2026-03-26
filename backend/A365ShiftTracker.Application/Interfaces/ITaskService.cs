using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetAllAsync();
    Task<TaskDto> CreateAsync(CreateTaskRequest request);
    Task<TaskDto> UpdateAsync(int id, UpdateTaskRequest request);
    Task DeleteAsync(int id);
}
