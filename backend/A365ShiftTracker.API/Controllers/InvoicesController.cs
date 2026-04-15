using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/invoices")]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _service;

    public InvoicesController(IInvoiceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<List<InvoiceDto>>.Ok(result, "Invoices retrieved"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<InvoiceDto>.Ok(result, "Invoice retrieved"));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(req, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<InvoiceDto>.Ok(result, "Invoice created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateInvoiceRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateStatusAsync(id, req, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<InvoiceDto>.Ok(result, "Invoice updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _service.DeleteAsync(id, userId);
        if (!deleted) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<bool>.Ok(true, "Invoice deleted"));
    }

    [HttpGet("by-project/{projectFinanceId}")]
    public async Task<IActionResult> GetByProject(int projectFinanceId)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByProjectFinanceAsync(projectFinanceId, userId);
        return Ok(ApiResponse<List<InvoiceDto>>.Ok(result, "Invoices retrieved"));
    }
}
