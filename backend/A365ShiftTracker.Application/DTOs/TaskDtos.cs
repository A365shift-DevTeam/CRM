namespace A365ShiftTracker.Application.DTOs;

public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public object? Values { get; set; }
}

public class CreateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public object? Values { get; set; }
}

public class UpdateTaskRequest : CreateTaskRequest
{
}

// Task Column DTOs
public class TaskColumnDto
{
    public int Id { get; set; }
    public string ColId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Visible { get; set; } = true;
    public bool Required { get; set; } = false;
    public int Order { get; set; }
    public object? Config { get; set; }
}

public class CreateTaskColumnRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Required { get; set; } = false;
    public bool Visible { get; set; } = true;
    public object? Config { get; set; }
}

public class UpdateTaskColumnRequest
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public bool? Required { get; set; }
    public bool? Visible { get; set; }
    public object? Config { get; set; }
}

public class ReorderTaskColumnsRequest
{
    public List<string> OrderedColIds { get; set; } = new();
}
