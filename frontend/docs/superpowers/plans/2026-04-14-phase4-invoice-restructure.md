# Phase 4 — Invoice Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mislabeled "Invoice" nav entry, introduce a proper `Invoice` entity auto-created when milestone status changes to "Invoiced", split the 3000-line `ProjectTrackerComplete.jsx` into focused components, add an `InvoiceList` inside deal detail view, and fix three identified logic bugs.

**Architecture:** New `Invoice` entity linked to `ProjectFinance` + `Milestone`. Auto-creation logic added to `ProjectFinanceService.UpdateAsync` (existing service that handles milestone saves). Frontend: `ProjectTrackerComplete.jsx` decomposed into `Invoice.jsx` (orchestrator) + 7 sub-components under `components/`. `InvoiceList.jsx` and `InvoiceCard.jsx` are new components for the deal detail view.

**Tech Stack:** ASP.NET Core 8 · EF Core · PostgreSQL · React 19 · jsPDF · Recharts

**Prerequisite:** Phase 1 must be complete (Invoice entity will extend `AuditableEntity`; `ProjectFinance`, `Milestone` already upgraded to `AuditableEntity` in Phase 1).

---

## File Map

**Backend — Created:**
- `A365ShiftTracker.Domain/Entities/Invoice.cs`
- `A365ShiftTracker.Application/DTOs/InvoiceDtos.cs`
- `A365ShiftTracker.Application/Interfaces/IInvoiceService.cs`
- `A365ShiftTracker.Application/Services/InvoiceService.cs`
- `A365ShiftTracker.API/Controllers/InvoicesController.cs`

**Backend — Modified:**
- `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs` — add `Invoices` DbSet + config
- `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs` — add `Invoices` property
- `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs` — add lazy property
- `A365ShiftTracker.Infrastructure/DependencyInjection.cs` — register `IInvoiceService`
- `A365ShiftTracker.Application/Services/ProjectFinanceService.cs` — auto-create Invoice when milestone status → "Invoiced"
- DB migration: `AddInvoicesTable`

**Frontend — Modified (split):**
- `src/pages/Invoice/Invoice.jsx` — becomes the orchestrator (replaces thin wrapper)
- `src/pages/Invoice/ProjectTrackerComplete.jsx` — reduced to PDF/Excel utilities only (not a React component)

**Frontend — Created:**
- `src/pages/Invoice/components/DealDashboard.jsx` — dashboard KPIs, charts, project table
- `src/pages/Invoice/components/DealWizard.jsx` — wizard shell (4-step progress bar)
- `src/pages/Invoice/components/BusinessDetails.jsx` — wizard step 1: deal info + contact picker
- `src/pages/Invoice/components/StakeholderPanel.jsx` — wizard step 2: stakeholder splits
- `src/pages/Invoice/components/MilestonePanel.jsx` — wizard step 3: milestone config with % validation
- `src/pages/Invoice/components/ChargesPanel.jsx` — wizard step 4: tax/charge configuration
- `src/pages/Invoice/components/InvoiceList.jsx` — invoice list within a deal
- `src/pages/Invoice/components/InvoiceCard.jsx` — single invoice row
- `src/services/invoiceService.js` — new API service

**Frontend — Modified:**
- `src/layouts/MainLayout.jsx` — rename "Invoice" → "Deal Finance"

---

### Task 1: Create `Invoice` entity

**Files:**
- Create: `A365ShiftTracker.Domain/Entities/Invoice.cs`

- [ ] **Step 1: Create the entity**

```csharp
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Invoice : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;   // "INV-2026-0001"
    public int ProjectFinanceId { get; set; }
    public int MilestoneId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "AED";
    public string Status { get; set; } = "Draft";               // "Draft"|"Sent"|"Paid"|"Overdue"|"Cancelled"
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }

    // Navigation
    public ProjectFinance ProjectFinance { get; set; } = null!;
    public Milestone Milestone { get; set; } = null!;
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Domain
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Domain/Entities/Invoice.cs
git commit -m "feat(invoice): add Invoice entity"
```

---

### Task 2: Create Invoice DTOs

**Files:**
- Create: `A365ShiftTracker.Application/DTOs/InvoiceDtos.cs`

- [ ] **Step 1: Create the DTO file**

```csharp
namespace A365ShiftTracker.Application.DTOs;

public class InvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int ProjectFinanceId { get; set; }
    public int MilestoneId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? MilestoneName { get; set; }        // denormalized for display
    public decimal? MilestonePercentage { get; set; }
}

public class CreateInvoiceRequest
{
    public int ProjectFinanceId { get; set; }
    public int MilestoneId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientAddress { get; set; }
    public string? ClientGstin { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "AED";
    public string? Notes { get; set; }
}

public class UpdateInvoiceRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Application
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Application/DTOs/InvoiceDtos.cs
git commit -m "feat(invoice): add Invoice DTOs"
```

