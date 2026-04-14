using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Stakeholder : AuditableEntity
{
    public int ProjectFinanceId { get; set; }
    public string? Name { get; set; }
    public decimal? Percentage { get; set; }
    public decimal? PayoutTax { get; set; }
    public string PayoutStatus { get; set; } = "Pending";
    public DateTime? PaidDate { get; set; }
    // Navigation
    public ProjectFinance ProjectFinance { get; set; } = null!;
}
