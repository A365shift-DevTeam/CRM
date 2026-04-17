using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IContactService
{
    Task<PagedResult<ContactDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<ContactDto> CreateAsync(CreateContactRequest request, int userId);
    Task<ContactDto> UpdateAsync(int id, UpdateContactRequest request, int userId);
    Task DeleteAsync(int id, int userId);
    Task<IEnumerable<ContactDto>> GetVendorsAsync(int userId);

    // Columns (shared across users)
    Task<IEnumerable<ContactColumnDto>> GetColumnsAsync();
    Task<IEnumerable<ContactColumnDto>> SaveColumnsAsync(List<ContactColumnDto> columns);
    Task<ContactColumnDto> AddColumnAsync(CreateContactColumnRequest request);
    Task<ContactColumnDto> UpdateColumnAsync(string colId, UpdateContactColumnRequest request);
    Task DeleteColumnAsync(string colId);
    Task ReorderColumnsAsync(List<string> orderedColIds);

    // Vendor responses & emails
    Task<IEnumerable<VendorResponseDto>> GetVendorResponsesAsync(int vendorId);
    Task<VendorResponseDto> CreateVendorResponseAsync(CreateVendorResponseRequest request);
    Task<VendorEmailDto> SaveEmailSentAsync(CreateVendorEmailRequest request);
}
