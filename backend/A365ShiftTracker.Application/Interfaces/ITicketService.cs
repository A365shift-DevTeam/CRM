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
}
