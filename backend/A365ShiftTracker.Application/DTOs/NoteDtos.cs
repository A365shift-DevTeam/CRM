namespace A365ShiftTracker.Application.DTOs;

public class NoteDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateNoteRequest
{
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class UpdateNoteRequest
{
    public string Content { get; set; } = string.Empty;
}
