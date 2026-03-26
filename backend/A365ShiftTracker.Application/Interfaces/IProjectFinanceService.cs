using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IProjectFinanceService
{
    Task<IEnumerable<ProjectFinanceDto>> GetAllAsync();
    Task<ProjectFinanceDto?> GetByIdAsync(int id);
    Task<ProjectFinanceDto> CreateAsync(CreateProjectFinanceRequest request);
    Task<ProjectFinanceDto> UpdateAsync(int id, UpdateProjectFinanceRequest request);
    Task DeleteAsync(int id);
}
