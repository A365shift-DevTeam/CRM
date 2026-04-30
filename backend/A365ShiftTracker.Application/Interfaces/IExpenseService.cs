using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IExpenseService
{
    Task<PagedResult<ExpenseDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<ExpenseDto> CreateAsync(CreateExpenseRequest request, int userId, int orgId);
    Task<ExpenseDto> UpdateAsync(int id, UpdateExpenseRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
