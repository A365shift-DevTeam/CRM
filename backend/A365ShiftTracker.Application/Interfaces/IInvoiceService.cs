using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceDto>> GetAllAsync(int orgId, int page, int pageSize);
    Task<InvoiceDto?> GetByIdAsync(int id, int orgId);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req, int userId, int orgId);
    Task<InvoiceDto?> UpdateStatusAsync(int id, UpdateInvoiceRequest req, int userId, int orgId);
    Task<bool> DeleteAsync(int id, int userId, int orgId);
    Task<List<InvoiceDto>> GetByProjectFinanceAsync(int projectFinanceId, int orgId);
}
