# Phase 2 — Legal Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Legal Agreement tracker — MSA, NDA, SOW, Internal Approval — with lifecycle management, CRM entity linking, file upload, and renewal expiry alerts.

**Architecture:** New `LegalAgreement` entity extending `AuditableEntity` (from Phase 1). Standard service/controller/DTO backend stack following the `Lead` pattern. Frontend: `legalService.js` → `Legal.jsx` page with `StatsGrid` + `PageToolbar` + `StandardListView` + `LegalModal.jsx` tabbed form + `<AuditPanel>` History tab. Expiry alerts fetched on app load in `MainLayout.jsx`.

**Tech Stack:** ASP.NET Core 8 · EF Core · PostgreSQL · React 19 · Lucide icons · Cloudinary (file upload via existing `storageService`)

**Prerequisite:** Phase 1 must be complete (AuditableEntity has user-stamp fields, `AuditLog` entity exists, migration applied).

---

## File Map

**Backend — Created:**
- `A365ShiftTracker.Domain/Entities/LegalAgreement.cs`
- `A365ShiftTracker.Application/DTOs/LegalAgreementDtos.cs`
- `A365ShiftTracker.Application/Interfaces/ILegalAgreementService.cs`
- `A365ShiftTracker.Application/Services/LegalAgreementService.cs`
- `A365ShiftTracker.API/Controllers/LegalAgreementsController.cs`

**Backend — Modified:**
- `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs` — add `LegalAgreements` DbSet + table config
- `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs` — add `LegalAgreements` property
- `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs` — add lazy property
- `A365ShiftTracker.Infrastructure/DependencyInjection.cs` — register `ILegalAgreementService`
- DB migration: `AddLegalAgreementsTable`

**Frontend — Created:**
- `src/services/legalService.js`
- `src/pages/Legal/Legal.jsx`
- `src/pages/Legal/LegalModal.jsx`
- `src/pages/Legal/Legal.css`

**Frontend — Modified:**
- `src/App.jsx` — add `/legal` route
- `src/layouts/MainLayout.jsx` — replace Legal placeholder nav with real link

---

### Task 1: Create `LegalAgreement` entity

**Files:**
- Create: `A365ShiftTracker.Domain/Entities/LegalAgreement.cs`

- [ ] **Step 1: Create the entity file**

```csharp
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class LegalAgreement : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;          // "MSA"|"NDA"|"SOW"|"Internal Approval"
    public string Status { get; set; } = "Draft";              // "Draft"|"Under Review"|"Approved"|"Signed"|"Expired"|"Terminated"
    public string? Version { get; set; }                       // "v1.0"
    public string? Description { get; set; }

    // CRM Links (all optional)
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }

    // Parties
    public string? OurSignatory { get; set; }
    public string? CounterSignatory { get; set; }

    // Dates
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? SignedDate { get; set; }

    // Renewal
    public bool AutoRenew { get; set; } = false;
    public int? RenewalNoticeDays { get; set; }                // alert X days before expiry

    // Document
    public string? FileUrl { get; set; }                       // Cloudinary URL
    public string? FileName { get; set; }
    public string? Notes { get; set; }
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Domain
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Domain/Entities/LegalAgreement.cs
git commit -m "feat(legal): add LegalAgreement entity"
```

---

### Task 2: Create DTOs

**Files:**
- Create: `A365ShiftTracker.Application/DTOs/LegalAgreementDtos.cs`

- [ ] **Step 1: Create the DTO file**

```csharp
namespace A365ShiftTracker.Application.DTOs;

public class LegalAgreementDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string? Description { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public string? OurSignatory { get; set; }
    public string? CounterSignatory { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? SignedDate { get; set; }
    public bool AutoRenew { get; set; }
    public int? RenewalNoticeDays { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}

public class CreateLegalAgreementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public string? Version { get; set; }
    public string? Description { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public string? OurSignatory { get; set; }
    public string? CounterSignatory { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? SignedDate { get; set; }
    public bool AutoRenew { get; set; } = false;
    public int? RenewalNoticeDays { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public string? Notes { get; set; }
}

public class UpdateLegalAgreementRequest : CreateLegalAgreementRequest { }
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Application
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Application/DTOs/LegalAgreementDtos.cs
git commit -m "feat(legal): add LegalAgreementDto + request DTOs"
```

