using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Application.Services;
using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize(Policy = "OrgAdminOrAbove")]
[ApiController]
[Route("api/tickets")]
public class TicketsController : BaseApiController
{
    private readonly ITicketService _service;
    private readonly TicketAiService _aiService;

    public TicketsController(ITicketService service, TicketAiService aiService)
    {
        _service = service;
        _aiService = aiService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllAsync(userId, page, pageSize);
            return Ok(ApiResponse<PagedResult<TicketDto>>.Ok(result, "Tickets retrieved"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetByIdAsync(id, userId);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
            return Ok(ApiResponse<TicketDto>.Ok(result, "Ticket retrieved"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest req)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.CreateAsync(req, userId);
            return CreatedAtAction(nameof(GetById), new { id = result.Id },
                ApiResponse<TicketDto>.Ok(result, "Ticket created"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTicketRequest req)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateAsync(id, req, userId);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
            return Ok(ApiResponse<TicketDto>.Ok(result, "Ticket updated"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var deleted = await _service.DeleteAsync(id, userId);
            if (!deleted) return NotFound(ApiResponse<object>.Fail("Not found"));
            return Ok(ApiResponse<bool>.Ok(true, "Ticket deleted"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetStatsAsync(userId);
            return Ok(ApiResponse<TicketStatsDto>.Ok(result, "Stats retrieved"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("ai-generate")]
    public async Task<IActionResult> AiGenerate([FromBody] AiGenerateTicketRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RawText))
            return BadRequest(ApiResponse<object>.Fail("rawText is required"));
        try
        {
            var result = await _aiService.GenerateTicketAsync(req.RawText);
            return Ok(ApiResponse<AiGeneratedTicketDto>.Ok(result, "AI ticket generated"));
        }
        catch (Exception ex) { return InternalError(ex, "AI ticket generation"); }
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetCommentsAsync(id, userId);
            return Ok(ApiResponse<List<TicketCommentDto>>.Ok(result, "Comments retrieved"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateTicketCommentRequest req)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.AddCommentAsync(id, req, userId);
            return Ok(ApiResponse<TicketCommentDto>.Ok(result, "Comment added"));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

