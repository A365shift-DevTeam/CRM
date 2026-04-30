using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IContactService
{
    Task<PagedResult<ContactDto>> GetAllAsync(int orgId, int page, int pageSize);
    Task<ContactDto> CreateAsync(CreateContactRequest request, int userId, int orgId);
    Task<ContactDto> UpdateAsync(int id, UpdateContactRequest request, int userId, int orgId);
    Task DeleteAsync(int id, int userId, int orgId);
    Task<IEnumerable<ContactDto>> GetVendorsAsync(int orgId);

    // Columns (per-org)
    Task<IEnumerable<ContactColumnDto>> GetColumnsAsync(int orgId);
    Task<IEnumerable<ContactColumnDto>> SaveColumnsAsync(int orgId, List<ContactColumnDto> columns);
    Task<ContactColumnDto> AddColumnAsync(int orgId, CreateContactColumnRequest request);
    Task<ContactColumnDto> UpdateColumnAsync(int orgId, string colId, UpdateContactColumnRequest request);
    Task DeleteColumnAsync(int orgId, string colId);
    Task ReorderColumnsAsync(int orgId, List<string> orderedColIds);

    // Vendor responses & emails
    Task<IEnumerable<VendorResponseDto>> GetVendorResponsesAsync(int vendorId);
    Task<VendorResponseDto> CreateVendorResponseAsync(CreateVendorResponseRequest request);
    Task<VendorEmailDto> SaveEmailSentAsync(CreateVendorEmailRequest request);
}
