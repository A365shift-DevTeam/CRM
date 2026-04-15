using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class ProjectFinance : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string? ProjectId { get; set; }
    public string? ClientName { get; set; }
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public string? Delivery { get; set; }
    public decimal? DealValue { get; set; }
    public string Currency { get; set; } = "AED";
    public string? Location { get; set; }
    public string Status { get; set; } = "Active";
    public string? Type { get; set; }
    public DateTime DateCreated { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Milestone> Milestones { get; set; } = new List<Milestone>();
    public ICollection<Stakeholder> Stakeholders { get; set; } = new List<Stakeholder>();
    public ICollection<Charge> Charges { get; set; } = new List<Charge>();
}
