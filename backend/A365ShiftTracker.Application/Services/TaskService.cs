using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _uow;

    public TaskService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<TaskDto>> GetAllAsync(int userId)
    {
        var tasks = await _uow.Tasks.FindAsync(t => t.UserId == userId);
        return tasks.Select(MapToDto);
    }

    public async Task<TaskDto> CreateAsync(CreateTaskRequest request, int userId)
    {
        var entity = new TaskItem
        {
            UserId = userId,
            Title = request.Title,
            Status = request.Status,
            Priority = request.Priority,
            DueDate = request.DueDate,
            Values = request.Values is not null ? JsonSerializer.Serialize(request.Values) : null
        };

        await _uow.Tasks.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<TaskDto> UpdateAsync(int id, UpdateTaskRequest request, int userId)
    {
        var entity = await _uow.Tasks.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Task {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this task.");

        entity.Title = request.Title;
        entity.Status = request.Status;
        entity.Priority = request.Priority;
        entity.DueDate = request.DueDate;
        if (request.Values is not null)
            entity.Values = JsonSerializer.Serialize(request.Values);

        await _uow.Tasks.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Tasks.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Task {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this task.");

        await _uow.Tasks.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static TaskDto MapToDto(TaskItem t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Status = t.Status,
        Priority = t.Priority,
        DueDate = t.DueDate,
        Values = t.Values is not null ? JsonSerializer.Deserialize<object>(t.Values) : null
    };
}
