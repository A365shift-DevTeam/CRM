using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _uow;

    public ProjectService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<ProjectDto>> GetAllAsync()
    {
        var projects = await _uow.Projects.GetAllAsync();
        return projects.Select(MapToDto);
    }

    public async Task<ProjectDto?> GetByIdAsync(int id)
    {
        var project = await _uow.Projects.GetByIdAsync(id);
        return project is null ? null : MapToDto(project);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request)
    {
        var entity = new Project
        {
            CustomId = request.CustomId,
            Title = request.Title,
            ClientName = request.ClientName,
            ActiveStage = request.ActiveStage,
            Delay = request.Delay,
            Type = request.Type,
            History = request.History is not null ? JsonSerializer.Serialize(request.History) : "[]"
        };

        await _uow.Projects.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<ProjectDto> UpdateAsync(int id, UpdateProjectRequest request)
    {
        var entity = await _uow.Projects.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Project {id} not found.");

        entity.CustomId = request.CustomId;
        entity.Title = request.Title;
        entity.ClientName = request.ClientName;
        entity.ActiveStage = request.ActiveStage;
        entity.Delay = request.Delay;
        entity.Type = request.Type;
        if (request.History is not null)
            entity.History = JsonSerializer.Serialize(request.History);

        await _uow.Projects.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _uow.Projects.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Project {id} not found.");
        await _uow.Projects.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static ProjectDto MapToDto(Project p) => new()
    {
        Id = p.Id,
        CustomId = p.CustomId,
        Title = p.Title,
        ClientName = p.ClientName,
        ActiveStage = p.ActiveStage,
        Delay = p.Delay,
        Type = p.Type,
        History = p.History is not null ? JsonSerializer.Deserialize<object>(p.History) : null
    };
}
