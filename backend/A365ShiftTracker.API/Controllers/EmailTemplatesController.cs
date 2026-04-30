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
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetAllAsync(userId);
            return Ok(ApiResponse<IEnumerable<EmailTemplateDto>>.Ok(result));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> GetById(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.GetByIdAsync(id, userId);
            return Ok(ApiResponse<EmailTemplateDto>.Ok(result));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> Create(CreateEmailTemplateRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.CreateAsync(request, userId);
            return Ok(ApiResponse<EmailTemplateDto>.Ok(result, "Template created."));
        }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> Update(int id, UpdateEmailTemplateRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.UpdateAsync(id, request, userId);
            return Ok(ApiResponse<EmailTemplateDto>.Ok(result, "Template updated."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _service.DeleteAsync(id, userId);
            return Ok(ApiResponse<bool>.Ok(true, "Template deleted."));
        }
        catch (KeyNotFoundException ex) { return NotFoundResult(ex.Message); }
        catch (Exception ex) { return InternalError(ex); }
    }
}

