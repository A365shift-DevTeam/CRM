namespace A365ShiftTracker.Application.DTOs;

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#3b82f6";
}

public class CreateTagRequest
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#3b82f6";
}

public class EntityTagDto
{
    public int TagId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string TagColor { get; set; } = "#3b82f6";
}

public class AttachTagRequest
{
    public int TagId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
}
