using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Income : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public DateTime Date { get; set; }
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? EmployeeName { get; set; }
    public string? ProjectDepartment { get; set; }
    public string? ReceiptUrl { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Raised, Paid
    public string? Source { get; set; }   // e.g. "invoice", "manual"
    public string? InvoiceId { get; set; }
}
