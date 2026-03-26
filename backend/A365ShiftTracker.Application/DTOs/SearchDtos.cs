namespace A365ShiftTracker.Application.DTOs;

public class GlobalSearchResultDto
{
    public List<ContactDto> Contacts { get; set; } = new();
    public List<ProjectDto> Projects { get; set; } = new();
    public List<TaskDto> Tasks { get; set; } = new();
    public List<ExpenseDto> Expenses { get; set; } = new();
}

public class SavedFilterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string FilterJson { get; set; } = "{}";
}

public class CreateSavedFilterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string FilterJson { get; set; } = "{}";
}
