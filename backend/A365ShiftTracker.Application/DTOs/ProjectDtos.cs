namespace A365ShiftTracker.Application.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public string? CustomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ClientName { get; set; }
    public int ActiveStage { get; set; }
    public int Delay { get; set; }
    public string? Type { get; set; }
    public object? History { get; set; }
    public object? Stages { get; set; }
    public string? Phone { get; set; }
    public string? BrandingName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class CreateProjectRequest
{
    public string? CustomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ClientName { get; set; }
    public int ActiveStage { get; set; } = 0;
    public int Delay { get; set; } = 0;
    public string? Type { get; set; }
    public object? History { get; set; }
    public object? Stages { get; set; }
    public string? Phone { get; set; }
    public string? BrandingName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class UpdateProjectRequest : CreateProjectRequest
{
}
