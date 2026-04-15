# Phase 1 — Audit Base Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add enterprise-grade audit tracking — who changed what field, from what value, to what value, and when — across every entity in the system.

**Architecture:** Extend `AuditableEntity` with user-stamp fields, create an append-only `AuditLog` entity, inject `ICurrentUserService` into `AppDbContext.SaveChangesAsync` to intercept every save and write one row per changed field, expose a read-only API endpoint, and render a History tab via a shared `<AuditPanel>` React component.

**Tech Stack:** ASP.NET Core 8 · EF Core · PostgreSQL · React 19 · Lucide icons · DM Sans/Outfit fonts

---

## File Map

**Backend — Modified:**
- `A365ShiftTracker.Domain/Common/BaseEntity.cs` — add 4 user-stamp fields to `AuditableEntity`
- `A365ShiftTracker.Domain/Entities/ProjectFinance.cs` — change base class `BaseEntity` → `AuditableEntity`
- `A365ShiftTracker.Domain/Entities/Milestone.cs` — change base class `BaseEntity` → `AuditableEntity`
- `A365ShiftTracker.Domain/Entities/Stakeholder.cs` — change base class `BaseEntity` → `AuditableEntity`
- `A365ShiftTracker.Domain/Entities/Charge.cs` — change base class `BaseEntity` → `AuditableEntity`
- `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs` — inject `ICurrentUserService`, extend `SaveChangesAsync` to stamp users and write `AuditLog` rows
- `A365ShiftTracker.Infrastructure/DependencyInjection.cs` — register `ICurrentUserService`
- `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs` — add `AuditLogs` repository property
- `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs` — add `AuditLogs` lazy property

**Backend — Created:**
- `A365ShiftTracker.Domain/Entities/AuditLog.cs` — new entity
- `A365ShiftTracker.Application/Common/ICurrentUserService.cs` — interface
- `A365ShiftTracker.Infrastructure/Helpers/CurrentUserService.cs` — implementation reads from `IHttpContextAccessor`
- `A365ShiftTracker.Application/DTOs/AuditLogDtos.cs` — `AuditLogDto`
- `A365ShiftTracker.API/Controllers/AuditLogsController.cs` — read-only controller
- DB migration: `AddAuditFieldsAndAuditLogTable`

**Frontend — Created:**
- `src/components/AuditPanel/AuditPanel.jsx` — shared History tab component
- `src/components/AuditPanel/AuditPanel.css` — styles
- `src/services/auditService.js` — API calls

---

### Task 1: Extend `AuditableEntity` with user-stamp fields

**Files:**
- Modify: `A365ShiftTracker.Domain/Common/BaseEntity.cs`

- [ ] **Step 1: Open the file and add 4 properties to `AuditableEntity`**

Replace the existing `AuditableEntity` class with:

```csharp
public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedByUserId { get; set; }
    public int? UpdatedByUserId { get; set; }
    public string? CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
}
```

- [ ] **Step 2: Build the Domain project to verify no compile errors**

```bash
cd backend && dotnet build A365ShiftTracker.Domain
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Domain/Common/BaseEntity.cs
git commit -m "feat(audit): add user-stamp fields to AuditableEntity"
```

---

### Task 2: Upgrade `ProjectFinance`, `Milestone`, `Stakeholder`, `Charge` to `AuditableEntity`

**Files:**
- Modify: `A365ShiftTracker.Domain/Entities/ProjectFinance.cs`
- Modify: `A365ShiftTracker.Domain/Entities/Milestone.cs`
- Modify: `A365ShiftTracker.Domain/Entities/Stakeholder.cs`
- Modify: `A365ShiftTracker.Domain/Entities/Charge.cs`

- [ ] **Step 1: In each file, change `: BaseEntity` to `: AuditableEntity`**

In `ProjectFinance.cs` — find the class declaration line and change:
```csharp
// BEFORE
public class ProjectFinance : BaseEntity, IOwnedByUser

// AFTER
public class ProjectFinance : AuditableEntity, IOwnedByUser
```

Repeat the same change for `Milestone.cs`, `Stakeholder.cs`, `Charge.cs` (each file has `: BaseEntity` — change to `: AuditableEntity`).