---

### Task 3: Create `IInvoiceService` and `InvoiceService`

**Files:**
- Create: `A365ShiftTracker.Application/Interfaces/IInvoiceService.cs`
- Create: `A365ShiftTracker.Application/Services/InvoiceService.cs`

- [ ] **Step 1: Create the interface**

```csharp
using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IInvoiceService
{
    Task<List<InvoiceDto>> GetAllAsync(int userId);
    Task<InvoiceDto?> GetByIdAsync(int id, int userId);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req, int userId);
    Task<InvoiceDto?> UpdateStatusAsync(int id, UpdateInvoiceRequest req, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<List<InvoiceDto>> GetByProjectFinanceAsync(int projectFinanceId, int userId);
}
```

- [ ] **Step 2: Create the service**

```csharp
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Application.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _uow;

    public InvoiceService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<InvoiceDto>> GetAllAsync(int userId)
    {
        var items = await _uow.Invoices.Query()
            .Where(i => i.UserId == userId)
            .Include(i => i.Milestone)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<InvoiceDto?> GetByIdAsync(int id, int userId)
    {
        var item = await _uow.Invoices.Query()
            .Include(i => i.Milestone)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        return item == null ? null : MapToDto(item);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req, int userId)
    {
        // Generate invoice number: INV-{YYYY}-{sequential padded to 4}
        var existingCount = await _uow.Invoices.Query().CountAsync(i => i.UserId == userId);
        var number = $"INV-{DateTime.UtcNow.Year}-{(existingCount + 1):D4}";

        var entity = new Invoice
        {
            UserId = userId,
            InvoiceNumber = number,
            ProjectFinanceId = req.ProjectFinanceId,
            MilestoneId = req.MilestoneId,
            ClientName = req.ClientName,
            ClientAddress = req.ClientAddress,
            ClientGstin = req.ClientGstin,
            DueDate = req.DueDate,
            SubTotal = req.SubTotal,
            TaxAmount = req.TaxAmount,
            TotalAmount = req.TotalAmount,
            Currency = req.Currency,
            Notes = req.Notes
        };

        await _uow.Invoices.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<InvoiceDto?> UpdateStatusAsync(int id, UpdateInvoiceRequest req, int userId)
    {
        var entity = await _uow.Invoices.Query()
            .Include(i => i.Milestone)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (entity == null) return null;

        entity.Status = req.Status;
        entity.Notes = req.Notes ?? entity.Notes;
        entity.PdfUrl = req.PdfUrl ?? entity.PdfUrl;
        entity.DueDate = req.DueDate ?? entity.DueDate;

        // If marking Paid, update the milestone PaidDate
        if (req.Status == "Paid" && entity.Milestone != null && entity.Milestone.PaidDate == null)
        {
            entity.Milestone.PaidDate = DateTime.UtcNow;
        }

        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Invoices.FindOneAsync(i => i.Id == id && i.UserId == userId);
        if (entity == null) return false;
        _uow.Invoices.Remove(entity);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<List<InvoiceDto>> GetByProjectFinanceAsync(int projectFinanceId, int userId)
    {
        var items = await _uow.Invoices.Query()
            .Where(i => i.ProjectFinanceId == projectFinanceId && i.UserId == userId)
            .Include(i => i.Milestone)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    private static InvoiceDto MapToDto(Invoice i) => new()
    {
        Id = i.Id,
        InvoiceNumber = i.InvoiceNumber,
        ProjectFinanceId = i.ProjectFinanceId,
        MilestoneId = i.MilestoneId,
        ClientName = i.ClientName,
        ClientAddress = i.ClientAddress,
        ClientGstin = i.ClientGstin,
        InvoiceDate = i.InvoiceDate,
        DueDate = i.DueDate,
        SubTotal = i.SubTotal,
        TaxAmount = i.TaxAmount,
        TotalAmount = i.TotalAmount,
        Currency = i.Currency,
        Status = i.Status,
        Notes = i.Notes,
        PdfUrl = i.PdfUrl,
        CreatedAt = i.CreatedAt,
        MilestoneName = i.Milestone?.Name,
        MilestonePercentage = i.Milestone?.Percentage,
    };
}
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Application
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add A365ShiftTracker.Application/Interfaces/IInvoiceService.cs \
        A365ShiftTracker.Application/Services/InvoiceService.cs
git commit -m "feat(invoice): add IInvoiceService + InvoiceService"
```

---

### Task 4: Register in AppDbContext, UnitOfWork, DI

