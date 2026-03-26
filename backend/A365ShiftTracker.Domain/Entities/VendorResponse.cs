using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class VendorResponse : BaseEntity
{
    public int VendorId { get; set; }
    public string? Response { get; set; } // JSON string
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Contact Vendor { get; set; } = null!;
}
