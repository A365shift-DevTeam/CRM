using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IEmailTemplateService
{
    Task<IEnumerable<EmailTemplateDto>> GetAllAsync(int userId);
    Task<EmailTemplateDto> GetByIdAsync(int id, int userId);
    Task<EmailTemplateDto> CreateAsync(CreateEmailTemplateRequest request, int userId);
    Task<EmailTemplateDto> UpdateAsync(int id, UpdateEmailTemplateRequest request, int userId);
    Task DeleteAsync(int id, int userId);
}
