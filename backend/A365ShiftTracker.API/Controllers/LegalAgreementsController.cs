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
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllAsync(userId);
            return Ok(ApiResponse<List<LegalAgreementDto>>.Ok(result, "Legal agreements retrieved"));
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
            return Ok(ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement retrieved"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLegalAgreementRequest req)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.CreateAsync(req, userId);
            return CreatedAtAction(nameof(GetById), new { id = result.Id },
                ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement created"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLegalAgreementRequest req)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateAsync(id, req, userId);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
            return Ok(ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement updated"));
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
            return Ok(ApiResponse<bool>.Ok(true, "Legal agreement deleted"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("expiring-soon")]
    public async Task<IActionResult> GetExpiringSoon()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetExpiringSoonAsync(userId);
            return Ok(ApiResponse<List<LegalAgreementDto>>.Ok(result, "Expiring agreements retrieved"));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

