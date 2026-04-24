using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Project : AuditableEntity, IOwnedByUser, IOrgScoped
{
    public int UserId { get; set; }
    public int OrgId { get; set; }
    public string? CustomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ClientName { get; set; }
    public int ActiveStage { get; set; } = 0;
    public int Delay { get; set; } = 0;
    public string? Type { get; set; }
    public string? History { get; set; } // JSON string
    public string? Stages { get; set; } // JSON string — per-project custom stages
    public string? Phone { get; set; }
    public string? BrandingName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int DeliveryStage { get; set; } = 0;
    public int FinanceStage { get; set; } = 0;
    public int LegalStage { get; set; } = 0;
}
