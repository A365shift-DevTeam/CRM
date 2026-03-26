using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IProjectFinanceService
{
    Task<IEnumerable<ProjectFinanceDto>> GetAllAsync(int userId);
    Task<ProjectFinanceDto?> GetByIdAsync(int id, int userId);
    Task<ProjectFinanceDto> CreateAsync(CreateProjectFinanceRequest request, int userId);
    Task<ProjectFinanceDto> UpdateAsync(int id, UpdateProjectFinanceRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