Note: `Milestone`, `Stakeholder`, `Charge` may not have `IOwnedByUser` — only change the base class, leave the rest of the class body unchanged.

- [ ] **Step 2: Build to check for errors**

```bash
cd backend && dotnet build A365ShiftTracker.Domain
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Domain/Entities/ProjectFinance.cs \
        A365ShiftTracker.Domain/Entities/Milestone.cs \
        A365ShiftTracker.Domain/Entities/Stakeholder.cs \
        A365ShiftTracker.Domain/Entities/Charge.cs
git commit -m "feat(audit): upgrade ProjectFinance, Milestone, Stakeholder, Charge to AuditableEntity"
```

---

### Task 3: Create `AuditLog` entity

**Files:**
- Create: `A365ShiftTracker.Domain/Entities/AuditLog.cs`

- [ ] **Step 1: Create the file**

```csharp
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string EntityName { get; set; } = string.Empty;   // "Contact", "Lead", "LegalAgreement", etc.
    public int EntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;    // "Status", "DealValue", etc.
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Action { get; set; } = string.Empty;       // "Created" | "Updated" | "Deleted"
    public int ChangedByUserId { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Domain
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Domain/Entities/AuditLog.cs
git commit -m "feat(audit): add AuditLog entity"
```

---

### Task 4: Create `ICurrentUserService` and `CurrentUserService`

**Files:**
- Create: `A365ShiftTracker.Application/Common/ICurrentUserService.cs`
- Create: `A365ShiftTracker.Infrastructure/Helpers/CurrentUserService.cs`

- [ ] **Step 1: Create the interface**

```csharp
namespace A365ShiftTracker.Application.Common;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? UserName { get; }
    string? IpAddress { get; }
}
```

- [ ] **Step 2: Create the implementation**

```csharp
using System.Security.Claims;
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Http;

namespace A365ShiftTracker.Infrastructure.Helpers;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public string? UserName =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("name");

    public string? IpAddress =>
        _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
}
```

- [ ] **Step 3: Register in `DependencyInjection.cs`**

Open `A365ShiftTracker.Infrastructure/DependencyInjection.cs` and add inside the registration method (alongside the other `AddScoped` calls):

```csharp
services.AddHttpContextAccessor();
services.AddScoped<ICurrentUserService, CurrentUserService>();
```

Note: `AddHttpContextAccessor()` may already be registered elsewhere. If it is, skip it. Only add the `ICurrentUserService` line if missing.

- [ ] **Step 4: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Infrastructure
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add A365ShiftTracker.Application/Common/ICurrentUserService.cs \
        A365ShiftTracker.Infrastructure/Helpers/CurrentUserService.cs \
        A365ShiftTracker.Infrastructure/DependencyInjection.cs
git commit -m "feat(audit): add ICurrentUserService + CurrentUserService"
```

---

### Task 5: Wire `ICurrentUserService` into `AppDbContext` and extend `SaveChangesAsync`

**Files:**
- Modify: `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs`

- [ ] **Step 1: Add `using` statements at the top of `AppDbContext.cs`**

```csharp
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Http;
```

- [ ] **Step 2: Update the constructor to inject `ICurrentUserService`**

Replace the existing constructor:
```csharp
// BEFORE
public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

// AFTER
private readonly ICurrentUserService? _currentUser;