**Files:**
- Modify: `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs`
- Modify: `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs`
- Modify: `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs`
- Modify: `A365ShiftTracker.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Add DbSet and config to `AppDbContext.cs`**

Add DbSet:
```csharp
public DbSet<Invoice> Invoices => Set<Invoice>();
```

Add table config in `OnModelCreating` before the snake_case loop:
```csharp
// ─── Invoices ─────────────────────────────────────
modelBuilder.Entity<Invoice>(e =>
{
    e.ToTable("invoices");
    e.HasIndex(i => i.UserId);
    e.HasIndex(i => i.InvoiceNumber).IsUnique();
    e.HasIndex(i => i.ProjectFinanceId);
    e.HasIndex(i => i.Status);
    e.HasOne(i => i.ProjectFinance).WithMany()
        .HasForeignKey(i => i.ProjectFinanceId).OnDelete(DeleteBehavior.Cascade);
    e.HasOne(i => i.Milestone).WithMany()
        .HasForeignKey(i => i.MilestoneId).OnDelete(DeleteBehavior.Restrict);
    e.Property(i => i.SubTotal).HasColumnType("decimal(18,2)");
    e.Property(i => i.TaxAmount).HasColumnType("decimal(18,2)");
    e.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
});
```

- [ ] **Step 2: Add to `IUnitOfWork.cs`**

```csharp
IRepository<Invoice> Invoices { get; }
```

- [ ] **Step 3: Add to `UnitOfWork.cs`**

```csharp
private IRepository<Invoice>? _invoices;
public IRepository<Invoice> Invoices => _invoices ??= new Repository<Invoice>(_context);
```

- [ ] **Step 4: Register in `DependencyInjection.cs`**

```csharp
services.AddScoped<IInvoiceService, InvoiceService>();
```

- [ ] **Step 5: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Infrastructure
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add A365ShiftTracker.Infrastructure/Data/AppDbContext.cs \
        A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs \
        A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs \
        A365ShiftTracker.Infrastructure/DependencyInjection.cs
git commit -m "feat(invoice): register Invoice in DbContext, UnitOfWork, and DI"
```

---

### Task 5: Create `InvoicesController`

**Files:**
- Create: `A365ShiftTracker.API/Controllers/InvoicesController.cs`

- [ ] **Step 1: Create the controller**

```csharp
using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/invoices")]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _service;

    public InvoicesController(IInvoiceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<List<InvoiceDto>>.Ok(result, "Invoices retrieved"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<InvoiceDto>.Ok(result, "Invoice retrieved"));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(req, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<InvoiceDto>.Ok(result, "Invoice created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateInvoiceRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateStatusAsync(id, req, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<InvoiceDto>.Ok(result, "Invoice updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _service.DeleteAsync(id, userId);
        if (!deleted) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(null, "Invoice deleted"));
    }

    [HttpGet("by-project/{projectFinanceId}")]
    public async Task<IActionResult> GetByProject(int projectFinanceId)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByProjectFinanceAsync(projectFinanceId, userId);
        return Ok(ApiResponse<List<InvoiceDto>>.Ok(result, "Invoices retrieved"));
    }
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build A365ShiftTracker.API
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.API/Controllers/InvoicesController.cs
git commit -m "feat(invoice): add InvoicesController"
```

---

### Task 6: Add auto-create trigger in `ProjectFinanceService`

**Files:**
- Modify: `A365ShiftTracker.Application/Services/ProjectFinanceService.cs`

- [ ] **Step 1: Inject `IInvoiceService` into `ProjectFinanceService`**

In `ProjectFinanceService.cs`, update the constructor to accept `IInvoiceService`:

```csharp
// BEFORE
public ProjectFinanceService(IUnitOfWork uow)
{
    _uow = uow;
}

// AFTER
private readonly IInvoiceService _invoiceService;

public ProjectFinanceService(IUnitOfWork uow, IInvoiceService invoiceService)
{
    _uow = uow;
    _invoiceService = invoiceService;
}
```

- [ ] **Step 2: Add auto-create logic in `UpdateAsync` — after milestones are rebuilt**

In `UpdateAsync`, after the `entity.Milestones.Clear()` + rebuild loop and before `await _uow.SaveChangesAsync()`, add:

```csharp
// Auto-create Invoice when a milestone status changes to "Invoiced"
// We need to save first so MilestoneIds are assigned, then create invoices.
// Use a deferred list to process after save.
var milestonesToInvoice = request.Milestones
    .Where(m => m.Status == "Invoiced")
    .ToList();
```

Then after `await _uow.SaveChangesAsync()`, add:

