namespace A365ShiftTracker.Application.DTOs;

public class VendorResponseDto
{
    public int Id { get; set; }
    public int VendorId { get; set; }
    public object? Response { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVendorResponseRequest
{
    public int VendorId { get; set; }
    public object? Response { get; set; }
}

public class VendorEmailDto
{
    public int Id { get; set; }
    public int? VendorId { get; set; }
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public string? Recipients { get; set; }
    public string Status { get; set; } = "sent";
    public DateTime SentAt { get; set; }
}

public class CreateVendorEmailRequest
{
    public int? VendorId { get; set; }
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public string? Recipients { get; set; }
}
