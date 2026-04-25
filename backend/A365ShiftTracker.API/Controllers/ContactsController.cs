using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContactsController : BaseApiController
{
    private readonly IContactService _service;
    private readonly IStorageLimitService _limits;

    public ContactsController(IContactService service, IStorageLimitService limits)
    {
        _service = service;
        _limits = limits;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ContactDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetAllAsync(orgId, page, pageSize);
        return Ok(ApiResponse<PagedResult<ContactDto>>.Ok(result));
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactDto>>>> GetVendors()
    {
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetVendorsAsync(orgId);
        return Ok(ApiResponse<IEnumerable<ContactDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Create(CreateContactRequest request)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var (allowed, current, limit) = await _limits.CheckLimitAsync(userId, "Contacts");
        if (!allowed)
            return StatusCode(402, ApiResponse<object>.Fail($"Contact limit reached ({current}/{limit}). Please upgrade your plan."));
        var result = await _service.CreateAsync(request, userId, orgId);
        return Ok(ApiResponse<ContactDto>.Ok(result, "Contact created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Update(int id, UpdateContactRequest request)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.UpdateAsync(id, request, userId, orgId);
        return Ok(ApiResponse<ContactDto>.Ok(result, "Contact updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        await _service.DeleteAsync(id, userId, orgId);
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