public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService? currentUser = null)
    : base(options)
{
    _currentUser = currentUser;
}
```

Making `ICurrentUserService` optional (default null) ensures the `AppDbContext` can still be constructed by EF tooling (migrations, design-time factory) where no HTTP context exists.

- [ ] **Step 3: Add `AuditLogs` DbSet — add this line with the other DbSets**

```csharp
public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
```

- [ ] **Step 4: Add `AuditLog` table config in `OnModelCreating` — add before the snake_case loop**

```csharp
// ─── Audit Logs ──────────────────────────────────
modelBuilder.Entity<AuditLog>(e =>
{
    e.ToTable("audit_logs");
    e.HasIndex(a => new { a.EntityName, a.EntityId });
    e.HasIndex(a => a.ChangedAt);
    e.HasIndex(a => a.ChangedByUserId);
});
```

- [ ] **Step 5: Replace `SaveChangesAsync` with the full audit version**

Replace the existing `SaveChangesAsync` override entirely:

```csharp
public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
{
    NormalizeDateTimeKinds();

    var now = DateTime.UtcNow;
    var userId = _currentUser?.UserId;
    var userName = _currentUser?.UserName ?? "System";
    var ipAddress = _currentUser?.IpAddress;

    var auditEntries = new List<AuditLog>();

    foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
    {
        if (entry.State == EntityState.Added)
        {
            entry.Entity.CreatedAt = now;
            entry.Entity.UpdatedAt = now;
            if (userId.HasValue)
            {
                entry.Entity.CreatedByUserId = userId;
                entry.Entity.CreatedByName = userName;
                entry.Entity.UpdatedByUserId = userId;
                entry.Entity.UpdatedByName = userName;
            }

            auditEntries.Add(new AuditLog
            {
                EntityName = entry.Entity.GetType().Name,
                EntityId = entry.Entity.Id, // Id is 0 here for new records; updated below
                FieldName = "_record",
                OldValue = null,
                NewValue = "created",
                Action = "Created",
                ChangedByUserId = userId ?? 0,
                ChangedByName = userName,
                ChangedAt = now,
                IpAddress = ipAddress
            });
        }
        else if (entry.State == EntityState.Modified)
        {
            entry.Entity.UpdatedAt = now;
            if (userId.HasValue)
            {
                entry.Entity.UpdatedByUserId = userId;
                entry.Entity.UpdatedByName = userName;
            }

            var skipFields = new HashSet<string> { "UpdatedAt", "UpdatedByUserId", "UpdatedByName" };

            foreach (var prop in entry.Properties
                .Where(p => p.IsModified && !skipFields.Contains(p.Metadata.Name)))
            {
                var oldVal = prop.OriginalValue?.ToString();
                var newVal = prop.CurrentValue?.ToString();
                if (oldVal == newVal) continue;

                auditEntries.Add(new AuditLog
                {
                    EntityName = entry.Entity.GetType().Name,
                    EntityId = entry.Entity.Id,
                    FieldName = prop.Metadata.Name,
                    OldValue = oldVal,
                    NewValue = newVal,
                    Action = "Updated",
                    ChangedByUserId = userId ?? 0,
                    ChangedByName = userName,
                    ChangedAt = now,
                    IpAddress = ipAddress
                });
            }
        }
        else if (entry.State == EntityState.Deleted)
        {
            auditEntries.Add(new AuditLog
            {
                EntityName = entry.Entity.GetType().Name,
                EntityId = entry.Entity.Id,
                FieldName = "_record",
                OldValue = "existed",
                NewValue = null,
                Action = "Deleted",
                ChangedByUserId = userId ?? 0,
                ChangedByName = userName,
                ChangedAt = now,
                IpAddress = ipAddress
            });
        }
    }

    var result = await base.SaveChangesAsync(cancellationToken);

    // After save: fix EntityId for newly-inserted records (EF now has the DB-generated Id)
    foreach (var log in auditEntries.Where(l => l.Action == "Created" && l.EntityId == 0))
    {
        // Find the corresponding Added entry's entity to get the real Id
        var entityName = log.EntityName;
        var addedEntry = ChangeTracker.Entries<AuditableEntity>()
            .FirstOrDefault(e => e.Entity.GetType().Name == entityName);
        if (addedEntry != null)
            log.EntityId = addedEntry.Entity.Id;
    }

    if (auditEntries.Count > 0)
    {
        AuditLogs.AddRange(auditEntries);
        await base.SaveChangesAsync(cancellationToken);
    }

    return result;
}
```

- [ ] **Step 6: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Infrastructure
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add A365ShiftTracker.Infrastructure/Data/AppDbContext.cs
git commit -m "feat(audit): wire ICurrentUserService into AppDbContext, write AuditLog rows on every save"
```

---

### Task 6: Add `AuditLog` to `IUnitOfWork` and `UnitOfWork`

**Files:**
- Modify: `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs`
- Modify: `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs`

- [ ] **Step 1: Add the property to `IUnitOfWork`**

In `IUnitOfWork.cs`, add alongside the other repository properties:

```csharp
IRepository<AuditLog> AuditLogs { get; }
```

Ensure `using A365ShiftTracker.Domain.Entities;` is at the top.

