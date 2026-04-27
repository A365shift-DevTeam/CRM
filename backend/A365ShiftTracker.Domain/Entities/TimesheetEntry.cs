using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class TimesheetEntry : AuditableEntity, IOwnedByUser, IOrgScoped
{
    public int UserId { get; set; }
    public int OrgId { get; set; }
    public string? Task { get; set; }
    public DateTime? StartDatetime { get; set; }
    public DateTime? EndDatetime { get; set; }
    public string? Notes { get; set; }
    public string? Person { get; set; }
    public string? Customer { get; set; }
    public string? Site { get; set; }
    public string? Attachments { get; set; }
    public string? Values { get; set; } // JSON string for dynamic columns
}
