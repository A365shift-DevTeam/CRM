using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ILegalAgreementService
{
    Task<List<LegalAgreementDto>> GetAllAsync(int userId);
    Task<LegalAgreementDto?> GetByIdAsync(int id, int userId);
    Task<LegalAgreementDto> CreateAsync(CreateLegalAgreementRequest req, int userId);
    Task<LegalAgreementDto?> UpdateAsync(int id, UpdateLegalAgreementRequest req, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<List<LegalAgreementDto>> GetExpiringSoonAsync(int userId);
}
