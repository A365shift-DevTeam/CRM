using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Charge : AuditableEntity
{
    public int ProjectFinanceId { get; set; }
    public string? Name { get; set; }
    public string? TaxType { get; set; }
    public string? Country { get; set; }
    public string? State { get; set; }
    public decimal? Percentage { get; set; }
    // Navigation
    public ProjectFinance ProjectFinance { get; set; } = null!;
}
