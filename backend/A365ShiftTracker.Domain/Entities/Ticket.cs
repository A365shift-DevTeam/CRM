using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Ticket : AuditableEntity, IOwnedByUser, IOrgScoped
{
    public int UserId { get; set; }
    public int OrgId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;    // "TKT-2026-0001"
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Internal Task";          // "Client Support"|"Bug"|"Internal Task"
    public string Priority { get; set; } = "Medium";             // "Critical"|"High"|"Medium"|"Low"
    public string Status { get; set; } = "Open";                 // "Open"|"In Progress"|"Pending"|"Resolved"|"Closed"
    public string? Category { get; set; }                        // "Billing"|"Technical"|"Feature Request"

    // CRM Links
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }

    // Assignment
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }

    // Timeline
    public DateTime? DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    // AI metadata
    public bool IsAiGenerated { get; set; } = false;
    public string? AiSource { get; set; }                        // "Email"|"ActivityLog"
    public decimal? AiConfidence { get; set; }                   // 0.0 – 1.0
    public string? AiRawInput { get; set; }

    // Navigation
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
}
