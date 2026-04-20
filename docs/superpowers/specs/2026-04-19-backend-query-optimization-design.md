# Backend Query Optimization Design
**Date:** 2026-04-19  
**Status:** Approved

## Problem

The backend is slow due to one dominant anti-pattern repeated across 6 services: `FindAsync(predicate)` and `GetAllAsync()` materialize entire database tables into C# `List<T>` before any filtering, grouping, or aggregation occurs. The database never sees GROUP BY, SUM, ILIKE, or LIMIT — it just dumps rows.

## Approach

**Option A — Fix EF Core query patterns.** No new libraries, no schema migrations. The `IRepository<T>` already exposes `Query()` returning `IQueryable<T>`. Services must use `Query()` chains instead of `FindAsync`/`GetAllAsync` for any query that filters, aggregates, projects, or searches. Simple CRUD (GetByIdAsync, AddAsync, UpdateAsync, DeleteAsync) stays unchanged.

## Architecture

Nothing structural changes. The Repository/UoW pattern, `AppDbContext`, and all entity mappings stay the same. Only service-layer query calls change.

```
Before: Service → FindAsync → List<T> in memory → C# LINQ
After:  Service → Query().Where().Select().ToListAsync() → DB returns final rows
```

## 6 Specific Fixes

### Fix 1 — ReportService (highest impact)
All 4 methods (`GetRevenueByMonthAsync`, `GetExpensesByCategoryAsync`, `GetPipelineConversionAsync`, `GetContactGrowthAsync`) load full tables then aggregate in C#.

- Replace `FindAsync` with `Query().GroupBy().Select(g => new Dto { Amount = g.Sum(...) }).ToListAsync()`
- `GetContactGrowthAsync`: replace second `FindAsync` (ALL contacts) with `Query().CountAsync(c => c.CreatedAt < from)` — a single SQL COUNT
- Result: DB returns ≤12 rows for revenue, ≤10 for categories — regardless of table size

### Fix 2 — SearchService (second highest impact)
Loads all contacts/projects/tasks/expenses for a user into C#, then does `.ToLower().Contains(q)`.

- Replace with `Query().Where(EF.Functions.ILike(c.Name, $"%{q}%")).Select(projection).Take(10).ToListAsync()`
- Add `Select()` projection before `ToListAsync()` so only the 4–5 fields needed for search results are fetched — encrypted fields that aren't selected are never decrypted
- `EF.Functions.ILike` translates to PostgreSQL `ILIKE` (case-insensitive, uses indexes)

### Fix 3 — AuthService email lookup (hot path)
`FindAsync(u => u.Email == x)` appears 11 times across `AuthService` and `AdminController`. Loads a `List<User>` then calls `.FirstOrDefault()` in C#.

- Replace all 11 occurrences with `Query().FirstOrDefaultAsync(u => u.Email == x)`
- DB returns 1 row with LIMIT 1 instead of loading a list

### Fix 4 — ContactService vendor query
`GetVendorsAsync` loads ALL contacts for a user then filters by EntityType/Status in C#.

- Replace with `Query().Where(c => c.UserId == userId && (c.EntityType == "Vendor" || c.Status == "Vendor")).Select(MapToDto).ToListAsync()`

### Fix 5 — ContactService ReorderColumnsAsync (N round trips)
`ReorderColumnsAsync` calls `GetAllAsync()` then issues N individual `UpdateAsync` + `SaveChangesAsync` — one DB round trip per column.

- Replace with per-ColId `ExecuteUpdateAsync` calls — each issues one `UPDATE ... SET order = ? WHERE col_id = ?` without loading entities into memory
- No `SaveChangesAsync` needed — `ExecuteUpdateAsync` bypasses the change tracker

### Fix 6 — AppDbContext audit log double SaveChangesAsync
Every write operation calls `base.SaveChangesAsync()` twice: once for main data (to get generated IDs), once for audit logs. This doubles DB round trips on every mutation.

- Add `AuditChannel`: a `System.Threading.Channels.Channel<IReadOnlyList<AuditLog>>` singleton
- `SaveChangesAsync` override: after first save, write audit entries to the channel and return — main thread is done
- `AuditBackgroundService` (`BackgroundService`): drains the channel, batch-inserts audit logs using `AddRange` + `SaveChangesAsync` on a separate `DbContext` scope
- Audit logs are still written reliably — just not in the same transaction as the main data

## What Does NOT Change
- Repository interface and implementation
- UnitOfWork
- All entity models and migrations
- AppDbContext model configuration
- All CRUD operations (GetByIdAsync, AddAsync, UpdateAsync, DeleteAsync, GetPagedAsync)
- All controllers
- All DTOs

## Expected Performance Gains

| Area | Before | After |
|---|---|---|
| Revenue report (5k income rows) | Load 5k rows → C# SUM | DB returns 12 rows |
| Search (2k contacts) | Load 2k rows → C# filter | DB returns ≤10 rows |
| Login email lookup | Load List\<User\> | DB returns 1 row |
| Reorder 15 columns | 15 DB round trips | 15 targeted UPDATEs (no entity load) |
| Every write (audit) | 2× SaveChangesAsync | 1× (audit is background) |
