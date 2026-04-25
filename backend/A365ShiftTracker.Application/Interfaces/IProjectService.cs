using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IProjectService
{
    Task<PagedResult<ProjectDto>> GetAllAsync(int orgId, int page, int pageSize);
    Task<ProjectDto?> GetByIdAsync(int id, int orgId);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId, int orgId);
    Task<ProjectDto> UpdateAsync(int id, UpdateProjectRequest request, int userId, int orgId);
    Task DeleteAsync(int id, int userId, int orgId);
}
