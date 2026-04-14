using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/legal-agreements")]
public class LegalAgreementsController : BaseApiController
{
    private readonly ILegalAgreementService _service;

    public LegalAgreementsController(ILegalAgreementService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<List<LegalAgreementDto>>.Ok(result, "Legal agreements retrieved"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement retrieved"));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLegalAgreementRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(req, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLegalAgreementRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, req, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _service.DeleteAsync(id, userId);
        if (!deleted) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(null, "Legal agreement deleted"));
    }

    [HttpGet("expiring-soon")]
    public async Task<IActionResult> GetExpiringSoon()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetExpiringSoonAsync(userId);
        return Ok(ApiResponse<List<LegalAgreementDto>>.Ok(result, "Expiring agreements retrieved"));
    }
}
