using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface ICompanyService
{
    Task<PagedResult<CompanyDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<CompanyDto> CreateAsync(CreateCompanyRequest request, int userId);
    Task<CompanyDto> UpdateAsync(int id, UpdateCompanyRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
