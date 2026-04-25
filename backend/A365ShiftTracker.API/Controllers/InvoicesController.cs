using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/invoices")]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _service;
    private readonly IStorageLimitService _limits;

    public InvoicesController(IInvoiceService service, IStorageLimitService limits)
    {
        _service = service;
        _limits = limits;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetAllAsync(orgId, page, pageSize);
        return Ok(ApiResponse<PagedResult<InvoiceDto>>.Ok(result, "Invoices retrieved"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetByIdAsync(id, orgId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<InvoiceDto>.Ok(result, "Invoice retrieved"));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest req)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var (allowed, current, limit) = await _limits.CheckLimitAsync(userId, "Invoices");
        if (!allowed)
            return StatusCode(402, ApiResponse<object>.Fail($"Invoice limit reached ({current}/{limit}). Please upgrade your plan."));
        var result = await _service.CreateAsync(req, userId, orgId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<InvoiceDto>.Ok(result, "Invoice created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateInvoiceRequest req)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.UpdateStatusAsync(id, req, userId, orgId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<InvoiceDto>.Ok(result, "Invoice updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var deleted = await _service.DeleteAsync(id, userId, orgId);
        if (!deleted) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<bool>.Ok(true, "Invoice deleted"));
    }

    [HttpGet("by-project/{projectFinanceId}")]
    public async Task<IActionResult> GetByProject(int projectFinanceId)
    {
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetByProjectFinanceAsync(projectFinanceId, orgId);
        return Ok(ApiResponse<List<InvoiceDto>>.Ok(result, "Invoices retrieved"));
    }
}
