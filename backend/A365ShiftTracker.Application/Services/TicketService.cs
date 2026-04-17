using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class TicketService : ITicketService
{
    private readonly IUnitOfWork _uow;

    public TicketService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<PagedResult<TicketDto>> GetAllAsync(int userId, int page, int pageSize)
    {
        var paged = await _uow.Tickets.GetPagedAsync(
            t => t.UserId == userId, page, pageSize,
            q => q.OrderByDescending(t => t.CreatedAt));
        return new PagedResult<TicketDto>
        {
            Items = paged.Items.Select(MapToDto),
            TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
        };
    }

    public async Task<TicketDto?> GetByIdAsync(int id, int userId)
    {
        var ticket = await _uow.Tickets.Query()
            .Include(t => t.Comments)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (ticket == null) return null;
        ticket.Comments = ticket.Comments.OrderBy(c => c.CreatedAt).ToList();
        return MapToDto(ticket);
    }

    public async Task<TicketDto> CreateAsync(CreateTicketRequest req, int userId)
    {
        // Generate ticket number: TKT-{YYYY}-{sequential padded to 4}
        var existingCount = await _uow.Tickets.CountAsync(t => t.UserId == userId);
        var number = $"TKT-{DateTime.UtcNow.Year}-{(existingCount + 1):D4}";

        var entity = new Ticket
        {
            UserId = userId,
            TicketNumber = number,
            Title = req.Title,
            Description = req.Description,
            Type = req.Type,
            Priority = req.Priority,
            Status = req.Status,
            Category = req.Category,
            ContactId = req.ContactId,
            CompanyId = req.CompanyId,
            ProjectId = req.ProjectId,
            LeadId = req.LeadId,
            AssignedToUserId = req.AssignedToUserId,
            AssignedToName = req.AssignedToName,
            DueDate = req.DueDate,
            IsAiGenerated = req.IsAiGenerated,
            AiSource = req.AiSource,
            AiConfidence = req.AiConfidence,
            AiRawInput = req.AiRawInput
        };

        await _uow.Tickets.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<TicketDto?> UpdateAsync(int id, UpdateTicketRequest req, int userId)
    {
        var entity = await _uow.Tickets.Query()
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (entity == null) return null;

        entity.Title = req.Title;
        entity.Description = req.Description;
        entity.Type = req.Type;
        entity.Priority = req.Priority;
        entity.Status = req.Status;
        entity.Category = req.Category;
        entity.ContactId = req.ContactId;
        entity.CompanyId = req.CompanyId;
        entity.ProjectId = req.ProjectId;
        entity.LeadId = req.LeadId;
        entity.AssignedToUserId = req.AssignedToUserId;
        entity.AssignedToName = req.AssignedToName;
        entity.DueDate = req.DueDate;
        entity.ResolvedAt = req.ResolvedAt;
        entity.ClosedAt = req.ClosedAt;

        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Tickets.Query()
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (entity == null) return false;
        await _uow.Tickets.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<TicketStatsDto> GetStatsAsync(int userId)
    {
        var all = await _uow.Tickets.FindAsync(t => t.UserId == userId);
        return new TicketStatsDto
        {
            Open = all.Count(t => t.Status == "Open"),
            InProgress = all.Count(t => t.Status == "In Progress"),
            Pending = all.Count(t => t.Status == "Pending"),
            Resolved = all.Count(t => t.Status == "Resolved"),
            Closed = all.Count(t => t.Status == "Closed"),
            Critical = all.Count(t => t.Priority == "Critical"),
            High = all.Count(t => t.Priority == "High"),
            Medium = all.Count(t => t.Priority == "Medium"),
            Low = all.Count(t => t.Priority == "Low"),
        };
    }

    public async Task<TicketCommentDto> AddCommentAsync(int ticketId, CreateTicketCommentRequest req, int userId)
    {
        var ticket = await _uow.Tickets.Query()
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.UserId == userId);
        if (ticket == null) throw new KeyNotFoundException("Ticket not found");

        var comment = new TicketComment
        {
            TicketId = ticketId,
            Comment = req.Comment,
            IsInternal = req.IsInternal,
            AuthorUserId = userId,
            AuthorName = req.AuthorName
        };

        await _uow.TicketComments.AddAsync(comment);
        await _uow.SaveChangesAsync();
        return MapCommentToDto(comment);
    }

    public async Task<List<TicketCommentDto>> GetCommentsAsync(int ticketId, int userId)
    {
        // Verify ownership
        var ticket = await _uow.Tickets.Query()
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.UserId == userId);
        if (ticket == null) return new List<TicketCommentDto>();
        var comments = await _uow.TicketComments.FindAsync(c => c.TicketId == ticketId);
        return comments.OrderBy(c => c.CreatedAt).Select(MapCommentToDto).ToList();
    }

    private static TicketDto MapToDto(Ticket t) => new()
    {
        Id = t.Id,
        TicketNumber = t.TicketNumber,
        Title = t.Title,
        Description = t.Description,
        Type = t.Type,
        Priority = t.Priority,
        Status = t.Status,
        Category = t.Category,
        ContactId = t.ContactId,
        CompanyId = t.CompanyId,
        ProjectId = t.ProjectId,
        LeadId = t.LeadId,
        AssignedToUserId = t.AssignedToUserId,
        AssignedToName = t.AssignedToName,
        DueDate = t.DueDate,
        ResolvedAt = t.ResolvedAt,
        ClosedAt = t.ClosedAt,
        IsAiGenerated = t.IsAiGenerated,
        AiSource = t.AiSource,
        AiConfidence = t.AiConfidence,
        AiRawInput = t.AiRawInput,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
        CreatedByName = t.CreatedByName,
        Comments = t.Comments?.Select(MapCommentToDto).ToList() ?? []
    };

    private static TicketCommentDto MapCommentToDto(TicketComment c) => new()
    {
        Id = c.Id,
        TicketId = c.TicketId,
        Comment = c.Comment,
        IsInternal = c.IsInternal,
        AuthorUserId = c.AuthorUserId,
        AuthorName = c.AuthorName,
        CreatedAt = c.CreatedAt
    };
}
