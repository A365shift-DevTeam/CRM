using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IProjectService
{
    Task<PagedResult<ProjectDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<ProjectDto?> GetByIdAsync(int id, int userId);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId);
    Task<ProjectDto> UpdateAsync(int id, UpdateProjectRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
