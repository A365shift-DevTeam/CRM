using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Expense : AuditableEntity
{
    public DateTime Date { get; set; }
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? EmployeeName { get; set; }
    public string? ProjectDepartment { get; set; }
    public string? ReceiptUrl { get; set; }
    public string? Details { get; set; } // JSON string
}
