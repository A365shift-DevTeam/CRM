namespace A365ShiftTracker.Application.DTOs;

public class ExpenseDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? EmployeeName { get; set; }
    public string? ProjectDepartment { get; set; }
    public string? ReceiptUrl { get; set; }
    public object? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExpenseRequest
{
    public DateTime Date { get; set; }
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? EmployeeName { get; set; }
    public string? ProjectDepartment { get; set; }
    public string? ReceiptUrl { get; set; }
    public object? Details { get; set; }
}

public class UpdateExpenseRequest : CreateExpenseRequest
{
}
