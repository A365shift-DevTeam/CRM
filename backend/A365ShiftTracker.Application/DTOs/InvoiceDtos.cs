namespace A365ShiftTracker.Application.DTOs;

public class InvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ProjectFinanceId { get; set; }
    public int MilestoneId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? MilestoneName { get; set; }
    public decimal? MilestonePercentage { get; set; }
}

public class CreateInvoiceRequest
{
    public int ProjectFinanceId { get; set; }
    public int MilestoneId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "AED";
    public string? Notes { get; set; }
}

public class UpdateInvoiceRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}
