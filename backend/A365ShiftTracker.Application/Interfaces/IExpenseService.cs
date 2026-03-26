using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IExpenseService
{
    Task<IEnumerable<ExpenseDto>> GetAllAsync(int userId);
    Task<ExpenseDto> CreateAsync(CreateExpenseRequest request, int userId);
    Task<ExpenseDto> UpdateAsync(int id, UpdateExpenseRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
