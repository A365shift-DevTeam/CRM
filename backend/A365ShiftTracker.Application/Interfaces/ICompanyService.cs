using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface ICompanyService
{
    Task<PagedResult<CompanyDto>> GetAllAsync(int orgId, int page, int pageSize);
    Task<CompanyDto> CreateAsync(CreateCompanyRequest request, int userId, int orgId);
    Task<CompanyDto> UpdateAsync(int id, UpdateCompanyRequest request, int userId, int orgId);
    Task DeleteAsync(int id, int userId, int orgId);
}
