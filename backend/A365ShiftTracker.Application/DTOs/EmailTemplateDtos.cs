namespace A365ShiftTracker.Application.DTOs;

public class EmailTemplateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Variables { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEmailTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Variables { get; set; }
}

public class UpdateEmailTemplateRequest : CreateEmailTemplateRequest
{
}
