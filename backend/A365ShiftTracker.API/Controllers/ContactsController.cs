using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContactsController : ControllerBase
{
    private readonly IContactService _service;

    public ContactsController(IContactService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactDto>>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(ApiResponse<IEnumerable<ContactDto>>.Ok(result));
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactDto>>>> GetVendors()
    {
        var result = await _service.GetVendorsAsync();
        return Ok(ApiResponse<IEnumerable<ContactDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Create(CreateContactRequest request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(ApiResponse<ContactDto>.Ok(result, "Contact created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Update(int id, UpdateContactRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        return Ok(ApiResponse<ContactDto>.Ok(result, "Contact updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return Ok(ApiResponse<bool>.Ok(true, "Contact deleted."));
    }

    // ─── Columns ───────────────────────────────────────
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
