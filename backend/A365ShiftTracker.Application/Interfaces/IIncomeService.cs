using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IIncomeService
{
    Task<PagedResult<IncomeDto>> GetAllAsync(int userId, bool isOrgAdmin, int page, int pageSize);
    Task<IncomeDto> CreateAsync(CreateIncomeRequest request, int userId);
    Task<IncomeDto> UpdateAsync(int id, UpdateIncomeRequest request, int userId, bool isOrgAdmin);
    Task DeleteAsync(int id, int userId, bool isOrgAdmin);
}