---

### Task 3: Create `ILegalAgreementService` and `LegalAgreementService`

**Files:**
- Create: `A365ShiftTracker.Application/Interfaces/ILegalAgreementService.cs`
- Create: `A365ShiftTracker.Application/Services/LegalAgreementService.cs`

- [ ] **Step 1: Create the interface**

```csharp
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
```

- [ ] **Step 2: Create the service**

```csharp
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class LegalAgreementService : ILegalAgreementService
{
    private readonly IUnitOfWork _uow;

    public LegalAgreementService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<LegalAgreementDto>> GetAllAsync(int userId)
    {
        var items = await _uow.LegalAgreements.FindAsync(l => l.UserId == userId);
        return items.OrderByDescending(l => l.CreatedAt).Select(MapToDto).ToList();
    }

    public async Task<LegalAgreementDto?> GetByIdAsync(int id, int userId)
    {
        var item = await _uow.LegalAgreements.FindOneAsync(l => l.Id == id && l.UserId == userId);
        return item == null ? null : MapToDto(item);
    }

    public async Task<LegalAgreementDto> CreateAsync(CreateLegalAgreementRequest req, int userId)
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

    public async Task<LegalAgreementDto?> UpdateAsync(int id, UpdateLegalAgreementRequest req, int userId)
    {
        var entity = await _uow.LegalAgreements.FindOneAsync(l => l.Id == id && l.UserId == userId);
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

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var entity = await _uow.LegalAgreements.FindOneAsync(l => l.Id == id && l.UserId == userId);
        if (entity == null) return false;
        _uow.LegalAgreements.Remove(entity);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<List<LegalAgreementDto>> GetExpiringSoonAsync(int userId)
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
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Application
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add A365ShiftTracker.Application/Interfaces/ILegalAgreementService.cs \
        A365ShiftTracker.Application/Services/LegalAgreementService.cs
git commit -m "feat(legal): add ILegalAgreementService + LegalAgreementService"
```

---

### Task 4: Register in UnitOfWork and DI

**Files:**
- Modify: `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs`
- Modify: `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs`
- Modify: `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs`
- Modify: `A365ShiftTracker.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Add DbSet and table config to `AppDbContext.cs`**

Add the DbSet with the other DbSets:
```csharp
public DbSet<LegalAgreement> LegalAgreements => Set<LegalAgreement>();
```

Add table config in `OnModelCreating` before the snake_case loop:
```csharp
// ─── Legal Agreements ─────────────────────────────
modelBuilder.Entity<LegalAgreement>(e =>
{
    e.ToTable("legal_agreements");
    e.HasIndex(l => l.UserId);
    e.HasIndex(l => l.Status);
    e.HasIndex(l => l.Type);
    e.HasIndex(l => l.ExpiryDate);
});
```

- [ ] **Step 2: Add to `IUnitOfWork.cs`**

```csharp
IRepository<LegalAgreement> LegalAgreements { get; }
```

- [ ] **Step 3: Add to `UnitOfWork.cs`**

```csharp
private IRepository<LegalAgreement>? _legalAgreements;
public IRepository<LegalAgreement> LegalAgreements => _legalAgreements ??= new Repository<LegalAgreement>(_context);
```

- [ ] **Step 4: Register service in `DependencyInjection.cs`**

```csharp
services.AddScoped<ILegalAgreementService, LegalAgreementService>();
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
git commit -m "feat(legal): register LegalAgreement in DbContext, UnitOfWork, and DI"
```

---

### Task 5: Create `LegalAgreementsController`

**Files:**
- Create: `A365ShiftTracker.API/Controllers/LegalAgreementsController.cs`

- [ ] **Step 1: Create the controller**

```csharp
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/legal-agreements")]
public class LegalAgreementsController : BaseApiController
{
    private readonly ILegalAgreementService _service;

