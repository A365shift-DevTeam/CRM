using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IInvoiceService
{
    Task<List<InvoiceDto>> GetAllAsync(int userId);
    Task<InvoiceDto?> GetByIdAsync(int id, int userId);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req, int userId);
    Task<InvoiceDto?> UpdateStatusAsync(int id, UpdateInvoiceRequest req, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<List<InvoiceDto>> GetByProjectFinanceAsync(int projectFinanceId, int userId);
}
