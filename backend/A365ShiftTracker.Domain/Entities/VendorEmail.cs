using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class VendorEmail : BaseEntity
{
    public int? VendorId { get; set; }
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public string? Recipients { get; set; }
    public string Status { get; set; } = "sent";
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Contact? Vendor { get; set; }
}
