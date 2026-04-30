using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.Extensions.Logging;
namespace A365ShiftTracker.Application.Services;

public class CompanyService : ICompanyService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<CompanyService> _logger;

    public CompanyService(IUnitOfWork uow, ILogger<CompanyService> logger)
    {
        _uow = uow;
        _logger = logger;
    }

    public async Task<PagedResult<CompanyDto>> GetAllAsync(int orgId, int page, int pageSize)
    {
        try
        {
            var paged = await _uow.Companies.GetPagedAsync(
                c => c.OrgId == orgId && !c.IsDeleted,
                page,
                pageSize,
                q => q.OrderBy(c => c.Name));
            return new PagedResult<CompanyDto>
            {
                Items = paged.Items.Select(MapToDto),
                TotalCount = paged.TotalCount,
                Page = paged.Page,
                PageSize = paged.PageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(GetAllAsync));
            throw;
        }
    }

    public async Task<CompanyDto> CreateAsync(CreateCompanyRequest request, int userId, int orgId)
    {
        try
        {
            var entity = new Company
            {
                UserId = userId,
                OrgId = orgId,
                Name = request.Name,
                Industry = request.Industry,
                Size = request.Size,
                Website = request.Website,
                Address = request.Address,
                Country = request.Country,
                Gstin = request.Gstin,
                Pan = request.Pan,
                Cin = request.Cin,
                MsmeStatus = request.MsmeStatus,
                TdsSection = request.TdsSection,
                TdsRate = request.TdsRate,
                InternationalTaxId = request.InternationalTaxId,
                Tags = request.Tags,
            };
    
            await _uow.Companies.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(CreateAsync));
            throw;
        }
    }

    public async Task<CompanyDto> UpdateAsync(int id, UpdateCompanyRequest request, int userId, int orgId)
    {
        try
        {
            var entity = await _uow.Companies.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Company {id} not found.");
    
            if (entity.OrgId != orgId)
                throw new UnauthorizedAccessException("You do not have access to this company.");
    
            entity.Name = request.Name;
            entity.Industry = request.Industry;
            entity.Size = request.Size;
            entity.Website = request.Website;
            entity.Address = request.Address;
            entity.Country = request.Country;
            entity.Gstin = request.Gstin;
            entity.Pan = request.Pan;
            entity.Cin = request.Cin;
            entity.MsmeStatus = request.MsmeStatus;
            entity.TdsSection = request.TdsSection;
            entity.TdsRate = request.TdsRate;
            entity.InternationalTaxId = request.InternationalTaxId;
            entity.Tags = request.Tags;
    
            await _uow.Companies.UpdateAsync(entity);
            await _uow.SaveChangesAsync();
            return MapToDto(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(UpdateAsync));
            throw;
        }
    }

    public async Task DeleteAsync(int id, int userId, int orgId)
    {
        try
        {
            var entity = await _uow.Companies.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Company {id} not found.");
    
            if (entity.OrgId != orgId)
                throw new UnauthorizedAccessException("You do not have access to this company.");
    
            await _uow.Companies.DeleteAsync(entity);
            await _uow.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {Method}", nameof(DeleteAsync));
            throw;
        }
    }

    private static CompanyDto MapToDto(Company c) => new()
    {
        Id = c.Id, Name = c.Name, Industry = c.Industry, Size = c.Size,
        Website = c.Website, Address = c.Address, Country = c.Country,
        Gstin = c.Gstin, Pan = c.Pan, Cin = c.Cin, MsmeStatus = c.MsmeStatus,
        TdsSection = c.TdsSection, TdsRate = c.TdsRate,
        InternationalTaxId = c.InternationalTaxId, Tags = c.Tags, CreatedAt = c.CreatedAt,
    };
}

