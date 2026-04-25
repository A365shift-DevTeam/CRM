using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface ILeadService
{
    Task<PagedResult<LeadDto>> GetAllAsync(int orgId, int page, int pageSize);
    Task<LeadDto> CreateAsync(CreateLeadRequest request, int userId, int orgId);
    Task<LeadDto> UpdateAsync(int id, UpdateLeadRequest request, int userId, int orgId);
    Task DeleteAsync(int id, int userId, int orgId);
}
