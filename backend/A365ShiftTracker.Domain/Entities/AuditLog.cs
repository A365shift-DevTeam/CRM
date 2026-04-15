using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string EntityName { get; set; } = string.Empty;   // "Contact", "Lead", "LegalAgreement", etc.
    public int EntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;    // "Status", "DealValue", etc.
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Action { get; set; } = string.Empty;       // "Created" | "Updated" | "Deleted"
    public int ChangedByUserId { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}
