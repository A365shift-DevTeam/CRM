using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private readonly IUnitOfWork _uow;

    public EmailTemplateService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<EmailTemplateDto>> GetAllAsync(int userId)
    {
        var templates = await _uow.EmailTemplates.FindAsync(t => t.UserId == userId);
        return templates.OrderBy(t => t.Name).Select(MapToDto);
    }

    public async Task<EmailTemplateDto> GetByIdAsync(int id, int userId)
    {
        var entity = await _uow.EmailTemplates.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Template {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        return MapToDto(entity);
    }

    public async Task<EmailTemplateDto> CreateAsync(CreateEmailTemplateRequest request, int userId)
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

    public async Task<EmailTemplateDto> UpdateAsync(int id, UpdateEmailTemplateRequest request, int userId)
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

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.EmailTemplates.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Template {id} not found.");
        if (entity.UserId != userId) throw new UnauthorizedAccessException();
        await _uow.EmailTemplates.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static EmailTemplateDto MapToDto(EmailTemplate t) => new()
    {
        Id = t.Id, Name = t.Name, Subject = t.Subject,
        Body = t.Body, Variables = t.Variables, CreatedAt = t.CreatedAt
    };
}
