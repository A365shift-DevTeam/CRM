using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class TicketService : ITicketService
{
    private readonly IUnitOfWork _uow;
    private readonly IDapperContext _db;

    public TicketService(IUnitOfWork uow, IDapperContext db)
    {
        _uow = uow;
        _db = db;
    }

    // ── Reads (Dapper) ────────────────────────────────────────────

    public async Task<PagedResult<TicketDto>> GetAllAsync(int userId, int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        const string countSql = "SELECT COUNT(*) FROM tickets WHERE user_id = @UserId AND is_deleted = FALSE";
        const string itemsSql = """
            SELECT id, ticket_number, title, description, type, priority, status, category,
                   contact_id, company_id, project_id, lead_id, assigned_to_user_id, assigned_to_name,
                   due_date, resolved_at, closed_at, is_ai_generated, ai_source, ai_confidence,
                   ai_raw_input, created_at, updated_at, created_by_name
            FROM tickets
            WHERE user_id = @UserId AND is_deleted = FALSE
            ORDER BY created_at DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        using var conn = _db.CreateConnection();
        var total = await conn.ExecuteScalarAsync<int>(countSql, new { UserId = userId });
        var items = await conn.QueryAsync<TicketDto>(itemsSql, new
        {
            UserId = userId,
            PageSize = pageSize,
            Offset = (page - 1) * pageSize
        });

        return new PagedResult<TicketDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TicketDto?> GetByIdAsync(int id, int userId)
    {
        const string ticketSql = """
            SELECT id, ticket_number, title, description, type, priority, status, category,
                   contact_id, company_id, project_id, lead_id, assigned_to_user_id, assigned_to_name,
                   due_date, resolved_at, closed_at, is_ai_generated, ai_source, ai_confidence,
                   ai_raw_input, created_at, updated_at, created_by_name
            FROM tickets
            WHERE id = @Id AND user_id = @UserId AND is_deleted = FALSE
            """;
        const string commentsSql = """
            SELECT id, ticket_id, comment, is_internal, author_user_id, author_name, created_at
            FROM ticket_comments
            WHERE ticket_id = @TicketId
            ORDER BY created_at ASC
            """;

        using var conn = _db.CreateConnection();
        var ticket = await conn.QueryFirstOrDefaultAsync<TicketDto>(ticketSql, new { Id = id, UserId = userId });
        if (ticket == null) return null;

        var comments = await conn.QueryAsync<TicketCommentDto>(commentsSql, new { TicketId = id });
        ticket.Comments = comments.ToList();
        return ticket;
    }

    public async Task<TicketStatsDto> GetStatsAsync(int userId)
    {
        const string sql = """
            SELECT
                COUNT(*) FILTER (WHERE status = 'Open')        AS open,
                COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
                COUNT(*) FILTER (WHERE status = 'Pending')     AS pending,
                COUNT(*) FILTER (WHERE status = 'Resolved')    AS resolved,
                COUNT(*) FILTER (WHERE status = 'Closed')      AS closed,
                COUNT(*) FILTER (WHERE priority = 'Critical')  AS critical,
                COUNT(*) FILTER (WHERE priority = 'High')      AS high,
                COUNT(*) FILTER (WHERE priority = 'Medium')    AS medium,
                COUNT(*) FILTER (WHERE priority = 'Low')       AS low
            FROM tickets
            WHERE user_id = @UserId AND is_deleted = FALSE
            """;

        using var conn = _db.CreateConnection();
        return await conn.QueryFirstAsync<TicketStatsDto>(sql, new { UserId = userId });
    }

    public async Task<List<TicketCommentDto>> GetCommentsAsync(int ticketId, int userId)
    {
        const string verifySql = "SELECT COUNT(*) FROM tickets WHERE id = @TicketId AND user_id = @UserId AND is_deleted = FALSE";
        const string commentsSql = """
            SELECT id, ticket_id, comment, is_internal, author_user_id, author_name, created_at
            FROM ticket_comments
            WHERE ticket_id = @TicketId
            ORDER BY created_at ASC
            """;

        using var conn = _db.CreateConnection();
        var owned = await conn.ExecuteScalarAsync<int>(verifySql, new { TicketId = ticketId, UserId = userId });
        if (owned == 0) return [];

        var comments = await conn.QueryAsync<TicketCommentDto>(commentsSql, new { TicketId = ticketId });
        return comments.ToList();
    }

    // ── Admin reads (Dapper) ──────────────────────────────────────

    public async Task<PagedResult<TicketDto>> GetAllForAdminAsync(int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        const string countSql = "SELECT COUNT(*) FROM tickets WHERE is_deleted = FALSE";
        const string itemsSql = """
            SELECT t.id, t.ticket_number, t.title, t.description, t.type, t.priority, t.status,
                   t.category, t.contact_id, t.company_id, t.project_id, t.lead_id,
                   t.assigned_to_user_id, t.assigned_to_name, t.due_date, t.resolved_at, t.closed_at,
                   t.is_ai_generated, t.ai_source, t.ai_confidence, t.ai_raw_input,
                   t.created_at, t.updated_at, t.created_by_name,
                   u.email AS raised_by_email,
                   o.name  AS org_name
            FROM tickets t
            LEFT JOIN users         u ON u.id = t.user_id
            LEFT JOIN organizations o ON o.id = u.org_id
            WHERE t.is_deleted = FALSE
            ORDER BY t.created_at DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        using var conn = _db.CreateConnection();
        var total = await conn.ExecuteScalarAsync<int>(countSql);
        var items = await conn.QueryAsync<TicketDto>(itemsSql, new
        {
            PageSize = pageSize,
            Offset = (page - 1) * pageSize
        });

        return new PagedResult<TicketDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TicketDto?> GetByIdForAdminAsync(int ticketId)
    {
        const string ticketSql = """
            SELECT t.id, t.ticket_number, t.title, t.description, t.type, t.priority, t.status,
                   t.category, t.contact_id, t.company_id, t.project_id, t.lead_id,
                   t.assigned_to_user_id, t.assigned_to_name, t.due_date, t.resolved_at, t.closed_at,
                   t.is_ai_generated, t.ai_source, t.ai_confidence, t.ai_raw_input,
                   t.created_at, t.updated_at, t.created_by_name,
                   u.email AS raised_by_email,
                   o.name  AS org_name
            FROM tickets t
            LEFT JOIN users         u ON u.id = t.user_id
            LEFT JOIN organizations o ON o.id = u.org_id
            WHERE t.id = @TicketId AND t.is_deleted = FALSE
            """;
        const string commentsSql = """
            SELECT id, ticket_id, comment, is_internal, author_user_id, author_name, created_at
            FROM ticket_comments
            WHERE ticket_id = @TicketId
            ORDER BY created_at ASC
            """;

        using var conn = _db.CreateConnection();
        var ticket = await conn.QueryFirstOrDefaultAsync<TicketDto>(ticketSql, new { TicketId = ticketId });
        if (ticket == null) return null;

        var comments = await conn.QueryAsync<TicketCommentDto>(commentsSql, new { TicketId = ticketId });
        ticket.Comments = comments.ToList();
        return ticket;
    }

    // ── Writes (EF Core) ─────────────────────────────────────────

    public async Task<TicketDto> CreateAsync(CreateTicketRequest req, int userId)
    {
        var number = await NextTicketNumberAsync();

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

    public async Task<TicketCommentDto> AdminReplyAsync(int ticketId, CreateTicketCommentRequest req, int adminUserId)
    {
        var ticket = await _uow.Tickets.Query().FirstOrDefaultAsync(t => t.Id == ticketId)
            ?? throw new KeyNotFoundException("Ticket not found.");

        var comment = new TicketComment
        {
            TicketId = ticketId,
            Comment = req.Comment,
            IsInternal = req.IsInternal,
            AuthorUserId = adminUserId,
            AuthorName = req.AuthorName
        };

        await _uow.TicketComments.AddAsync(comment);

        if (ticket.Status == "Open")
            ticket.Status = "In Progress";

        await _uow.SaveChangesAsync();
        return MapCommentToDto(comment);
    }

    public async Task<TicketDto?> AdminSetStatusAsync(int ticketId, string status)
    {
        var ticket = await _uow.Tickets.Query().FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null) return null;

        ticket.Status = status;
        if (status == "Resolved") ticket.ResolvedAt = DateTime.UtcNow;
        if (status == "Closed") ticket.ClosedAt = DateTime.UtcNow;

        await _uow.SaveChangesAsync();
        return MapToDto(ticket);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private async Task<string> NextTicketNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        const string sql = """
            SELECT COALESCE(
                MAX(CAST(SPLIT_PART(ticket_number, '-', 3) AS INTEGER)), 0)
            FROM tickets
            WHERE ticket_number LIKE @Pattern
            """;
        using var conn = _db.CreateConnection();
        var maxSeq = await conn.ExecuteScalarAsync<int>(sql, new { Pattern = $"TKT-{year}-%" });
        return $"TKT-{year}-{(maxSeq + 1):D4}";
    }

    // ── Mappers (used only by write paths that return newly created/updated entities) ──

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
