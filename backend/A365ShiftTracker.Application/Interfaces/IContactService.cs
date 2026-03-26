using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IContactService
{
    Task<IEnumerable<ContactDto>> GetAllAsync();
    Task<ContactDto> CreateAsync(CreateContactRequest request);
    Task<ContactDto> UpdateAsync(int id, UpdateContactRequest request);
    Task DeleteAsync(int id);
    Task<IEnumerable<ContactDto>> GetVendorsAsync();

    // Columns
    Task<IEnumerable<ContactColumnDto>> GetColumnsAsync();
    Task<IEnumerable<ContactColumnDto>> SaveColumnsAsync(List<ContactColumnDto> columns);

    // Vendor responses & emails
    Task<IEnumerable<VendorResponseDto>> GetVendorResponsesAsync(int vendorId);
    Task<VendorResponseDto> CreateVendorResponseAsync(CreateVendorResponseRequest request);
    Task<VendorEmailDto> SaveEmailSentAsync(CreateVendorEmailRequest request);
}
