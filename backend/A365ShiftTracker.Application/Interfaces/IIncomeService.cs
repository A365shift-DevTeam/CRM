using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IIncomeService
{
    Task<IEnumerable<IncomeDto>> GetAllAsync();
    Task<IncomeDto> CreateAsync(CreateIncomeRequest request);
    Task<IncomeDto> UpdateAsync(int id, UpdateIncomeRequest request);
    Task DeleteAsync(int id);
}