- [ ] **Step 2: Add the lazy property to `UnitOfWork`**

In `UnitOfWork.cs`, add a private backing field and property following the exact existing `??=` pattern:

```csharp
private IRepository<AuditLog>? _auditLogs;
public IRepository<AuditLog> AuditLogs => _auditLogs ??= new Repository<AuditLog>(_context);
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Infrastructure
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs \
        A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs
git commit -m "feat(audit): add AuditLogs repository to IUnitOfWork + UnitOfWork"
```

---

### Task 7: Create `AuditLogDto` and `AuditLogsController`

**Files:**
- Create: `A365ShiftTracker.Application/DTOs/AuditLogDtos.cs`
- Create: `A365ShiftTracker.API/Controllers/AuditLogsController.cs`

- [ ] **Step 1: Create the DTO file**

```csharp
namespace A365ShiftTracker.Application.DTOs;

public class AuditLogDto
{
    public int Id { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Action { get; set; } = string.Empty;
    public int ChangedByUserId { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? IpAddress { get; set; }
}
```

- [ ] **Step 2: Create the controller**

```csharp
using A365ShiftTracker.API.Controllers;
using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController : BaseApiController
{
    private readonly IUnitOfWork _uow;

    public AuditLogsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // GET /api/audit-logs?entityName=Contact&entityId=42&page=1&pageSize=50
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string entityName,
        [FromQuery] int entityId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var all = await _uow.AuditLogs.FindAsync(
            a => a.EntityName == entityName && a.EntityId == entityId);

        var ordered = all.OrderByDescending(a => a.ChangedAt).ToList();
        var total = ordered.Count;
        var paged = ordered.Skip((page - 1) * pageSize).Take(pageSize);

        var dtos = paged.Select(a => new AuditLogDto
        {
            Id = a.Id,
            EntityName = a.EntityName,
            EntityId = a.EntityId,
            FieldName = a.FieldName,
            OldValue = a.OldValue,
            NewValue = a.NewValue,
            Action = a.Action,
            ChangedByUserId = a.ChangedByUserId,
            ChangedByName = a.ChangedByName,
            ChangedAt = a.ChangedAt,
            IpAddress = a.IpAddress
        }).ToList();

        return Ok(ApiResponse<object>.Ok(new { items = dtos, total, page, pageSize }, "Audit logs retrieved"));
    }
}
```

- [ ] **Step 3: Build the API project**

```bash
cd backend && dotnet build A365ShiftTracker.API
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add A365ShiftTracker.Application/DTOs/AuditLogDtos.cs \
        A365ShiftTracker.API/Controllers/AuditLogsController.cs
git commit -m "feat(audit): add AuditLogsController with paginated GET endpoint"
```

---

### Task 8: Run EF Core DB Migration

- [ ] **Step 1: Generate the migration**

```bash
cd backend && dotnet ef migrations add AddAuditFieldsAndAuditLogTable \
  --project A365ShiftTracker.Infrastructure \
  --startup-project A365ShiftTracker.API
```

Expected output: `Build succeeded. Done. To undo this action, use 'ef migrations remove'`

If you get an error about a missing design-time factory, check that `A365ShiftTracker.API` has a valid `appsettings.json` with a PostgreSQL connection string.

- [ ] **Step 2: Review the generated migration file**

Open the new file in `A365ShiftTracker.Infrastructure/Migrations/` and confirm:
- `audit_logs` table is created with columns: `id`, `entity_name`, `entity_id`, `field_name`, `old_value`, `new_value`, `action`, `changed_by_user_id`, `changed_by_name`, `changed_at`, `ip_address`
- Columns `created_by_user_id`, `updated_by_user_id`, `created_by_name`, `updated_by_name` are added to existing auditable tables
- `project_finances`, `milestones`, `stakeholders`, `charges` also get `created_at`, `updated_at` columns (because they just became `AuditableEntity`)

- [ ] **Step 3: Apply the migration**

```bash
cd backend && dotnet ef database update \
  --project A365ShiftTracker.Infrastructure \
  --startup-project A365ShiftTracker.API
```

Expected: `Done.`

- [ ] **Step 4: Commit the migration files**

```bash
git add A365ShiftTracker.Infrastructure/Migrations/
git commit -m "feat(audit): db migration AddAuditFieldsAndAuditLogTable"
```