    public LegalAgreementsController(ILegalAgreementService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<List<LegalAgreementDto>>.Ok(result, "Legal agreements retrieved"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement retrieved"));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLegalAgreementRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(req, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLegalAgreementRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, req, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<LegalAgreementDto>.Ok(result, "Legal agreement updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _service.DeleteAsync(id, userId);
        if (!deleted) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(null, "Legal agreement deleted"));
    }

    [HttpGet("expiring-soon")]
    public async Task<IActionResult> GetExpiringSoon()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetExpiringSoonAsync(userId);
        return Ok(ApiResponse<List<LegalAgreementDto>>.Ok(result, "Expiring agreements retrieved"));
    }
}
```

- [ ] **Step 2: Build the full solution**

```bash
cd backend && dotnet build A365ShiftTracker.API
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.API/Controllers/LegalAgreementsController.cs
git commit -m "feat(legal): add LegalAgreementsController with CRUD + expiring-soon endpoint"
```

---

### Task 6: Run DB Migration

- [ ] **Step 1: Generate migration**

```bash
cd backend && dotnet ef migrations add AddLegalAgreementsTable \
  --project A365ShiftTracker.Infrastructure \
  --startup-project A365ShiftTracker.API
```

Expected: `Done.`

- [ ] **Step 2: Review the migration**

Confirm the migration creates a `legal_agreements` table with all expected snake_case columns.

- [ ] **Step 3: Apply migration**

```bash
cd backend && dotnet ef database update \
  --project A365ShiftTracker.Infrastructure \
  --startup-project A365ShiftTracker.API
```

Expected: `Done.`

- [ ] **Step 4: Start the API and test with curl**

```bash
# Start API
cd backend && dotnet run --project A365ShiftTracker.API

# In another terminal — get a JWT token first (use existing login endpoint)
# Then:
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/legal-agreements
```

Expected: `{"success":true,"data":[],"message":"Legal agreements retrieved"}`

- [ ] **Step 5: Commit**

```bash
git add A365ShiftTracker.Infrastructure/Migrations/
git commit -m "feat(legal): db migration AddLegalAgreementsTable"
```

---

### Task 7: Create `legalService.js`

**Files:**
- Create: `src/services/legalService.js`

- [ ] **Step 1: Create the service**

```js
import apiClient from './apiClient';

const base = '/legal-agreements';

