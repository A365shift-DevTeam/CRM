namespace A365ShiftTracker.Application.DTOs;

public class IncomeDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? EmployeeName { get; set; }
    public string? ProjectDepartment { get; set; }
    public string? ReceiptUrl { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Source { get; set; }
    public string? InvoiceId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateIncomeRequest
{
    public DateTime Date { get; set; }
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? EmployeeName { get; set; }
    public string? ProjectDepartment { get; set; }
    public string? ReceiptUrl { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Source { get; set; }
    public string? InvoiceId { get; set; }
}

public class UpdateIncomeRequest : CreateIncomeRequest
{
}
