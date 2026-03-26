using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IExpenseService
{
    Task<IEnumerable<ExpenseDto>> GetAllAsync();
    Task<ExpenseDto> CreateAsync(CreateExpenseRequest request);
    Task<ExpenseDto> UpdateAsync(int id, UpdateExpenseRequest request);
    Task DeleteAsync(int id);
}
