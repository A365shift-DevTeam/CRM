using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<EmailTemplateService> _logger;

    public EmailTemplateService(IUnitOfWork uow, ILogger<EmailTemplateService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<IEnumerable<EmailTemplateDto>> GetAllAsync(int userId)
    {
        try
        {
            var templates = await _uow.EmailTemplates.FindAsync(t => t.UserId == userId);
            return templates.OrderBy(t => t.Name).Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetAllAsync));
            throw;
        }
    }

    public async Task<EmailTemplateDto> GetByIdAsync(int id, int userId)
    {
        try
        {
            var entity = await _uow.EmailTemplates.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Template {id} not found.");
            if (entity.UserId != userId) throw new UnauthorizedAccessException();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetByIdAsync));
            throw;
        }
    }

    public async Task<EmailTemplateDto> CreateAsync(CreateEmailTemplateRequest request, int userId)
    {
        try
        {
            var entity = new EmailTemplate
            {
                UserId = userId,
                Name = request.Name,
                Subject = request.Subject,
                Body = request.Body,
                Variables = request.Variables
            };
            await _uow.EmailTemplates.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task<EmailTemplateDto> UpdateAsync(int id, UpdateEmailTemplateRequest request, int userId)
    {
        try
        {
            var entity = await _uow.EmailTemplates.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Template {id} not found.");
            if (entity.UserId != userId) throw new UnauthorizedAccessException();
            entity.Name = request.Name;
            entity.Subject = request.Subject;
            entity.Body = request.Body;
            entity.Variables = request.Variables;
            await _uow.EmailTemplates.UpdateAsync(entity);
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateAsync));
            throw;
        }
    }

    public async Task DeleteAsync(int id, int userId)
    {
        try
        {
            var entity = await _uow.EmailTemplates.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Template {id} not found.");
            if (entity.UserId != userId) throw new UnauthorizedAccessException();
            await _uow.EmailTemplates.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
    }

    private static EmailTemplateDto MapToDto(EmailTemplate t) => new()
    {
        Id = t.Id, Name = t.Name, Subject = t.Subject,
        Body = t.Body, Variables = t.Variables, CreatedAt = t.CreatedAt
    };
}

