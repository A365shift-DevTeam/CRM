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
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetAllAsync(orgId);
        return Ok(ApiResponse<IEnumerable<DocumentDto>>.Ok(result));
    }

    [HttpGet("{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DocumentDto>>>> GetByEntity(string entityType, int entityId)
    {
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetByEntityAsync(entityType, entityId, orgId);
        return Ok(ApiResponse<IEnumerable<DocumentDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DocumentDto>>> Create(CreateDocumentRequest request)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var (allowed, current, limit) = await _limits.CheckLimitAsync(userId, "Documents");
        if (!allowed)
            return StatusCode(402, ApiResponse<object>.Fail($"Document limit reached ({current}/{limit}). Please upgrade your plan."));
        var result = await _service.CreateAsync(request, userId, orgId);
        return Ok(ApiResponse<DocumentDto>.Ok(result, "Document uploaded."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        await _service.DeleteAsync(id, userId, orgId);
        return Ok(ApiResponse<bool>.Ok(true, "Document deleted."));
    }
}
