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
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.GetAllAsync(orgId, page, pageSize);
        return Ok(ApiResponse<PagedResult<CompanyDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> Create(CreateCompanyRequest request)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.CreateAsync(request, userId, orgId);
        return Ok(ApiResponse<CompanyDto>.Ok(result, "Company created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> Update(int id, UpdateCompanyRequest request)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        var result = await _service.UpdateAsync(id, request, userId, orgId);
        return Ok(ApiResponse<CompanyDto>.Ok(result, "Company updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var orgId = GetCurrentOrgId() ?? 0;
        if (orgId == 0) return BadRequest(ApiResponse<object>.Fail("User must belong to an organization."));
        await _service.DeleteAsync(id, userId, orgId);
        return Ok(ApiResponse<bool>.Ok(true, "Company deleted."));
    }
}