```csharp
// For each milestone now set to "Invoiced", check if an Invoice already exists.
// If not, auto-create one.
foreach (var milestoneReq in milestonesToInvoice)
{
    // Find the newly saved Milestone by name to get its Id
    var savedMilestone = entity.Milestones
        .FirstOrDefault(m => m.Name == milestoneReq.Name && m.Status == "Invoiced");
    if (savedMilestone == null) continue;

    // Check if invoice already exists for this milestone
    var existing = await _uow.Invoices.FindOneAsync(
        inv => inv.MilestoneId == savedMilestone.Id && inv.ProjectFinanceId == entity.Id);
    if (existing != null) continue;

    // Calculate amounts (use total charge % from Charges)
    var totalChargePct = entity.Charges.Sum(c => (decimal)(c.Percentage ?? 0));
    var subTotal = (entity.DealValue ?? 0) * (milestoneReq.Percentage ?? 0) / 100;
    var taxAmount = subTotal * totalChargePct / 100;
    var total = subTotal + taxAmount;

    await _invoiceService.CreateAsync(new CreateInvoiceRequest
    {
        ProjectFinanceId = entity.Id,
        MilestoneId = savedMilestone.Id,
        ClientName = entity.ClientName ?? string.Empty,
        ClientAddress = entity.ClientAddress,
        ClientGstin = entity.ClientGstin,
        SubTotal = subTotal,
        TaxAmount = taxAmount,
        TotalAmount = total,
        Currency = entity.Currency,
    }, entity.UserId);
}
```

Note: You will need to add a using for the Invoice DTOs namespace at the top of the file:
```csharp
using A365ShiftTracker.Application.DTOs;
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Application
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add A365ShiftTracker.Application/Services/ProjectFinanceService.cs
git commit -m "feat(invoice): auto-create Invoice when milestone status → Invoiced"
```

---

### Task 7: Run DB Migration

- [ ] **Step 1: Generate migration**

```bash
cd backend && dotnet ef migrations add AddInvoicesTable \
  --project A365ShiftTracker.Infrastructure \
  --startup-project A365ShiftTracker.API
```

Expected: `Done.`

- [ ] **Step 2: Review migration**

Confirm:
- `invoices` table created with all expected columns
- `invoice_number` unique index
- Foreign keys to `project_finances` (cascade) and `milestones` (restrict)
- `sub_total`, `tax_amount`, `total_amount` as `decimal(18,2)`

- [ ] **Step 3: Apply migration**

```bash
cd backend && dotnet ef database update \
  --project A365ShiftTracker.Infrastructure \
  --startup-project A365ShiftTracker.API
```

Expected: `Done.`

- [ ] **Step 4: Commit**

```bash
git add A365ShiftTracker.Infrastructure/Migrations/
git commit -m "feat(invoice): db migration AddInvoicesTable"
```

---

### Task 8: Create `invoiceService.js`

**Files:**
- Create: `src/services/invoiceService.js`

- [ ] **Step 1: Create the service**

```js
import apiClient from './apiClient';

const base = '/invoices';

export const invoiceService = {
  getAll: () =>
    apiClient.get(base).then(r => r.data?.data ?? []),

  getById: (id) =>
    apiClient.get(`${base}/${id}`).then(r => r.data?.data),

  create: (data) =>
    apiClient.post(base, data).then(r => r.data?.data),

  updateStatus: (id, data) =>
    apiClient.put(`${base}/${id}`, data).then(r => r.data?.data),

  delete: (id) =>
    apiClient.delete(`${base}/${id}`).then(r => r.data),

  getByProject: (projectFinanceId) =>
    apiClient.get(`${base}/by-project/${projectFinanceId}`).then(r => r.data?.data ?? []),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/invoiceService.js
git commit -m "feat(invoice): add invoiceService.js"
```

---

### Task 9: Extract PDF/Excel utilities from `ProjectTrackerComplete.jsx`

This is the first step of the file split. The goal: the PDF/Excel utility functions (lines 1–158 in the current file) become a standalone module. This makes the split safe — nothing changes visually, the code just moves.

**Files:**
- Create: `src/pages/Invoice/utils/reportGenerators.js`
- Modify: `src/pages/Invoice/ProjectTrackerComplete.jsx`

- [ ] **Step 1: Create `src/pages/Invoice/utils/reportGenerators.js`**

Move the following 4 functions from `ProjectTrackerComplete.jsx` into this new file. Add the required imports at the top:

```js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addPDFHeader } from '../../../utils/pdfGenerator';

export const generateProjectReportPDF = (details, stakeholders, milestones, taxes) => {
  // ... (copy the entire function body from lines 29-76 of ProjectTrackerComplete.jsx)
};

export const generateDashboardPDF = (projects, filter) => {
  // ... (copy the entire function body from lines 78-101)
};

export const exportProjectReport = (details, stakeholders, milestones, taxes) => {
  // ... (copy the entire function body from lines 103-145)
};

export const exportDashboardExcel = (projects, filter) => {
  // ... (copy the entire function body from lines 147-158)
};
```

