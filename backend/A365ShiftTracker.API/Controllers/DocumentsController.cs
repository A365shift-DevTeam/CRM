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

    public DocumentsController(IDocumentService service) => _service = service;

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
