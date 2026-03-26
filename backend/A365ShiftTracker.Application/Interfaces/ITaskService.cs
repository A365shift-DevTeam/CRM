using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetAllAsync(int userId);
    Task<TaskDto> CreateAsync(CreateTaskRequest request, int userId);
    Task<TaskDto> UpdateAsync(int id, UpdateTaskRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
