# Backend Query Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `FindAsync`/`GetAllAsync` anti-patterns with `Query()` chains that push filtering, grouping, and aggregation into PostgreSQL.

**Architecture:** No schema changes, no new libraries. `IRepository<T>.Query()` returns `IQueryable<T>` — services swap `FindAsync` for `Query().Where().Select().ToListAsync()`. Background `Channel<T>` decouples audit log writes from the main save.

**Tech Stack:** EF Core 8, Npgsql, `EF.Functions.ILike`, `ExecuteUpdateAsync`, `System.Threading.Channels`

---

## Files Modified

| File | Change |
|---|---|
| `Application/Services/ReportService.cs` | Fix 1 — DB-side GROUP BY for all 4 methods |
| `Application/Services/SearchService.cs` | Fix 2 — ILike + projection + Take(10) |
| `Application/Services/AuthService.cs` | Fix 3 — FirstOrDefaultAsync for all email/id lookups |
| `Application/Services/ContactService.cs` | Fix 4 — vendor query WHERE push + ExecuteUpdateAsync reorder |
| `Infrastructure/Data/AppDbContext.cs` | Fix 5 — Channel<AuditLog> background write |
| `Infrastructure/Services/AuditBackgroundService.cs` | Fix 5 — new background service |
| `Infrastructure/DependencyInjection.cs` | Fix 5 — register Channel + BackgroundService |

---

### Task 1: Fix ReportService — DB-side aggregation

**Files:**
- Modify: `Application/Services/ReportService.cs`

- [ ] Replace all 4 methods with `Query()` chains
- [ ] Commit

---

### Task 2: Fix SearchService — ILike + projection + Take(10)

**Files:**
- Modify: `Application/Services/SearchService.cs`

- [ ] Replace `FindAsync` with `Query().Where(ILike).Select(projection).Take(10).ToListAsync()`
- [ ] Commit

---

### Task 3: Fix AuthService — FirstOrDefaultAsync

**Files:**
- Modify: `Application/Services/AuthService.cs`

- [ ] Replace all `FindAsync` + `.FirstOrDefault()` with `Query().FirstOrDefaultAsync()`
- [ ] Commit

---

### Task 4: Fix ContactService — vendor WHERE push + ExecuteUpdateAsync reorder

**Files:**
- Modify: `Application/Services/ContactService.cs`

- [ ] Fix `GetVendorsAsync` to use `Query().Where()` pushing filter to DB
- [ ] Fix `ReorderColumnsAsync` with `ExecuteUpdateAsync`
- [ ] Commit

---

### Task 5: Fix AppDbContext — background audit Channel

**Files:**
- Modify: `Infrastructure/Data/AppDbContext.cs`
- Create: `Infrastructure/Services/AuditBackgroundService.cs`
- Modify: `Infrastructure/DependencyInjection.cs`

- [ ] Create `AuditBackgroundService` + register Channel singleton
- [ ] Modify `SaveChangesAsync` to write audit entries to channel instead of second save
- [ ] Commit
