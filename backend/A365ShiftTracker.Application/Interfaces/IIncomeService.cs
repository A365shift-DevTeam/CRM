using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IIncomeService
{
    Task<IEnumerable<IncomeDto>> GetAllAsync(int userId);
    Task<IncomeDto> CreateAsync(CreateIncomeRequest request, int userId);
    Task<IncomeDto> UpdateAsync(int id, UpdateIncomeRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