- [ ] **Step 2: In `ProjectTrackerComplete.jsx`, replace the 4 function definitions with imports**

At the top of `ProjectTrackerComplete.jsx`, add:
```js
import { generateProjectReportPDF, generateDashboardPDF, exportProjectReport, exportDashboardExcel } from './utils/reportGenerators';
```

Remove the 4 function bodies (lines 29–158). The imports for `jsPDF`, `autoTable`, `XLSX` can also be removed from `ProjectTrackerComplete.jsx` since they're now in `reportGenerators.js`.

- [ ] **Step 3: Verify the app still works**

```bash
cd frontend && npm run dev
```

Navigate to `/invoice` (Deal Finance). Confirm the dashboard loads and PDF export still works. No visual changes expected.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Invoice/utils/reportGenerators.js \
        src/pages/Invoice/ProjectTrackerComplete.jsx
git commit -m "refactor(invoice): extract PDF/Excel utilities to reportGenerators.js"
```

---

### Task 10: Extract `DealDashboard` component

**Files:**
- Create: `src/pages/Invoice/components/DealDashboard.jsx`
- Modify: `src/pages/Invoice/ProjectTrackerComplete.jsx`

- [ ] **Step 1: Find the Dashboard component in `ProjectTrackerComplete.jsx`**

Look for the line `const Dashboard = ({ projects, onOpenProject, ...` (around line 181).

- [ ] **Step 2: Create `DealDashboard.jsx`**

Move the entire `Dashboard` component into this file. Fix the currency conversion fetch to use `localStorage` caching (Bug Fix #2 from spec):

```jsx
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateDashboardPDF, exportDashboardExcel } from '../utils/reportGenerators';
import { FaFilePdf } from 'react-icons/fa6';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { Plus } from 'lucide-react';

const COLORS = ['#4361EE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const FX_CACHE_KEY = 'fx_rates_cache';
const FX_TIMESTAMP_KEY = 'fx_rates_timestamp';
const FX_TTL_MS = 60 * 60 * 1000; // 1 hour

export default function DealDashboard({ projects, onOpenProject, onCreateProject, onStatusChange, onDeleteProject }) {
  const [filter, setFilter] = useState('All');
  const [chartMetric, setChartMetric] = useState('Revenue');
  const [dashboardCurrency, setDashboardCurrency] = useState('AED');
  const [exchangeRates, setExchangeRates] = useState({ AED: 1, USD: 0.2722, INR: 22.6 });

  // Bug Fix #2: cache exchange rates in localStorage for 1 hour
  useEffect(() => {
    const cached = localStorage.getItem(FX_CACHE_KEY);
    const timestamp = parseInt(localStorage.getItem(FX_TIMESTAMP_KEY) || '0', 10);
    if (cached && Date.now() - timestamp < FX_TTL_MS) {
      setExchangeRates(JSON.parse(cached));
      return;
    }
    fetch('https://api.exchangerate-api.com/v4/latest/AED')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.rates) {
          const rates = { AED: 1, ...data.rates };
          setExchangeRates(rates);
          localStorage.setItem(FX_CACHE_KEY, JSON.stringify(rates));
          localStorage.setItem(FX_TIMESTAMP_KEY, String(Date.now()));
        }
      })
      .catch(() => { /* use fallback rates */ });
  }, []);

  // (Copy the rest of the Dashboard component render logic from ProjectTrackerComplete.jsx here)
  // Remove the local `fetchRates` useEffect and replace with the cached version above.
  // The convertCurrency, filteredProjects, fmt, totalRevenue, activeProjects, totalSplits
  // calculated values and the JSX return — copy them unchanged.
}
```

- [ ] **Step 3: In `ProjectTrackerComplete.jsx`, replace `const Dashboard = ...` with an import**

```js
import DealDashboard from './components/DealDashboard';
```

Remove the `Dashboard` component definition. Find all uses of `<Dashboard` in the file and change to `<DealDashboard`.

- [ ] **Step 4: Verify no visual regressions**

```bash
cd frontend && npm run dev
```

Open `/invoice` (Deal Finance). Dashboard should look identical.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Invoice/components/DealDashboard.jsx \
        src/pages/Invoice/ProjectTrackerComplete.jsx
git commit -m "refactor(invoice): extract DealDashboard component + fx rate caching fix"
```

---

### Task 11: Extract wizard step components

**Files:**
- Create: `src/pages/Invoice/components/DealWizard.jsx`
- Create: `src/pages/Invoice/components/BusinessDetails.jsx`
- Create: `src/pages/Invoice/components/StakeholderPanel.jsx`
- Create: `src/pages/Invoice/components/MilestonePanel.jsx` (with % validation bug fix)
- Create: `src/pages/Invoice/components/ChargesPanel.jsx`
- Modify: `src/pages/Invoice/ProjectTrackerComplete.jsx`

