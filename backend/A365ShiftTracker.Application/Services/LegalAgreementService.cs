using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class LegalAgreementService : ILegalAgreementService
{
    private readonly IUnitOfWork _uow;

    private readonly ILogger<LegalAgreementService> _logger;

    public LegalAgreementService(IUnitOfWork uow, ILogger<LegalAgreementService> logger)
    {
        _logger = logger;
        _uow = uow;
    }

    public async Task<List<LegalAgreementDto>> GetAllAsync(int userId)
    {
        try
        {
            var items = await _uow.LegalAgreements.FindAsync(l => l.UserId == userId);
            return items.OrderByDescending(l => l.CreatedAt).Select(MapToDto).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetAllAsync));
            throw;
        }
    }

    public async Task<LegalAgreementDto?> GetByIdAsync(int id, int userId)
    {
        try
        {
            var item = await _uow.LegalAgreements.Query()
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
            return item == null ? null : MapToDto(item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetByIdAsync));
            throw;
        }
    }

    public async Task<LegalAgreementDto> CreateAsync(CreateLegalAgreementRequest req, int userId)
    {
        try
        {
            var entity = new LegalAgreement
            {
                UserId = userId,
                Title = req.Title,
                Type = req.Type,
                Status = req.Status,
                Version = req.Version,
                Description = req.Description,
                ContactId = req.ContactId,
                CompanyId = req.CompanyId,
                ProjectId = req.ProjectId,
                LeadId = req.LeadId,
                OurSignatory = req.OurSignatory,
                CounterSignatory = req.CounterSignatory,
                EffectiveDate = req.EffectiveDate,
                ExpiryDate = req.ExpiryDate,
                SignedDate = req.SignedDate,
                AutoRenew = req.AutoRenew,
                RenewalNoticeDays = req.RenewalNoticeDays,
                FileUrl = req.FileUrl,
                FileName = req.FileName,
                Notes = req.Notes
            };
            await _uow.LegalAgreements.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task<LegalAgreementDto?> UpdateAsync(int id, UpdateLegalAgreementRequest req, int userId)
    {
        try
        {
            var entity = await _uow.LegalAgreements.Query()
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
            if (entity == null) return null;
    
            entity.Title = req.Title;
            entity.Type = req.Type;
            entity.Status = req.Status;
            entity.Version = req.Version;
            entity.Description = req.Description;
            entity.ContactId = req.ContactId;
            entity.CompanyId = req.CompanyId;
            entity.ProjectId = req.ProjectId;
            entity.LeadId = req.LeadId;
            entity.OurSignatory = req.OurSignatory;
            entity.CounterSignatory = req.CounterSignatory;
            entity.EffectiveDate = req.EffectiveDate;
            entity.ExpiryDate = req.ExpiryDate;
            entity.SignedDate = req.SignedDate;
            entity.AutoRenew = req.AutoRenew;
            entity.RenewalNoticeDays = req.RenewalNoticeDays;
            entity.FileUrl = req.FileUrl;
            entity.FileName = req.FileName;
            entity.Notes = req.Notes;
    
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateAsync));
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        try
        {
            var entity = await _uow.LegalAgreements.Query()
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);
            if (entity == null) return false;
            await _uow.LegalAgreements.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
    }

    public async Task<List<LegalAgreementDto>> GetExpiringSoonAsync(int userId)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var items = await _uow.LegalAgreements.FindAsync(l =>
                l.UserId == userId &&
                l.ExpiryDate.HasValue &&
                l.Status != "Expired" && l.Status != "Terminated" &&
                l.RenewalNoticeDays.HasValue &&
                l.ExpiryDate.Value.Date <= today.AddDays(l.RenewalNoticeDays.Value));
            return items.Select(MapToDto).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
    }

    private static LegalAgreementDto MapToDto(LegalAgreement l) => new()
    {
        Id = l.Id,
        Title = l.Title,
        Type = l.Type,
        Status = l.Status,
        Version = l.Version,
        Description = l.Description,
        ContactId = l.ContactId,
        CompanyId = l.CompanyId,
        ProjectId = l.ProjectId,
        LeadId = l.LeadId,
        OurSignatory = l.OurSignatory,
        CounterSignatory = l.CounterSignatory,
        EffectiveDate = l.EffectiveDate,
        ExpiryDate = l.ExpiryDate,
        SignedDate = l.SignedDate,
        AutoRenew = l.AutoRenew,
        RenewalNoticeDays = l.RenewalNoticeDays,
        FileUrl = l.FileUrl,
        FileName = l.FileName,
        Notes = l.Notes,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt,
        CreatedByName = l.CreatedByName,
        UpdatedByName = l.UpdatedByName
    };
}

