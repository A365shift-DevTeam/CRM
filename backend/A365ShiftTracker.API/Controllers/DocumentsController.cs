using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : BaseApiController
{
    private readonly IDocumentService _service;
    private readonly IStorageLimitService _limits;

    public DocumentsController(IDocumentService service, IStorageLimitService limits)
    {
        _service = service;
        _limits = limits;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<DocumentDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<DocumentDto>>.Ok(result));
    }

    [HttpGet("{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DocumentDto>>>> GetByEntity(string entityType, int entityId)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByEntityAsync(entityType, entityId, userId);
        return Ok(ApiResponse<IEnumerable<DocumentDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DocumentDto>>> Create(CreateDocumentRequest request)
    {
        var userId = GetCurrentUserId();
        var (allowed, current, limit) = await _limits.CheckLimitAsync(userId, "Documents");
        if (!allowed)
            return StatusCode(402, ApiResponse<object>.Fail($"Document limit reached ({current}/{limit}). Please upgrade your plan."));
        var result = await _service.CreateAsync(request, userId);
        return Ok(ApiResponse<DocumentDto>.Ok(result, "Document uploaded."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Document deleted."));
    }
}
