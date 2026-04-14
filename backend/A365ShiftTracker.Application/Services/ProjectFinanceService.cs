using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class ProjectFinanceService : IProjectFinanceService
{
    private readonly IUnitOfWork _uow;
    private readonly IInvoiceService _invoiceService;

    public ProjectFinanceService(IUnitOfWork uow, IInvoiceService invoiceService)
    {
        _uow = uow;
        _invoiceService = invoiceService;
    }

    private static DateTime? EnsureUtc(DateTime? dateTime)
    {
        if (!dateTime.HasValue) return null;
        var value = dateTime.Value;

        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    public async Task<IEnumerable<ProjectFinanceDto>> GetAllAsync(int userId)
    {
        var finances = await _uow.ProjectFinances.Query()
            .Where(pf => pf.UserId == userId)
            .Include(pf => pf.Milestones)
            .Include(pf => pf.Stakeholders)
            .Include(pf => pf.Charges)
            .ToListAsync();

        return finances.Select(MapToDto);
    }

    public async Task<ProjectFinanceDto?> GetByIdAsync(int id, int userId)
    {
        var entity = await _uow.ProjectFinances.Query()
            .Include(pf => pf.Milestones)
            .Include(pf => pf.Stakeholders)
            .Include(pf => pf.Charges)
            .FirstOrDefaultAsync(pf => pf.Id == id && pf.UserId == userId);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task<ProjectFinanceDto> CreateAsync(CreateProjectFinanceRequest request, int userId)
    {
        var entity = new ProjectFinance
        {
            UserId = userId,
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
                InvoiceDate = EnsureUtc(m.InvoiceDate), PaidDate = EnsureUtc(m.PaidDate),
                IsCustomName = m.IsCustomName, Order = m.Order
            });
        }

        // Add stakeholders
        foreach (var s in request.Stakeholders)
        {
            entity.Stakeholders.Add(new Stakeholder
            {
                Name = s.Name, Percentage = s.Percentage, PayoutTax = s.PayoutTax,
                PayoutStatus = s.PayoutStatus, PaidDate = EnsureUtc(s.PaidDate)
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

    public async Task<ProjectFinanceDto> UpdateAsync(int id, UpdateProjectFinanceRequest request, int userId)
    {
        var entity = await _uow.ProjectFinances.Query()
            .Include(pf => pf.Milestones)
            .Include(pf => pf.Stakeholders)
            .Include(pf => pf.Charges)
            .FirstOrDefaultAsync(pf => pf.Id == id)
            ?? throw new KeyNotFoundException($"ProjectFinance {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this project finance.");

        // Track which milestone names were already "Invoiced" so we only auto-create new ones
        var alreadyInvoicedNames = entity.Milestones
            .Where(m => m.Status == "Invoiced")
            .Select(m => m.Name ?? string.Empty)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

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
                InvoiceDate = EnsureUtc(m.InvoiceDate), PaidDate = EnsureUtc(m.PaidDate),
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
                PayoutStatus = s.PayoutStatus, PaidDate = EnsureUtc(s.PaidDate)
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

        // Auto-create invoices for milestones newly set to "Invoiced"
        var newlyInvoiced = entity.Milestones
            .Where(m => m.Status == "Invoiced" && !alreadyInvoicedNames.Contains(m.Name ?? string.Empty))
            .ToList();

        foreach (var milestone in newlyInvoiced)
        {
            var dealValue = entity.DealValue ?? 0m;
            var milestoneValue = dealValue * ((milestone.Percentage ?? 0m) / 100m);
            await _invoiceService.CreateAsync(new CreateInvoiceRequest
            {
                ProjectFinanceId = entity.Id,
                MilestoneId = milestone.Id,
                ClientName = entity.ClientName ?? string.Empty,
                ClientAddress = entity.ClientAddress,
                ClientGstin = entity.ClientGstin,
                SubTotal = milestoneValue,
                TaxAmount = 0m,
                TotalAmount = milestoneValue,
                Currency = entity.Currency
            }, userId);
        }

        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var entity = await _uow.ProjectFinances.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"ProjectFinance {id} not found.");

        if (entity.UserId != userId)
            throw new UnauthorizedAccessException("You do not have access to this project finance.");

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
