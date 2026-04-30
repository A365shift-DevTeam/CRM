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
        try
        {
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.GetAllAsync(orgId, page, pageSize);
            return Ok(ApiResponse<PagedResult<ContactDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactDto>>>> GetVendors()
    {
        try
        {
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.GetVendorsAsync(orgId);
            return Ok(ApiResponse<IEnumerable<ContactDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Create(CreateContactRequest request)
    {
        try
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
        catch (InvalidOperationException ex) { return BadRequestResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Update(int id, UpdateContactRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.UpdateAsync(id, request, userId, orgId);
            return Ok(ApiResponse<ContactDto>.Ok(result, "Contact updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            await _service.DeleteAsync(id, userId, orgId);
            return Ok(ApiResponse<bool>.Ok(true, "Contact deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ─── Columns (per-org) ───────────────────────────────
    [HttpGet("columns")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactColumnDto>>>> GetColumns()
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.GetColumnsAsync(orgId);
            return Ok(ApiResponse<IEnumerable<ContactColumnDto>>.Ok(result));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("columns")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ContactColumnDto>>>> SaveColumns(SaveContactColumnsRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.SaveColumnsAsync(orgId, request.Columns);
            return Ok(ApiResponse<IEnumerable<ContactColumnDto>>.Ok(result, "Columns saved."));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("columns/add")]
    public async Task<ActionResult<ApiResponse<ContactColumnDto>>> AddColumn(CreateContactColumnRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.AddColumnAsync(orgId, request);
            return Ok(ApiResponse<ContactColumnDto>.Ok(result, "Column added."));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<ContactColumnDto>>> UpdateColumn(string colId, UpdateContactColumnRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            var result = await _service.UpdateColumnAsync(orgId, colId, request);
            return Ok(ApiResponse<ContactColumnDto>.Ok(result, "Column updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("columns/{colId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteColumn(string colId)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            await _service.DeleteColumnAsync(orgId, colId);
            return Ok(ApiResponse<bool>.Ok(true, "Column deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("columns/reorder")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderColumns(ReorderContactColumnsRequest request)
    {
        try
        {
            var orgId = GetRequiredOrgId();
            await _service.ReorderColumnsAsync(orgId, request.OrderedColIds);
            return Ok(ApiResponse<bool>.Ok(true, "Columns reordered."));
        }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ─── Vendor Responses ──────────────────────────────
    [HttpGet("{vendorId}/responses")]
    public async Task<ActionResult<ApiResponse<IEnumerable<VendorResponseDto>>>> GetVendorResponses(int vendorId)
    {
        try
        {
            var result = await _service.GetVendorResponsesAsync(vendorId);
            return Ok(ApiResponse<IEnumerable<VendorResponseDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost("responses")]
    public async Task<ActionResult<ApiResponse<VendorResponseDto>>> CreateVendorResponse(CreateVendorResponseRequest request)
    {
        try
        {
            var result = await _service.CreateVendorResponseAsync(request);
            return Ok(ApiResponse<VendorResponseDto>.Ok(result, "Vendor response created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    // ─── Vendor Emails ─────────────────────────────────
    [HttpPost("emails")]
    public async Task<ActionResult<ApiResponse<VendorEmailDto>>> SaveEmailSent(CreateVendorEmailRequest request)
    {
        try
        {
            var result = await _service.SaveEmailSentAsync(request);
            return Ok(ApiResponse<VendorEmailDto>.Ok(result, "Email saved."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }
}

