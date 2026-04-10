using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ICompanyService
{
    Task<IEnumerable<CompanyDto>> GetAllAsync(int userId);
    Task<CompanyDto> CreateAsync(CreateCompanyRequest request, int userId);
    Task<CompanyDto> UpdateAsync(int id, UpdateCompanyRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