---

### Task 9: Create `auditService.js` (frontend)

**Files:**
- Create: `src/services/auditService.js`

- [ ] **Step 1: Create the service following the `leadService.js` pattern**

```js
import apiClient from './apiClient';

export const auditService = {
  getAuditLogs: (entityName, entityId, page = 1, pageSize = 50) =>
    apiClient.get('/audit-logs', { params: { entityName, entityId, page, pageSize } })
      .then(r => r.data?.data ?? { items: [], total: 0 }),
};
```

- [ ] **Step 2: Verify `apiClient.js` exists and uses the right base URL**

Run: `grep -n 'baseURL' src/services/apiClient.js`  
Expected: a line like `baseURL: 'http://localhost:5000/api'` (or env variable).  
No changes needed — just confirming the service will work.

- [ ] **Step 3: Commit**

```bash
git add src/services/auditService.js
git commit -m "feat(audit): add auditService.js"
```

---

### Task 10: Create `<AuditPanel>` component

**Files:**
- Create: `src/components/AuditPanel/AuditPanel.jsx`
- Create: `src/components/AuditPanel/AuditPanel.css`

- [ ] **Step 1: Create `AuditPanel.css`**

```css
/* AuditPanel — History timeline */
.audit-panel { padding: 8px 0; }

.audit-empty {
  text-align: center;
  color: #94A3B8;
  padding: 32px 16px;
  font-size: 13px;
}

.audit-timeline { display: flex; flex-direction: column; gap: 0; }

.audit-entry {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #F1F5F9;
  position: relative;
}

.audit-entry:last-child { border-bottom: none; }

.audit-icon-wrap {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.audit-icon-wrap.created { background: rgba(16,185,129,0.12); color: #10B981; }
.audit-icon-wrap.updated { background: rgba(67,97,238,0.10); color: #4361EE; }
.audit-icon-wrap.deleted { background: rgba(239,68,68,0.10); color: #EF4444; }

.audit-body { flex: 1; min-width: 0; }

.audit-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.audit-action-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.audit-action-badge.created { background: rgba(16,185,129,0.12); color: #059669; }
.audit-action-badge.updated { background: rgba(67,97,238,0.10); color: #4361EE; }
.audit-action-badge.deleted { background: rgba(239,68,68,0.10); color: #DC2626; }

.audit-field-name {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.audit-by {
  font-size: 11.5px;
  color: #94A3B8;
  margin-left: auto;
}

.audit-change {
  font-size: 12px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.audit-old { color: #94A3B8; text-decoration: line-through; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audit-arrow { color: #CBD5E1; }
.audit-new { color: #0F172A; font-weight: 600; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.audit-timestamp {
  font-size: 11px;
  color: #CBD5E1;
  margin-top: 2px;
  cursor: default;
}

.audit-load-more {
  width: 100%;
  margin-top: 8px;
  padding: 7px;
  font-size: 12px;
  color: #64748B;
  background: #F8FAFC;
  border: 1px solid #E1E8F4;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.audit-load-more:hover { background: #F1F5F9; }
```

- [ ] **Step 2: Create `AuditPanel.jsx`**

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, RefreshCw, Trash2, ChevronDown } from 'lucide-react';
import { auditService } from '../../services/auditService';
import './AuditPanel.css';

const ACTION_ICONS = {
  Created: <CheckCircle size={13} />,
  Updated: <RefreshCw size={13} />,
  Deleted: <Trash2 size={13} />,
};

