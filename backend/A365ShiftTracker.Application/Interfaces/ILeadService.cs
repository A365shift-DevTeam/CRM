using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ILeadService
{
    Task<IEnumerable<LeadDto>> GetAllAsync(int userId);
    Task<LeadDto> CreateAsync(CreateLeadRequest request, int userId);
    Task<LeadDto> UpdateAsync(int id, UpdateLeadRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
