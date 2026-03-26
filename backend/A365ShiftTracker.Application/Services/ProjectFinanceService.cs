using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class ProjectFinanceService : IProjectFinanceService
{
    private readonly IUnitOfWork _uow;

    public ProjectFinanceService(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<ProjectFinanceDto>> GetAllAsync()
    {
        var finances = await _uow.ProjectFinances.Query()
            .Include(pf => pf.Milestones)
            .Include(pf => pf.Stakeholders)
            .Include(pf => pf.Charges)
            .ToListAsync();

        return finances.Select(MapToDto);
    }

    public async Task<ProjectFinanceDto?> GetByIdAsync(int id)
    {
        var entity = await _uow.ProjectFinances.Query()
            .Include(pf => pf.Milestones)
            .Include(pf => pf.Stakeholders)
            .Include(pf => pf.Charges)
            .FirstOrDefaultAsync(pf => pf.Id == id);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task<ProjectFinanceDto> CreateAsync(CreateProjectFinanceRequest request)
    {
        var entity = new ProjectFinance
        {
            ProjectId = request.ProjectId,
            ClientName = request.ClientName,
            ClientAddress = request.ClientAddress,
            ClientGstin = request.ClientGstin,
            Delivery = request.Delivery,
            DealValue = request.DealValue,
            Currency = request.Currency,
            Location = request.Location,
            Status = request.Status,
            Type = request.Type
        };

        // Add milestones
        foreach (var m in request.Milestones)
        {
            entity.Milestones.Add(new Milestone
            {
                Name = m.Name, Percentage = m.Percentage, Status = m.Status,
                InvoiceDate = m.InvoiceDate, PaidDate = m.PaidDate,
                IsCustomName = m.IsCustomName, Order = m.Order
            });
        }

        // Add stakeholders
        foreach (var s in request.Stakeholders)
        {
            entity.Stakeholders.Add(new Stakeholder
            {
                Name = s.Name, Percentage = s.Percentage, PayoutTax = s.PayoutTax,
                PayoutStatus = s.PayoutStatus, PaidDate = s.PaidDate
            });
        }

        // Add charges
        foreach (var c in request.Charges)
        {
            entity.Charges.Add(new Charge
            {
                Name = c.Name, TaxType = c.TaxType, Country = c.Country,
                State = c.State, Percentage = c.Percentage
            });
        }

        await _uow.ProjectFinances.AddAsync(entity);
        await _uow.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<ProjectFinanceDto> UpdateAsync(int id, UpdateProjectFinanceRequest request)
    {
        var entity = await _uow.ProjectFinances.Query()
            .Include(pf => pf.Milestones)
            .Include(pf => pf.Stakeholders)
            .Include(pf => pf.Charges)
            .FirstOrDefaultAsync(pf => pf.Id == id)
            ?? throw new KeyNotFoundException($"ProjectFinance {id} not found.");

        entity.ProjectId = request.ProjectId;
        entity.ClientName = request.ClientName;
        entity.ClientAddress = request.ClientAddress;
        entity.ClientGstin = request.ClientGstin;
        entity.Delivery = request.Delivery;
        entity.DealValue = request.DealValue;
        entity.Currency = request.Currency;
        entity.Location = request.Location;
        entity.Status = request.Status;
        entity.Type = request.Type;

        // Replace milestones
        entity.Milestones.Clear();
        foreach (var m in request.Milestones)
        {
            entity.Milestones.Add(new Milestone
            {
                Name = m.Name, Percentage = m.Percentage, Status = m.Status,
                InvoiceDate = m.InvoiceDate, PaidDate = m.PaidDate,
                IsCustomName = m.IsCustomName, Order = m.Order
            });
        }

        // Replace stakeholders
        entity.Stakeholders.Clear();
        foreach (var s in request.Stakeholders)
        {
            entity.Stakeholders.Add(new Stakeholder
            {
                Name = s.Name, Percentage = s.Percentage, PayoutTax = s.PayoutTax,
                PayoutStatus = s.PayoutStatus, PaidDate = s.PaidDate
            });
        }

        // Replace charges
        entity.Charges.Clear();
        foreach (var c in request.Charges)
        {
            entity.Charges.Add(new Charge
            {
                Name = c.Name, TaxType = c.TaxType, Country = c.Country,
                State = c.State, Percentage = c.Percentage
            });
        }

        await _uow.ProjectFinances.UpdateAsync(entity);
        await _uow.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _uow.ProjectFinances.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"ProjectFinance {id} not found.");
        await _uow.ProjectFinances.DeleteAsync(entity);
        await _uow.SaveChangesAsync();
    }

    private static ProjectFinanceDto MapToDto(ProjectFinance pf) => new()
    {
        Id = pf.Id, ProjectId = pf.ProjectId, ClientName = pf.ClientName,
        ClientAddress = pf.ClientAddress, ClientGstin = pf.ClientGstin,
        Delivery = pf.Delivery, DealValue = pf.DealValue, Currency = pf.Currency,
        Location = pf.Location, Status = pf.Status, Type = pf.Type,
        DateCreated = pf.DateCreated,
        Milestones = pf.Milestones.OrderBy(m => m.Order).Select(m => new MilestoneDto
        {
            Id = m.Id, Name = m.Name, Percentage = m.Percentage, Status = m.Status,
            InvoiceDate = m.InvoiceDate, PaidDate = m.PaidDate,
            IsCustomName = m.IsCustomName, Order = m.Order
        }).ToList(),
        Stakeholders = pf.Stakeholders.Select(s => new StakeholderDto
        {
            Id = s.Id, Name = s.Name, Percentage = s.Percentage,
            PayoutTax = s.PayoutTax, PayoutStatus = s.PayoutStatus, PaidDate = s.PaidDate
        }).ToList(),
        Charges = pf.Charges.Select(c => new ChargeDto
        {
            Id = c.Id, Name = c.Name, TaxType = c.TaxType,
            Country = c.Country, State = c.State, Percentage = c.Percentage
        }).ToList()
    };
}