function relativeTime(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function absoluteTime(dateStr) {
  return new Date(dateStr).toLocaleString();
}

export default function AuditPanel({ entityName, entityId }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p = 1) => {
    if (!entityId) return;
    setLoading(true);
    try {
      const result = await auditService.getAuditLogs(entityName, entityId, p);
      setLogs(prev => p === 1 ? result.items : [...prev, ...result.items]);
      setTotal(result.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [entityName, entityId]);

  useEffect(() => { load(1); }, [load]);

  if (!entityId) return <div className="audit-empty">Save the record first to see history.</div>;

  return (
    <div className="audit-panel">
      {loading && logs.length === 0 ? (
        <div className="audit-empty">Loading history…</div>
      ) : logs.length === 0 ? (
        <div className="audit-empty">No changes recorded yet.</div>
      ) : (
        <div className="audit-timeline">
          {logs.map(log => (
            <div key={log.id} className="audit-entry">
              <div className={`audit-icon-wrap ${log.action.toLowerCase()}`}>
                {ACTION_ICONS[log.action] ?? <RefreshCw size={13} />}
              </div>
              <div className="audit-body">
                <div className="audit-meta">
                  <span className={`audit-action-badge ${log.action.toLowerCase()}`}>{log.action}</span>
                  {log.fieldName !== '_record' && (
                    <span className="audit-field-name">{log.fieldName}</span>
                  )}
                  <span className="audit-by">by {log.changedByName}</span>
                </div>
                {log.fieldName !== '_record' && (log.oldValue || log.newValue) && (
                  <div className="audit-change">
                    {log.oldValue && <span className="audit-old" title={log.oldValue}>{log.oldValue}</span>}
                    {log.oldValue && log.newValue && <span className="audit-arrow">→</span>}
                    {log.newValue && <span className="audit-new" title={log.newValue}>{log.newValue}</span>}
                  </div>
                )}
                <div className="audit-timestamp" title={absoluteTime(log.changedAt)}>
                  {relativeTime(log.changedAt)}
                </div>
              </div>
            </div>
          ))}
          {logs.length < total && (
            <button className="audit-load-more" onClick={() => load(page + 1)} disabled={loading}>
              <ChevronDown size={13} style={{ marginRight: 4 }} />
              {loading ? 'Loading…' : `Load more (${total - logs.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AuditPanel/AuditPanel.jsx \
        src/components/AuditPanel/AuditPanel.css \
        src/services/auditService.js
git commit -m "feat(audit): add AuditPanel component + auditService"
```

---

### Task 11: Wire `AuditPanel` into Contact and Lead modals

**Files:**
- Modify: Contact modal file (find with `grep -rn "ContactModal\|contact.*modal" src/pages/Contacts/ --include="*.jsx"`)
- Modify: Lead modal file (find with `grep -rn "LeadModal\|lead.*modal" src/pages/Leads/ --include="*.jsx"`)

- [ ] **Step 1: Find the Contact modal component**

```bash
grep -rn "Modal.Header\|ModalHeader" src/pages/Contacts/ --include="*.jsx" -l
```

Open the file. Look for the modal tabs or modal body. Add a "History" tab.

- [ ] **Step 2: Add `AuditPanel` to the Contact modal**

At the top of the Contact modal file, add:
```jsx
import AuditPanel from '../../components/AuditPanel/AuditPanel';
```

Inside the modal, find the tab structure. If the modal has tabs (look for `Nav.Tab`, `Tab`, or similar), add a History tab:

```jsx
// Add to tab nav:
<Nav.Link eventKey="history">History</Nav.Link>

// Add to tab content:
<Tab.Pane eventKey="history">
  <AuditPanel entityName="Contact" entityId={contact?.id} />
</Tab.Pane>
```

If the modal does NOT have tabs yet, add a simple collapsible section at the bottom of the modal body:

```jsx
<div style={{ marginTop: 16, borderTop: '1px solid #E1E8F4', paddingTop: 12 }}>
  <h6 style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Change History</h6>
  <AuditPanel entityName="Contact" entityId={contact?.id} />
</div>
```

- [ ] **Step 3: Repeat for Lead modal**

Same pattern — import `AuditPanel`, find the modal, add the History section with `entityName="Lead"` and `entityId={lead?.id}`.

- [ ] **Step 4: Start the frontend dev server and verify**

```bash
cd frontend && npm run dev
```

Open a Contact or Lead record. Open the modal. Navigate to the History tab/section. Confirm it loads (empty is fine — no changes have been made since the migration). Open a contact, make an edit, save, reopen — confirm one audit entry appears.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Contacts/ src/pages/Leads/
git commit -m "feat(audit): wire AuditPanel into Contact and Lead modals"
```

---

### Phase 1 Complete

The audit base layer is fully in place. Every entity change is now recorded in `audit_logs`. The `<AuditPanel>` component is reusable — wire it into any new entity modal by passing `entityName` and `entityId`. Proceed to Phase 2 (Legal Module).