export const legalService = {
  getAll: () =>
    apiClient.get(base).then(r => r.data?.data ?? []),

  getById: (id) =>
    apiClient.get(`${base}/${id}`).then(r => r.data?.data),

  create: (data) =>
    apiClient.post(base, data).then(r => r.data?.data),

  update: (id, data) =>
    apiClient.put(`${base}/${id}`, data).then(r => r.data?.data),

  delete: (id) =>
    apiClient.delete(`${base}/${id}`).then(r => r.data),

  getExpiringSoon: () =>
    apiClient.get(`${base}/expiring-soon`).then(r => r.data?.data ?? []),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/legalService.js
git commit -m "feat(legal): add legalService.js"
```

---

### Task 8: Create `Legal.css`

**Files:**
- Create: `src/pages/Legal/Legal.css`

- [ ] **Step 1: Create the CSS file**

```css
/* Legal Module */

.legal-type-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.legal-type-msa  { background: rgba(67,97,238,0.10); color: #4361EE; }
.legal-type-nda  { background: rgba(139,92,246,0.10); color: #7C3AED; }
.legal-type-sow  { background: rgba(16,185,129,0.10); color: #059669; }
.legal-type-internal { background: rgba(245,158,11,0.10); color: #B45309; }

/* Status badges — reuse badge-enterprise base from index.css */
.legal-status-draft        { background: #F1F5F9; color: #64748B; }
.legal-status-under-review { background: rgba(67,97,238,0.10); color: #4361EE; }
.legal-status-approved     { background: rgba(245,158,11,0.10); color: #B45309; }
.legal-status-signed       { background: rgba(16,185,129,0.10); color: #059669; }
.legal-status-expired      { background: rgba(239,68,68,0.10); color: #DC2626; }
.legal-status-terminated   { background: #F1F5F9; color: #94A3B8; }

/* Expiry warning */
.legal-expiry-warning {
  color: #F59E0B;
  font-weight: 700;
}

.legal-expiry-danger {
  color: #EF4444;
  font-weight: 700;
}

/* File upload area */
.legal-file-area {
  border: 2px dashed #E1E8F4;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.legal-file-area:hover {
  border-color: #4361EE;
  background: rgba(67,97,238,0.03);
}

.legal-file-area.has-file {
  border-color: #10B981;
  background: rgba(16,185,129,0.04);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Legal/Legal.css
git commit -m "feat(legal): add Legal.css"
```

---

### Task 9: Create `LegalModal.jsx`

**Files:**
- Create: `src/pages/Legal/LegalModal.jsx`

- [ ] **Step 1: Create the modal**

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';
import { Upload, FileText, X } from 'lucide-react';
import AuditPanel from '../../components/AuditPanel/AuditPanel';
import { storageService } from '../../services/storageService';

const TYPES = ['MSA', 'NDA', 'SOW', 'Internal Approval'];
const STATUSES = ['Draft', 'Under Review', 'Approved', 'Signed', 'Expired', 'Terminated'];

const emptyForm = {
  title: '', type: 'MSA', status: 'Draft', version: '', description: '',
  contactId: '', companyId: '', projectId: '', leadId: '',
  ourSignatory: '', counterSignatory: '',
  effectiveDate: '', expiryDate: '', signedDate: '',
  autoRenew: false, renewalNoticeDays: '',
  fileUrl: '', fileName: '', notes: ''
};

export default function LegalModal({ show, onHide, editing, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('details');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title ?? '',
        type: editing.type ?? 'MSA',
        status: editing.status ?? 'Draft',
        version: editing.version ?? '',
        description: editing.description ?? '',
        contactId: editing.contactId ?? '',
        companyId: editing.companyId ?? '',
        projectId: editing.projectId ?? '',
        leadId: editing.leadId ?? '',
        ourSignatory: editing.ourSignatory ?? '',
        counterSignatory: editing.counterSignatory ?? '',
        effectiveDate: editing.effectiveDate ? editing.effectiveDate.split('T')[0] : '',
        expiryDate: editing.expiryDate ? editing.expiryDate.split('T')[0] : '',
        signedDate: editing.signedDate ? editing.signedDate.split('T')[0] : '',
        autoRenew: editing.autoRenew ?? false,
        renewalNoticeDays: editing.renewalNoticeDays ?? '',
        fileUrl: editing.fileUrl ?? '',
        fileName: editing.fileName ?? '',
        notes: editing.notes ?? ''
      });
    } else {
      setForm(emptyForm);
    }
    setTab('details');
  }, [editing, show]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await storageService.upload(file);
      set('fileUrl', url);
      set('fileName', file.name);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    if (!form.type) { alert('Type is required'); return; }
    const payload = {
      ...form,
      contactId: form.contactId ? parseInt(form.contactId) : null,
      companyId: form.companyId ? parseInt(form.companyId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      leadId: form.leadId ? parseInt(form.leadId) : null,
      renewalNoticeDays: form.renewalNoticeDays ? parseInt(form.renewalNoticeDays) : null,
      effectiveDate: form.effectiveDate || null,
      expiryDate: form.expiryDate || null,
      signedDate: form.signedDate || null,
    };
    onSaved(payload);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 700 }}>
          {editing ? 'Edit Agreement' : 'New Legal Agreement'}
        </Modal.Title>
      </Modal.Header>

      <Tab.Container activeKey={tab} onSelect={setTab}>
        <Modal.Body style={{ padding: '0' }}>
          <Nav variant="tabs" style={{ padding: '0 20px', borderBottom: '1px solid #E1E8F4', background: '#F8FAFC' }}>
            <Nav.Item><Nav.Link eventKey="details" style={{ fontSize: 13 }}>Details</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="parties" style={{ fontSize: 13 }}>Parties & Dates</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="document" style={{ fontSize: 13 }}>Document</Nav.Link></Nav.Item>
            {editing && <Nav.Item><Nav.Link eventKey="history" style={{ fontSize: 13 }}>History</Nav.Link></Nav.Item>}
          </Nav>

          <div style={{ padding: '20px' }}>
            <Tab.Content>
              {/* Details Tab */}
              <Tab.Pane eventKey="details">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Title *</Form.Label>
                  <Form.Control className="glass-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Acme Corp MSA 2026" />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Type *</Form.Label>
                    <Form.Select className="glass-input" value={form.type} onChange={e => set('type', e.target.value)}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Status</Form.Label>
                    <Form.Select className="glass-input" value={form.status} onChange={e => set('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </Form.Select>
                  </div>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Version</Form.Label>
                  <Form.Control className="glass-input" value={form.version} onChange={e => set('version', e.target.value)} placeholder="v1.0" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} className="glass-input" value={form.description} onChange={e => set('description', e.target.value)} />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Contact ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.contactId} onChange={e => set('contactId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Company ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.companyId} onChange={e => set('companyId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Project ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.projectId} onChange={e => set('projectId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Lead ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.leadId} onChange={e => set('leadId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
              </Tab.Pane>

              {/* Parties & Dates Tab */}
              <Tab.Pane eventKey="parties">
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Our Signatory</Form.Label>
                    <Form.Control className="glass-input" value={form.ourSignatory} onChange={e => set('ourSignatory', e.target.value)} placeholder="e.g. CEO Name" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Counter-party Signatory</Form.Label>
                    <Form.Control className="glass-input" value={form.counterSignatory} onChange={e => set('counterSignatory', e.target.value)} placeholder="e.g. Client Name" />
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Effective Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.effectiveDate} onChange={e => set('effectiveDate', e.target.value)} />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Expiry Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Signed Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.signedDate} onChange={e => set('signedDate', e.target.value)} />
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <Form.Check
                    type="switch"
                    id="auto-renew-switch"
                    label="Auto-renew"
                    checked={form.autoRenew}
                    onChange={e => set('autoRenew', e.target.checked)}
                  />
                  {form.autoRenew && (
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        className="glass-input"
                        type="number"
                        style={{ width: 80 }}
                        value={form.renewalNoticeDays}
                        onChange={e => set('renewalNoticeDays', e.target.value)}
                        placeholder="30"
                        min={1}
                      />
                      <span style={{ fontSize: 13, color: '#64748B' }}>days before expiry</span>
                    </div>
                  )}
                </div>
                <Form.Group>
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Notes</Form.Label>
                  <Form.Control as="textarea" rows={4} className="glass-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes, renewal conditions, etc." />
                </Form.Group>
              </Tab.Pane>

              {/* Document Tab */}
              <Tab.Pane eventKey="document">
                <div className={`legal-file-area ${form.fileUrl ? 'has-file' : ''}`} onClick={() => document.getElementById('legal-file-input').click()}>
                  {form.fileUrl ? (
                    <div>
                      <FileText size={28} style={{ color: '#10B981', marginBottom: 8 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{form.fileName}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>Click to replace</p>
                      <button
                        className="btn btn-sm mt-3"
                        style={{ background: 'none', border: '1px solid #E1E8F4', borderRadius: 8, fontSize: 12, color: '#64748B' }}
                        onClick={e => { e.stopPropagation(); window.open(form.fileUrl, '_blank'); }}
                      >
                        View Document
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} style={{ color: '#94A3B8', marginBottom: 8 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#475569' }}>
                        {uploading ? 'Uploading…' : 'Click to upload agreement document'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8' }}>PDF, DOCX, PNG — max 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="legal-file-input"
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                {form.fileUrl && (
                  <button
                    className="btn btn-sm mt-2"
                    style={{ color: '#EF4444', background: 'none', border: 'none', fontSize: 12, padding: 0 }}
                    onClick={() => { set('fileUrl', ''); set('fileName', ''); }}
                  >
                    <X size={12} style={{ marginRight: 4 }} />Remove file
                  </button>
                )}
              </Tab.Pane>

              {/* History Tab */}
              {editing && (
                <Tab.Pane eventKey="history">
                  <AuditPanel entityName="LegalAgreement" entityId={editing?.id} />
                </Tab.Pane>
              )}
            </Tab.Content>
          </div>
        </Modal.Body>
      </Tab.Container>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={handleSave} style={{ background: '#4361EE', border: 'none' }}>
          {editing ? 'Save Changes' : 'Create Agreement'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Legal/LegalModal.jsx
git commit -m "feat(legal): add LegalModal with Details/Parties/Document/History tabs"
```

---

### Task 10: Create `Legal.jsx` page

**Files:**
- Create: `src/pages/Legal/Legal.jsx`

- [ ] **Step 1: Create the page**

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { legalService } from '../../services/legalService';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import { Plus, FileText, Shield, AlertTriangle, Clock } from 'lucide-react';
import { FaPen, FaTrash, FaEye } from 'react-icons/fa6';
import LegalModal from './LegalModal';
import './Legal.css';

const TYPE_CLASS = {
  'MSA': 'legal-type-msa',
  'NDA': 'legal-type-nda',
  'SOW': 'legal-type-sow',
  'Internal Approval': 'legal-type-internal',
};

const STATUS_CLASS = {
  'Draft': 'legal-status-draft',
  'Under Review': 'legal-status-under-review',
  'Approved': 'legal-status-approved',
  'Signed': 'legal-status-signed',
  'Expired': 'legal-status-expired',
  'Terminated': 'legal-status-terminated',
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
}

function ExpiryCell({ expiryDate }) {
  if (!expiryDate) return <span style={{ color: '#CBD5E1' }}>—</span>;
  const days = daysUntil(expiryDate);
  const label = new Date(expiryDate).toLocaleDateString();
  if (days < 0) return <span className="legal-expiry-danger">{label} (Expired)</span>;
  if (days <= 30) return <span className="legal-expiry-warning">{label} ({days}d)</span>;
  return <span>{label}</span>;
}

export default function Legal() {
  const [agreements, setAgreements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await legalService.getAll();
      setAgreements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = agreements;
    if (search) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || (a.counterSignatory ?? '').toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) list = list.filter(a => a.type === typeFilter);
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    setFiltered(list);
  }, [agreements, search, typeFilter, statusFilter]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setShowModal(true); };

  const handleSaved = async (payload) => {
    try {
      if (editing) {
        await legalService.update(editing.id, payload);
      } else {
        await legalService.create(payload);
      }
      setShowModal(false);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this agreement?')) return;
    try {
      await legalService.delete(id);
      setAgreements(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  // Stats
  const total = agreements.length;
  const active = agreements.filter(a => a.status === 'Signed').length;
  const expiring = agreements.filter(a => {
    const d = daysUntil(a.expiryDate);
    return d !== null && d >= 0 && d <= 30 && a.status !== 'Expired' && a.status !== 'Terminated';
  }).length;
  const drafts = agreements.filter(a => a.status === 'Draft').length;

  const stats = [
    { label: 'Total', value: total, icon: <FileText size={18} />, color: '#4361EE' },
    { label: 'Active (Signed)', value: active, icon: <Shield size={18} />, color: '#10B981' },
    { label: 'Expiring Soon', value: expiring, icon: <AlertTriangle size={18} />, color: '#F59E0B' },
    { label: 'Drafts', value: drafts, icon: <Clock size={18} />, color: '#64748B' },
  ];

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-display)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <PageToolbar
        title="Legal Agreements"
        itemCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agreements…"
        extraControls={
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {['MSA', 'NDA', 'SOW', 'Internal Approval'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['Draft', 'Under Review', 'Approved', 'Signed', 'Expired', 'Terminated'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        }
        actions={[{ label: 'New Agreement', icon: <Plus size={16} />, variant: 'primary', onClick: openCreate }]}
      />

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E1E8F4' }}>
              <tr>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Counter-party</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Effective</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry</th>
                <th style={{ padding: '10px 16px', width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No agreements found.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => openEdit(a)}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0F172A' }}>
                    {a.title}
                    {a.version && <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>{a.version}</span>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`legal-type-badge ${TYPE_CLASS[a.type] ?? ''}`}>{a.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge-enterprise ${STATUS_CLASS[a.status] ?? ''}`}>{a.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#475569' }}>{a.counterSignatory ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#64748B' }}>
                    {a.effectiveDate ? new Date(a.effectiveDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}><ExpiryCell expiryDate={a.expiryDate} /></td>
                  <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, opacity: 0 }} className="row-actions">
                      <button className="action-icon-btn text-info" title="Edit" onClick={() => openEdit(a)}><FaPen size={12} /></button>
                      <button className="action-icon-btn text-danger" title="Delete" onClick={() => handleDelete(a.id)}><FaTrash size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LegalModal
        show={showModal}
        onHide={() => setShowModal(false)}
        editing={editing}
        onSaved={handleSaved}
      />

      <style>{`tr:hover .row-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Legal/Legal.jsx
git commit -m "feat(legal): add Legal.jsx page with list, stats, filters"
```

---

### Task 11: Wire routing and nav

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/layouts/MainLayout.jsx` (or wherever nav links live)

- [ ] **Step 1: Add the route in `App.jsx`**

Find where the `/legal` route is defined (it's a placeholder). Replace the placeholder import and element with:

```jsx
import Legal from './pages/Legal/Legal';
// ...
<Route path="/legal" element={<Legal />} />
```

- [ ] **Step 2: Update nav in `MainLayout.jsx`**

Find the Legal nav entry (likely a `<PlaceholderPage>` or similar). Confirm the link points to `/legal` — it likely already does. If the nav text says something other than "Legal", update to "Legal".

- [ ] **Step 3: Start dev server and test**

```bash
cd frontend && npm run dev
```

Navigate to `/legal`. Confirm the page loads. Click "New Agreement", fill in Title + Type, save. Confirm it appears in the list. Open it, edit the status, save, reopen the History tab — confirm an audit entry appears.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/layouts/MainLayout.jsx
git commit -m "feat(legal): wire Legal route and nav entry"
```

---

### Task 12: Expiry notifications in `MainLayout.jsx`

**Files:**
- Modify: `src/layouts/MainLayout.jsx`

- [ ] **Step 1: Find the existing notification logic in `MainLayout.jsx`**

```bash
grep -n "NotificationBell\|notification\|useEffect" src/layouts/MainLayout.jsx | head -30
```

- [ ] **Step 2: Add expiry check on app load**

In `MainLayout.jsx`, in the existing `useEffect` that runs on mount (or create one), add:

```jsx
import { legalService } from '../services/legalService';

// Inside the component, add this useEffect:
useEffect(() => {
  legalService.getExpiringSoon().then(items => {
    items.forEach(a => {
      const days = Math.ceil((new Date(a.expiryDate) - Date.now()) / 86400000);
      const msg = `${a.type} "${a.title}" expires in ${days} day${days === 1 ? '' : 's'}`;
      // Push to whatever notification system exists — check how NotificationBell receives notifications
      // Common pattern: addNotification({ message: msg, type: 'warning' })
      console.warn('[Legal expiry]', msg); // fallback until notification hook confirmed
    });
  }).catch(() => {});
}, []);
```

Then check how `NotificationBell` receives notifications in this codebase:
```bash
grep -n "addNotification\|pushNotification\|setNotifications\|NotificationContext" src/layouts/MainLayout.jsx src/components/ -r | head -20
```

Replace the `console.warn` with the actual notification mechanism found.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/MainLayout.jsx
git commit -m "feat(legal): add expiry notifications on app load"
```

---

### Phase 2 Complete

The Legal Module is fully operational. Proceed to Phase 3 (Tickets Module).