- [ ] **Step 1: Find the wizard/project-detail section in `ProjectTrackerComplete.jsx`**

Search for the 4-step wizard structure: `Business Details`, `Stakeholders`, `Milestones`, `Charges/Tax`. These are the sections shown when a project detail is open.

- [ ] **Step 2: Create `DealWizard.jsx` — the wizard shell**

This component renders the progress indicator and wraps the active step:

```jsx
import React from 'react';

const STEPS = ['Business Details', 'Stakeholders', 'Milestones', 'Charges'];

export default function DealWizard({ activeStep, onStepChange, children }) {
  return (
    <div>
      {/* Step Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: '#F8FAFC', border: '1px solid #E1E8F4', borderRadius: 12, padding: '12px 20px' }}>
        {STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <button
              onClick={() => onStepChange(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
                fontWeight: i === activeStep ? 800 : 500, fontSize: 13,
                color: i === activeStep ? '#4361EE' : i < activeStep ? '#10B981' : '#94A3B8',
                borderBottom: i === activeStep ? '2px solid #4361EE' : '2px solid transparent',
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%', marginRight: 6, fontSize: 11, fontWeight: 800,
                background: i === activeStep ? '#4361EE' : i < activeStep ? '#10B981' : '#E1E8F4',
                color: i <= activeStep ? '#FFF' : '#94A3B8'
              }}>{i < activeStep ? '✓' : i + 1}</span>
              {step}
            </button>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: '#E1E8F4', margin: '0 4px' }} />}
          </React.Fragment>
        ))}
      </div>
      {/* Active step content */}
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `MilestonePanel.jsx` with % validation bug fix**

When extracting the Milestones step UI from `ProjectTrackerComplete.jsx`, add a running sum validation indicator:

```jsx
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function MilestonePanel({ milestones, onChange }) {
  const totalPct = milestones.reduce((s, m) => s + (parseFloat(m.percentage) || 0), 0);
  const isValid = Math.abs(totalPct - 100) < 0.01;

  // (Copy the milestones table/form UI from ProjectTrackerComplete.jsx unchanged)
  // Then add below the milestones list:

  return (
    <div>
      {/* (existing milestone UI here) */}

      {/* Bug Fix #1: % validation indicator */}
      <div style={{
        marginTop: 12, padding: '8px 14px', borderRadius: 8,
        background: isValid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isValid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: isValid ? '#059669' : '#DC2626' }}>
          Total: {totalPct.toFixed(1)}%
        </span>
        {!isValid && (
          <span style={{ fontSize: 12, color: '#DC2626' }}>
            Must sum to 100%. {totalPct < 100 ? `Add ${(100 - totalPct).toFixed(1)}% more.` : `Remove ${(totalPct - 100).toFixed(1)}%.`}
          </span>
        )}
        {isValid && <span style={{ fontSize: 12, color: '#059669' }}>✓ Milestones sum to 100%</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the remaining panels**

Extract `BusinessDetails.jsx`, `StakeholderPanel.jsx`, and `ChargesPanel.jsx` by moving the corresponding step UI sections from `ProjectTrackerComplete.jsx` into separate files. Each receives the relevant piece of form state and an `onChange` callback as props.

Pattern for each:
```jsx
// BusinessDetails.jsx
export default function BusinessDetails({ form, contacts, onChange }) { /* ... */ }

// StakeholderPanel.jsx
export default function StakeholderPanel({ stakeholders, dealValue, currency, onChange }) { /* ... */ }

// ChargesPanel.jsx
export default function ChargesPanel({ charges, onChange }) { /* ... */ }
```

- [ ] **Step 5: Update `ProjectTrackerComplete.jsx` to use extracted components**

```js
import DealWizard from './components/DealWizard';
import BusinessDetails from './components/BusinessDetails';
import StakeholderPanel from './components/StakeholderPanel';
import MilestonePanel from './components/MilestonePanel';
import ChargesPanel from './components/ChargesPanel';
```

Replace the inline wizard step JSX with:
```jsx
<DealWizard activeStep={currentStep} onStepChange={setCurrentStep}>
  {currentStep === 0 && <BusinessDetails form={form} contacts={contacts} onChange={handleFormChange} />}
  {currentStep === 1 && <StakeholderPanel stakeholders={stakeholders} dealValue={form.dealValue} currency={form.currency} onChange={setStakeholders} />}
  {currentStep === 2 && <MilestonePanel milestones={milestones} onChange={setMilestones} />}
  {currentStep === 3 && <ChargesPanel charges={charges} onChange={setCharges} />}
</DealWizard>
```

- [ ] **Step 6: Verify no visual regressions**

```bash
cd frontend && npm run dev
```

Open a deal. Walk through all 4 wizard steps. On the Milestones step, verify the % validation bar appears. Confirm save still works.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Invoice/components/DealWizard.jsx \
        src/pages/Invoice/components/BusinessDetails.jsx \
        src/pages/Invoice/components/StakeholderPanel.jsx \
        src/pages/Invoice/components/MilestonePanel.jsx \
        src/pages/Invoice/components/ChargesPanel.jsx \
        src/pages/Invoice/ProjectTrackerComplete.jsx
git commit -m "refactor(invoice): extract wizard step components + milestone % validation fix"
```

---

### Task 12: Create `InvoiceCard.jsx` and `InvoiceList.jsx`

**Files:**
- Create: `src/pages/Invoice/components/InvoiceCard.jsx`
- Create: `src/pages/Invoice/components/InvoiceList.jsx`

- [ ] **Step 1: Create `InvoiceCard.jsx`**

```jsx
import React from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

const STATUS_STYLE = {
  Draft:     { bg: '#F1F5F9', color: '#64748B' },
  Sent:      { bg: 'rgba(67,97,238,0.10)', color: '#4361EE' },
  Paid:      { bg: 'rgba(16,185,129,0.10)', color: '#059669' },
  Overdue:   { bg: 'rgba(239,68,68,0.10)', color: '#DC2626' },
  Cancelled: { bg: '#F1F5F9', color: '#94A3B8' },
};

export default function InvoiceCard({ invoice, onMarkPaid, onCancel, onViewPdf }) {
  const s = STATUS_STYLE[invoice.status] ?? STATUS_STYLE.Draft;
  const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <tr style={{ borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#4361EE', fontFamily: 'monospace' }}>
        {invoice.invoiceNumber}
      </td>
      <td style={{ padding: '10px 16px', color: '#475569' }}>
        {invoice.milestoneName ?? '—'}
        {invoice.milestonePercentage && <span style={{ color: '#94A3B8', marginLeft: 4 }}>({invoice.milestonePercentage}%)</span>}
      </td>
      <td style={{ padding: '10px 16px', color: '#0F172A', fontWeight: 600 }}>
        {invoice.currency} {fmt(invoice.subTotal)}
      </td>
      <td style={{ padding: '10px 16px', color: '#64748B' }}>
        {invoice.currency} {fmt(invoice.taxAmount)}
      </td>
      <td style={{ padding: '10px 16px', fontWeight: 800, color: '#0F172A' }}>
        {invoice.currency} {fmt(invoice.totalAmount)}
      </td>
      <td style={{ padding: '10px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: s.bg, color: s.color }}>
          {invoice.status}
        </span>
      </td>
      <td style={{ padding: '10px 16px', color: '#64748B' }}>
        {new Date(invoice.invoiceDate).toLocaleDateString()}
      </td>
      <td style={{ padding: '10px 16px', color: invoice.dueDate && new Date(invoice.dueDate) < Date.now() && invoice.status !== 'Paid' ? '#EF4444' : '#64748B' }}>
        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
      </td>
      <td style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {invoice.pdfUrl && (
            <button className="action-icon-btn text-info" title="View PDF" onClick={() => onViewPdf(invoice)}>
              <FileText size={12} />
            </button>
          )}
          {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <button className="action-icon-btn text-success" title="Mark Paid" onClick={() => onMarkPaid(invoice)}>
              <CheckCircle size={12} />
            </button>
          )}
          {invoice.status !== 'Cancelled' && invoice.status !== 'Paid' && (
            <button className="action-icon-btn text-danger" title="Cancel" onClick={() => onCancel(invoice)}>
              <XCircle size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: Create `InvoiceList.jsx`**

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { invoiceService } from '../../../services/invoiceService';
import InvoiceCard from './InvoiceCard';
import { FileText } from 'lucide-react';

export default function InvoiceList({ projectFinanceId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectFinanceId) return;
    setLoading(true);
    try {
      const data = await invoiceService.getByProject(projectFinanceId);
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  }, [projectFinanceId]);

  useEffect(() => { load(); }, [load]);

  const handleMarkPaid = async (invoice) => {
    if (!window.confirm(`Mark ${invoice.invoiceNumber} as Paid?`)) return;
    try {
      await invoiceService.updateStatus(invoice.id, { status: 'Paid' });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleCancel = async (invoice) => {
    if (!window.confirm(`Cancel ${invoice.invoiceNumber}?`)) return;
    try {
      await invoiceService.updateStatus(invoice.id, { status: 'Cancelled' });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleViewPdf = (invoice) => {
    if (invoice.pdfUrl) window.open(invoice.pdfUrl, '_blank');
  };

  if (loading) return <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>;

  return (
    <div style={{ marginTop: 24 }}>
      <h6 style={{ fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <FileText size={14} /> Invoices
        <span style={{ fontSize: 11, fontWeight: 700, background: '#F4F7FD', color: '#64748B', padding: '1px 8px', borderRadius: 999, border: '1px solid #E1E8F4' }}>{invoices.length}</span>
      </h6>
      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px', fontSize: 13, background: '#F8FAFC', borderRadius: 10, border: '1px dashed #E1E8F4' }}>
          No invoices yet. Set a milestone to "Invoiced" to auto-generate one.
        </div>
      ) : (
        <div style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 10, overflow: 'hidden' }}>
          <table className="table mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E1E8F4' }}>
              <tr>
                {['Invoice #', 'Milestone', 'Sub-total', 'Tax', 'Total', 'Status', 'Invoice Date', 'Due Date', ''].map(h => (
                  <th key={h} style={{ padding: '8px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  onMarkPaid={handleMarkPaid}
                  onCancel={handleCancel}
                  onViewPdf={handleViewPdf}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire `InvoiceList` into the deal detail view**

In `ProjectTrackerComplete.jsx`, find where the project detail view renders (after opening a project). Import and add `InvoiceList` at the bottom of the detail view, passing the current project finance ID:

```jsx
import InvoiceList from './components/InvoiceList';

// Inside the project detail render, add at the bottom:
<InvoiceList projectFinanceId={selectedProject?.id} />
```

- [ ] **Step 4: Test the auto-trigger**

```bash
cd frontend && npm run dev
```

1. Open a deal (project finance record)
2. Go to the Milestones step
3. Set a milestone status to "Invoiced" and save
4. Scroll to the Invoices section at the bottom — an invoice should appear automatically
5. Click "Mark Paid" — invoice status changes to Paid; reopen milestones step, confirm `PaidDate` is set

- [ ] **Step 5: Commit**

```bash
git add src/pages/Invoice/components/InvoiceCard.jsx \
        src/pages/Invoice/components/InvoiceList.jsx \
        src/pages/Invoice/ProjectTrackerComplete.jsx
git commit -m "feat(invoice): add InvoiceCard + InvoiceList, wire into deal detail view"
```

---

### Task 13: Create final `Invoice.jsx` orchestrator and cleanup

**Files:**
- Modify: `src/pages/Invoice/Invoice.jsx`
- Modify: `src/layouts/MainLayout.jsx`

- [ ] **Step 1: Update `Invoice.jsx` to be the real orchestrator**

The current `Invoice.jsx` is just a thin wrapper. Now that `ProjectTrackerComplete.jsx` is split, confirm it still works as the single entry point. If `ProjectTrackerComplete.jsx` still manages top-level state (project list, selected project), leave it as-is and keep the thin wrapper. If you prefer clean naming, rename the import:

```jsx
// src/pages/Invoice/Invoice.jsx
import React from 'react';
import DealFinancePage from './ProjectTrackerComplete';

export default function Invoice() {
  return <DealFinancePage />;
}
```

This keeps the route-facing component named `Invoice` while the internal name is descriptive.

- [ ] **Step 2: Rename nav entry from "Invoice" → "Deal Finance" in `MainLayout.jsx`**

Find the nav link that points to `/invoice`. Change its label text from "Invoice" to "Deal Finance":

```jsx
// Find something like:
{ label: 'Invoice', path: '/invoice', icon: ... }
// Change to:
{ label: 'Deal Finance', path: '/invoice', icon: ... }
```

Or in JSX nav:
```jsx
// BEFORE
<NavLink to="/invoice">Invoice</NavLink>

// AFTER
<NavLink to="/invoice">Deal Finance</NavLink>
```

- [ ] **Step 3: Verify end-to-end**

```bash
cd frontend && npm run dev
```

1. Confirm the sidebar shows "Deal Finance" instead of "Invoice"
2. Navigate to Deal Finance — dashboard loads
3. Open a project — wizard works with all 4 steps
4. Milestones step shows % validation bar
5. Set a milestone to "Invoiced" — invoice auto-creates and appears in InvoiceList
6. Mark the invoice Paid — updates correctly
7. PDF export from dashboard still works

- [ ] **Step 4: Commit**

```bash
git add src/pages/Invoice/Invoice.jsx \
        src/layouts/MainLayout.jsx
git commit -m "feat(invoice): rename nav Invoice → Deal Finance, finalize orchestrator"
```

---

### Phase 4 Complete

The Invoice module is now a proper `Invoice` entity tracked in the database, the frontend is split into focused components, milestone percentage validation prevents user errors, exchange rates are cached for an hour, and the nav is correctly labeled "Deal Finance". All 4 phases are complete.
