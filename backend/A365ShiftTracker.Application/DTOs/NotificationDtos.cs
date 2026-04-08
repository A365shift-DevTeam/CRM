namespace A365ShiftTracker.Application.DTOs;

public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public bool IsRead { get; set; }
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNotificationRequest
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
}

public class AlertDto
{
    public string Category { get; set; } = string.Empty; // "payment_due", "sales_aging"
    public string Severity { get; set; } = "warning"; // "warning", "critical", "info"
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public int DaysOverdue { get; set; }
    public string? ProjectName { get; set; }
    public string? ClientName { get; set; }
    public string? StageName { get; set; }
    public decimal? Amount { get; set; }
    public string? Currency { get; set; }
    public DateTime? DueDate { get; set; }
}
