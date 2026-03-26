using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/email-templates")]
[Authorize]
public class EmailTemplatesController : BaseApiController
{
    private readonly IEmailTemplateService _service;

    public EmailTemplatesController(IEmailTemplateService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailTemplateDto>>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<IEnumerable<EmailTemplateDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        return Ok(ApiResponse<EmailTemplateDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> Create(CreateEmailTemplateRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(request, userId);
        return Ok(ApiResponse<EmailTemplateDto>.Ok(result, "Template created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> Update(int id, UpdateEmailTemplateRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, request, userId);
        return Ok(ApiResponse<EmailTemplateDto>.Ok(result, "Template updated."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = GetCurrentUserId();
        await _service.DeleteAsync(id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Template deleted."));
    }
}
