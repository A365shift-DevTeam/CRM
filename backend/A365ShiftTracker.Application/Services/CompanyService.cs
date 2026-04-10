using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class CompanyService : ICompanyService
{
    private readonly IUnitOfWork _uow;

    public CompanyService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<CompanyDto>> GetAllAsync(int userId)
    {
        var companies = await _uow.Companies.FindAsync(c => c.UserId == userId);
        return companies.OrderBy(c => c.Name).Select(MapToDto);
    }

    public async Task<CompanyDto> CreateAsync(CreateCompanyRequest request, int userId)
    {
        var entity = new Company
        {
            UserId = userId,
            Name = request.Name,
            Industry = request.Industry,
            Size = request.Size,
            Website = request.Website,
            Address = request.Address,
            Country = request.Country,
            Gstin = request.Gstin,
            Tags = request.Tags,
        };

        await _uow.Companies.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<CompanyDto> UpdateAsync(int id, UpdateCompanyRequest request, int userId)
    {
        var entity = await _uow.Companies.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Company {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this company.");

        entity.Name = request.Name;
        entity.Industry = request.Industry;
        entity.Size = request.Size;
        entity.Website = request.Website;
        entity.Address = request.Address;
        entity.Country = request.Country;
        entity.Gstin = request.Gstin;
        entity.Tags = request.Tags;

        await _uow.Companies.UpdateAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Companies.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Company {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this company.");

        await _uow.Companies.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static CompanyDto MapToDto(Company c) => new()
    {
        Id = c.Id, Name = c.Name, Industry = c.Industry, Size = c.Size,
        Website = c.Website, Address = c.Address, Country = c.Country,
        Gstin = c.Gstin, Tags = c.Tags, CreatedAt = c.CreatedAt,
    };
}
