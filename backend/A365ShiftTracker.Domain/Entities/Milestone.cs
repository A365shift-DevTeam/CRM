using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Milestone : AuditableEntity
{
    public int ProjectFinanceId { get; set; }
    public string? Name { get; set; }
    public decimal? Percentage { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? InvoiceDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public bool IsCustomName { get; set; } = false;
    public int Order { get; set; } = 0;
    // Navigation
    public ProjectFinance ProjectFinance { get; set; } = null!;
}
