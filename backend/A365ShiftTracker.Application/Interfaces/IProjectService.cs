using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllAsync();
    Task<ProjectDto?> GetByIdAsync(int id);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request);
    Task<ProjectDto> UpdateAsync(int id, UpdateProjectRequest request);
    Task DeleteAsync(int id);
}
