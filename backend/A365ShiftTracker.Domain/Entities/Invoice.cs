using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Invoice : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ProjectFinanceId { get; set; }
    public int MilestoneId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "AED";
    public string Status { get; set; } = "Draft";
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }
    public ProjectFinance ProjectFinance { get; set; } = null!;
    public Milestone Milestone { get; set; } = null!;
}
