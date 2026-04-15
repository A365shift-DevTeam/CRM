using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class TicketComment : BaseEntity
{
    public int TicketId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;               // internal note vs client-visible
    public int AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Ticket Ticket { get; set; } = null!;
}
