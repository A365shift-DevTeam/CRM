using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<InvoiceDto?> GetByIdAsync(int id, int userId);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req, int userId);
    Task<InvoiceDto?> UpdateStatusAsync(int id, UpdateInvoiceRequest req, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<List<InvoiceDto>> GetByProjectFinanceAsync(int projectFinanceId, int userId);
}
