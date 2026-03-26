using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Stakeholder : BaseEntity
{
    public int ProjectFinanceId { get; set; }
    public string? Name { get; set; }
    public decimal? Percentage { get; set; }
    public decimal? PayoutTax { get; set; }
    public string PayoutStatus { get; set; } = "Pending";
    public DateTime? PaidDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ProjectFinance ProjectFinance { get; set; } = null!;
}
