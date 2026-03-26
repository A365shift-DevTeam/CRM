using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllAsync(int userId);
    Task<ProjectDto?> GetByIdAsync(int id, int userId);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId);
    Task<ProjectDto> UpdateAsync(int id, UpdateProjectRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
