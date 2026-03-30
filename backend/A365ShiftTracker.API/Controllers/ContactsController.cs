using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContactsController : BaseApiController
{
    private readonly IContactService _service;

    public ContactsController(IContactService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<ContactDto>>.Ok(result));
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactDto>>>> GetVendors()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetVendorsAsync(userId);
        return Ok(ApiResponse<IEnumerable<ContactDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Create(CreateContactRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(request, userId);
        return Ok(ApiResponse<ContactDto>.Ok(result, "Contact created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Update(int id, UpdateContactRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, request, userId);
        return Ok(ApiResponse<ContactDto>.Ok(result, "Contact updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Contact deleted."));
    }

    // ─── Columns (shared across users) ───────────────────
    [HttpGet("columns")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactColumnDto>>>> GetColumns()
    {
        var result = await _service.GetColumnsAsync();
        return Ok(ApiResponse<IEnumerable<ContactColumnDto>>.Ok(result));
    }

    [HttpPost("columns")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactColumnDto>>>> SaveColumns(SaveContactColumnsRequest request)
    {
        var result = await _service.SaveColumnsAsync(request.Columns);
        return Ok(ApiResponse<IEnumerable<ContactColumnDto>>.Ok(result, "Columns saved."));
    }

    [HttpPost("columns/add")]
    public async Task<ActionResult<ApiResponse<ContactColumnDto>>> AddColumn(CreateContactColumnRequest request)
    {
        var result = await _service.AddColumnAsync(request);
        return Ok(ApiResponse<ContactColumnDto>.Ok(result, "Column added."));
    }

    [HttpPut("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<ContactColumnDto>>> UpdateColumn(string colId, UpdateContactColumnRequest request)
    {
        var result = await _service.UpdateColumnAsync(colId, request);
        return Ok(ApiResponse<ContactColumnDto>.Ok(result, "Column updated."));
    }

    [HttpDelete("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteColumn(string colId)
    {
        await _service.DeleteColumnAsync(colId);
        return Ok(ApiResponse<bool>.Ok(true, "Column deleted."));
    }

    [HttpPost("columns/reorder")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderColumns(ReorderContactColumnsRequest request)
    {
        await _service.ReorderColumnsAsync(request.OrderedColIds);
        return Ok(ApiResponse<bool>.Ok(true, "Columns reordered."));
    }

    // ─── Vendor Responses ──────────────────────────────
    [HttpGet("{vendorId}/responses")]
    public async Task<ActionResult<ApiResponse<IEnumerable<VendorResponseDto>>>> GetVendorResponses(int vendorId)
    {
        var result = await _service.GetVendorResponsesAsync(vendorId);
        return Ok(ApiResponse<IEnumerable<VendorResponseDto>>.Ok(result));
    }

    [HttpPost("responses")]
    public async Task<ActionResult<ApiResponse<VendorResponseDto>>> CreateVendorResponse(CreateVendorResponseRequest request)
    {
        var result = await _service.CreateVendorResponseAsync(request);
        return Ok(ApiResponse<VendorResponseDto>.Ok(result, "Vendor response created."));
    }

    // ─── Vendor Emails ─────────────────────────────────
    [HttpPost("emails")]
    public async Task<ActionResult<ApiResponse<VendorEmailDto>>> SaveEmailSent(CreateVendorEmailRequest request)
    {
        var result = await _service.SaveEmailSentAsync(request);
        return Ok(ApiResponse<VendorEmailDto>.Ok(result, "Email saved."));
    }
}
