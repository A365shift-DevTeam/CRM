using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITicketService
{
    Task<PagedResult<TicketDto>> GetAllAsync(int userId, int page, int pageSize);
    Task<TicketDto?> GetByIdAsync(int id, int userId);
    Task<TicketDto> CreateAsync(CreateTicketRequest req, int userId);
    Task<TicketDto?> UpdateAsync(int id, UpdateTicketRequest req, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<TicketStatsDto> GetStatsAsync(int userId);
    Task<TicketCommentDto> AddCommentAsync(int ticketId, CreateTicketCommentRequest req, int userId);
    Task<List<TicketCommentDto>> GetCommentsAsync(int ticketId, int userId);

    // Admin-only
    Task<PagedResult<TicketDto>> GetAllForAdminAsync(int page, int pageSize);
    Task<TicketDto?> GetByIdForAdminAsync(int ticketId);
    Task<TicketCommentDto> AdminReplyAsync(int ticketId, CreateTicketCommentRequest req, int adminUserId);
    Task<TicketDto?> AdminSetStatusAsync(int ticketId, string status);
}
