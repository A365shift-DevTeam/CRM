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
public class CompaniesController : BaseApiController
{
    private readonly ICompanyService _service;

    public CompaniesController(ICompanyService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CompanyDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        try
        {
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.GetAllAsync(orgId, page, pageSize);
            return Ok(ApiResponse<PagedResult<CompanyDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> Create(CreateCompanyRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.CreateAsync(request, userId, orgId);
            return Ok(ApiResponse<CompanyDto>.Ok(result, "Company created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> Update(int id, UpdateCompanyRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var orgId = GetCurrentOrgId() ?? 0;
            if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
            var result = await _service.UpdateAsync(id, request, userId, orgId);
            return Ok(ApiResponse<CompanyDto>.Ok(result, "Company updated."));
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
            return Ok(ApiResponse<bool>.Ok(true, "Company deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (UnauthorizedAccessException ex) { return ForbiddenResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

