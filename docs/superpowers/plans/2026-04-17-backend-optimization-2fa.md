# Backend Optimization + 2FA Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-side pagination, response compression, in-memory caching, AsNoTracking reads, email OTP + TOTP 2FA auth, and React Query + code splitting to the A365 CRM.

**Architecture:** Clean Architecture (.NET 9 backend, React 19 frontend). Backend changes flow Domain → Application → Infrastructure → API. Frontend adds TanStack Query wrapper around existing apiClient, lazy-loads all routes, and gets a shared Pagination component.

**Tech Stack:** .NET 9 / EF Core / PostgreSQL / MailKit / OtpNet / React 19 / TanStack Query v5 / qrcode npm

---

## File Map

### Backend — New Files
- `backend/A365ShiftTracker.Domain/Common/PagedResult.cs`
- `backend/A365ShiftTracker.Application/Interfaces/IEmailService.cs`
- `backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs`

### Backend — Modified Files
- `backend/A365ShiftTracker.Domain/Entities/User.cs` — add 2FA fields
- `backend/A365ShiftTracker.Application/Interfaces/IRepository.cs` — add `GetPagedAsync`
- `backend/A365ShiftTracker.Application/Interfaces/IAuthService.cs` — add 2FA method signatures
- `backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs` — add 2FA DTOs
- `backend/A365ShiftTracker.Application/Services/AuthService.cs` — 2FA logic + permission caching
- `backend/A365ShiftTracker.Application/Services/ContactService.cs` — pagination on `GetAllAsync`
- `backend/A365ShiftTracker.Application/Services/ProjectService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/LeadService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/CompanyService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/ExpenseService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/IncomeService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/TaskService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/TimesheetService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/InvoiceService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/TicketService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/ActivityLogService.cs` — pagination
- `backend/A365ShiftTracker.Application/Services/NotificationService.cs` — pagination
- `backend/A365ShiftTracker.Infrastructure/Repositories/Repository.cs` — `AsNoTracking` + `GetPagedAsync`
- `backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs` — register `IMemoryCache`, `IEmailService`
- `backend/A365ShiftTracker.API/Program.cs` — response compression
- `backend/A365ShiftTracker.API/Controllers/AuthController.cs` — 2FA endpoints
- `backend/A365ShiftTracker.API/Controllers/AdminController.cs` — per-user 2FA toggle
- All list controllers — add `[FromQuery] int page = 1, [FromQuery] int pageSize = 25` params

### Frontend — New Files
- `frontend/src/components/Pagination/Pagination.jsx`
- `frontend/src/services/projectService.js` (missing — must be created)

### Frontend — Modified Files
- `frontend/src/main.jsx` — wrap with `QueryClientProvider`
- `frontend/src/App.jsx` — `React.lazy` all page imports + `Suspense`
- `frontend/src/context/AuthContext.jsx` — handle `requires2FA` response
- `frontend/src/pages/Auth/Login.jsx` — add 2FA step UI
- `frontend/src/services/contactService.js` — add `page`/`pageSize` params
- `frontend/src/services/leadService.js` — pagination params
- `frontend/src/services/projectService.js` — pagination params
- `frontend/src/services/companyService.js` — pagination params
- `frontend/src/services/expenseService.js` — pagination params
- `frontend/src/services/incomeService.js` — pagination params
- `frontend/src/services/timesheetService.js` — pagination params
- `frontend/src/pages/Settings/Settings.jsx` — TOTP setup tab

---

## Task 1: Add PagedResult<T> to Domain

**Files:**
- Create: `backend/A365ShiftTracker.Domain/Common/PagedResult.cs`

- [ ] **Step 1: Create the file**

```csharp
namespace A365ShiftTracker.Domain.Common;

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;
}
```

- [ ] **Step 2: Build to verify**

```bash
cd backend && dotnet build A365ShiftTracker.Domain/A365ShiftTracker.Domain.csproj
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add backend/A365ShiftTracker.Domain/Common/PagedResult.cs
git commit -m "feat: add PagedResult<T> generic pagination wrapper"
```

---

## Task 2: Add GetPagedAsync to IRepository + Repository

**Files:**
- Modify: `backend/A365ShiftTracker.Application/Interfaces/IRepository.cs`
- Modify: `backend/A365ShiftTracker.Infrastructure/Repositories/Repository.cs`

- [ ] **Step 1: Add to IRepository**

Replace the entire contents of `backend/A365ShiftTracker.Application/Interfaces/IRepository.cs`:

```csharp
using System.Linq.Expressions;
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Application.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<PagedResult<T>> GetPagedAsync(Expression<Func<T, bool>> predicate, int page, int pageSize, Func<IQueryable<T>, IQueryable<T>>? orderBy = null);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
    IQueryable<T> Query();
}
```

- [ ] **Step 2: Implement in Repository**

Replace the entire contents of `backend/A365ShiftTracker.Infrastructure/Repositories/Repository.cs`:

```csharp
using System.Linq.Expressions;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id)
        => await _dbSet.FindAsync(id);

    public async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.AsNoTracking().ToListAsync();

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.AsNoTracking().Where(predicate).ToListAsync();

    public async Task<PagedResult<T>> GetPagedAsync(
        Expression<Func<T, bool>> predicate,
        int page,
        int pageSize,
        Func<IQueryable<T>, IQueryable<T>>? orderBy = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _dbSet.AsNoTracking().Where(predicate);
        if (orderBy != null) query = orderBy(query);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
        => predicate is null
            ? await _dbSet.CountAsync()
            : await _dbSet.CountAsync(predicate);

    public IQueryable<T> Query() => _dbSet;
}
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add backend/A365ShiftTracker.Application/Interfaces/IRepository.cs
git add backend/A365ShiftTracker.Infrastructure/Repositories/Repository.cs
git commit -m "feat: add GetPagedAsync with AsNoTracking to repository"
```

---

## Task 3: Add Response Compression + IMemoryCache to API

**Files:**
- Modify: `backend/A365ShiftTracker.API/Program.cs`
- Modify: `backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Add compression packages**

```bash
cd backend/A365ShiftTracker.API
dotnet add package Microsoft.AspNetCore.ResponseCompression
```

- [ ] **Step 2: Update Program.cs**

In `backend/A365ShiftTracker.API/Program.cs`, add these lines immediately after `var builder = WebApplication.CreateBuilder(args);`:

```csharp
// ─── Response Compression ─────────────────────────────────
builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    opts.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(opts =>
    opts.Level = System.IO.Compression.CompressionLevel.Fastest);
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(opts =>
    opts.Level = System.IO.Compression.CompressionLevel.Fastest);
```

Then in the middleware pipeline section, add `app.UseResponseCompression();` as the **very first** middleware line (before `app.UseMiddleware<ExceptionMiddleware>()`):

```csharp
app.UseResponseCompression(); // must be first
app.UseMiddleware<ExceptionMiddleware>();
```

- [ ] **Step 3: Register IMemoryCache in DependencyInjection.cs**

In `backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs`, add this line after `services.AddHttpContextAccessor();`:

```csharp
services.AddMemoryCache();
```

- [ ] **Step 4: Build and verify**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 5: Commit**

```bash
git add backend/A365ShiftTracker.API/Program.cs
git add backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs
git commit -m "perf: add Brotli/GZip response compression and IMemoryCache"
```

---

## Task 4: Paginate Contacts

**Files:**
- Modify: `backend/A365ShiftTracker.Application/Services/ContactService.cs`
- Modify: `backend/A365ShiftTracker.API/Controllers/ContactsController.cs`

- [ ] **Step 1: Update ContactService.GetAllAsync**

In `backend/A365ShiftTracker.Application/Services/ContactService.cs`, replace the `GetAllAsync` method:

```csharp
public async Task<PagedResult<ContactDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Contacts.GetPagedAsync(
        c => c.UserId == userId,
        page,
        pageSize,
        q => q.OrderByDescending(c => c.Id));
    return new PagedResult<ContactDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount,
        Page = paged.Page,
        PageSize = paged.PageSize
    };
}
```

Add the `using A365ShiftTracker.Domain.Common;` using at the top if not present.

Also update `IContactService` interface in `backend/A365ShiftTracker.Application/Interfaces/IContactService.cs` — change the `GetAllAsync` signature to:
```csharp
Task<PagedResult<ContactDto>> GetAllAsync(int userId, int page, int pageSize);
```

- [ ] **Step 2: Update ContactsController.GetAll**

In `backend/A365ShiftTracker.API/Controllers/ContactsController.cs`, replace the `GetAll` action:

```csharp
[HttpGet]
public async Task<ActionResult<ApiResponse<PagedResult<ContactDto>>>> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 25)
{
    var userId = GetCurrentUserId();
    var result = await _service.GetAllAsync(userId, page, pageSize);
    return Ok(ApiResponse<PagedResult<ContactDto>>.Ok(result));
}
```

Add `using A365ShiftTracker.Domain.Common;` at the top.

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 4: Verify manually**

```bash
cd backend && dotnet run --project A365ShiftTracker.API
# In another terminal (replace TOKEN with a valid auth cookie or use Swagger):
curl -s "http://localhost:5231/api/contacts?page=1&pageSize=5" \
  -H "Cookie: auth_token=YOUR_TOKEN" | python -m json.tool
```
Expected: JSON with `items`, `totalCount`, `page`, `pageSize`, `totalPages` fields.

- [ ] **Step 5: Commit**

```bash
git add backend/A365ShiftTracker.Application/Services/ContactService.cs
git add backend/A365ShiftTracker.Application/Interfaces/IContactService.cs
git add backend/A365ShiftTracker.API/Controllers/ContactsController.cs
git commit -m "perf: paginate contacts endpoint"
```

---

## Task 5: Paginate Projects, Leads, Companies

**Files:**
- Modify: `backend/A365ShiftTracker.Application/Services/ProjectService.cs`
- Modify: `backend/A365ShiftTracker.Application/Services/LeadService.cs`
- Modify: `backend/A365ShiftTracker.Application/Services/CompanyService.cs`
- Modify: corresponding interfaces and controllers

- [ ] **Step 1: ProjectService — update GetAllAsync**

In `backend/A365ShiftTracker.Application/Services/ProjectService.cs`, replace `GetAllAsync`:

```csharp
public async Task<PagedResult<ProjectDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Projects.GetPagedAsync(
        p => p.UserId == userId,
        page,
        pageSize,
        q => q.OrderByDescending(p => p.Id));
    return new PagedResult<ProjectDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount,
        Page = paged.Page,
        PageSize = paged.PageSize
    };
}
```

Update `IProjectService` signature: `Task<PagedResult<ProjectDto>> GetAllAsync(int userId, int page, int pageSize);`

- [ ] **Step 2: ProjectsController — update GetAll**

In `backend/A365ShiftTracker.API/Controllers/ProjectsController.cs`, replace `GetAll`:

```csharp
[HttpGet]
public async Task<ActionResult<ApiResponse<PagedResult<ProjectDto>>>> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 25)
{
    var userId = GetCurrentUserId();
    var result = await _service.GetAllAsync(userId, page, pageSize);
    return Ok(ApiResponse<PagedResult<ProjectDto>>.Ok(result));
}
```

- [ ] **Step 3: LeadService — update GetAllAsync**

In `backend/A365ShiftTracker.Application/Services/LeadService.cs`, replace `GetAllAsync`:

```csharp
public async Task<PagedResult<LeadDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Leads.GetPagedAsync(
        l => l.UserId == userId,
        page,
        pageSize,
        q => q.OrderByDescending(l => l.CreatedAt));
    return new PagedResult<LeadDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount,
        Page = paged.Page,
        PageSize = paged.PageSize
    };
}
```

Update `ILeadService`: `Task<PagedResult<LeadDto>> GetAllAsync(int userId, int page, int pageSize);`

- [ ] **Step 4: LeadsController — update GetAll**

```csharp
[HttpGet]
public async Task<ActionResult<ApiResponse<PagedResult<LeadDto>>>> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 25)
{
    var userId = GetCurrentUserId();
    var result = await _service.GetAllAsync(userId, page, pageSize);
    return Ok(ApiResponse<PagedResult<LeadDto>>.Ok(result));
}
```

- [ ] **Step 5: CompanyService — update GetAllAsync**

In `backend/A365ShiftTracker.Application/Services/CompanyService.cs`, find and replace `GetAllAsync`. First read the file to see the current implementation, then replace with:

```csharp
public async Task<PagedResult<CompanyDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Companies.GetPagedAsync(
        c => c.UserId == userId,
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
```

Update `ICompanyService` and `CompaniesController` with the same pattern (page/pageSize params, `PagedResult<CompanyDto>` return type).

- [ ] **Step 6: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 7: Commit**

```bash
git add -A backend/A365ShiftTracker.Application/Services/ProjectService.cs
git add -A backend/A365ShiftTracker.Application/Services/LeadService.cs
git add -A backend/A365ShiftTracker.Application/Services/CompanyService.cs
git add -A backend/A365ShiftTracker.Application/Interfaces/
git add -A backend/A365ShiftTracker.API/Controllers/ProjectsController.cs
git add -A backend/A365ShiftTracker.API/Controllers/LeadsController.cs
git add -A backend/A365ShiftTracker.API/Controllers/CompaniesController.cs
git commit -m "perf: paginate projects, leads, companies endpoints"
```

---

## Task 6: Paginate Finance, Tasks, Timesheet, Invoices, Tickets

Apply the same pagination pattern to remaining list services. For each service below, replace `GetAllAsync(int userId)` with `GetAllAsync(int userId, int page, int pageSize)` returning `PagedResult<TDto>`, using `GetPagedAsync` in the repository. Update the matching interface and controller with `[FromQuery] int page = 1, [FromQuery] int pageSize = 25`.

- [ ] **Step 1: ExpenseService**

```csharp
// In ExpenseService.GetAllAsync:
public async Task<PagedResult<ExpenseDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Expenses.GetPagedAsync(
        e => e.UserId == userId,
        page, pageSize,
        q => q.OrderByDescending(e => e.Date));
    return new PagedResult<ExpenseDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
    };
}
```

Update `IExpenseService` and `ExpensesController.GetAll`.

- [ ] **Step 2: IncomeService**

```csharp
public async Task<PagedResult<IncomeDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Incomes.GetPagedAsync(
        i => i.UserId == userId,
        page, pageSize,
        q => q.OrderByDescending(i => i.Date));
    return new PagedResult<IncomeDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
    };
}
```

Update `IIncomeService` and `IncomesController.GetAll`.

- [ ] **Step 3: TaskService**

```csharp
public async Task<PagedResult<TaskItemDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Tasks.GetPagedAsync(
        t => t.UserId == userId,
        page, pageSize,
        q => q.OrderByDescending(t => t.CreatedAt));
    return new PagedResult<TaskItemDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
    };
}
```

Update `ITaskService` and `TasksController.GetAll`.

- [ ] **Step 4: TimesheetService**

```csharp
public async Task<PagedResult<TimesheetEntryDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.TimesheetEntries.GetPagedAsync(
        t => t.UserId == userId,
        page, pageSize,
        q => q.OrderByDescending(t => t.StartDatetime));
    return new PagedResult<TimesheetEntryDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
    };
}
```

Update `ITimesheetService` and `TimesheetController.GetAll`.

- [ ] **Step 5: InvoiceService**

```csharp
public async Task<PagedResult<InvoiceDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Invoices.GetPagedAsync(
        i => i.UserId == userId,
        page, pageSize,
        q => q.OrderByDescending(i => i.CreatedAt));
    return new PagedResult<InvoiceDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
    };
}
```

Update `IInvoiceService` and `InvoicesController.GetAll`.

- [ ] **Step 6: TicketService**

```csharp
public async Task<PagedResult<TicketDto>> GetAllAsync(int userId, int page, int pageSize)
{
    var paged = await _uow.Tickets.GetPagedAsync(
        t => t.UserId == userId,
        page, pageSize,
        q => q.OrderByDescending(t => t.CreatedAt));
    return new PagedResult<TicketDto>
    {
        Items = paged.Items.Select(MapToDto),
        TotalCount = paged.TotalCount, Page = paged.Page, PageSize = paged.PageSize
    };
}
```

Update `ITicketService` and `TicketsController.GetAll`.

- [ ] **Step 7: ActivityLogService + NotificationService**

Follow the same pattern for:
- `ActivityLogService.GetAllAsync` → order by `CreatedAt` desc
- `NotificationService.GetAllAsync` → order by `CreatedAt` desc

Update their interfaces and controllers.

- [ ] **Step 8: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 9: Commit**

```bash
git add -A backend/
git commit -m "perf: paginate expenses, incomes, tasks, timesheet, invoices, tickets, logs"
```

---

## Task 7: Add 2FA Fields to User Entity + Migration

**Files:**
- Modify: `backend/A365ShiftTracker.Domain/Entities/User.cs`
- Run: EF Core migration

- [ ] **Step 1: Update User entity**

Replace the entire contents of `backend/A365ShiftTracker.Domain/Entities/User.cs`:

```csharp
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }

    // Email OTP 2FA
    public string? OtpCode { get; set; }          // BCrypt-hashed 6-digit code
    public DateTime? OtpExpiry { get; set; }

    // TOTP Authenticator App
    public string? TotpSecret { get; set; }        // Base32 secret (stored encrypted via EF converter)
    public bool IsTotpEnabled { get; set; } = false;

    // Admin 2FA control
    public bool TwoFactorRequired { get; set; } = false;
    public string TwoFactorMethod { get; set; } = "email"; // "email" | "totp"

    // Navigation
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
```

- [ ] **Step 2: Add encryption for TotpSecret in AppDbContext**

In `backend/A365ShiftTracker.Infrastructure/Data/AppDbContext.cs`, inside `OnModelCreating`, in the Users section add:

```csharp
modelBuilder.Entity<User>(e =>
{
    e.ToTable("users");
    e.HasIndex(u => u.Email).IsUnique();
    e.HasMany(u => u.UserRoles).WithOne(ur => ur.User)
        .HasForeignKey(ur => ur.UserId).OnDelete(DeleteBehavior.Cascade);
    e.Property(u => u.TotpSecret).HasConversion(strConv); // encrypt TOTP secret at rest
});
```

Replace the existing `modelBuilder.Entity<User>` block entirely with the above.

- [ ] **Step 3: Add migration**

```bash
cd backend
dotnet ef migrations add AddTwoFactorAuthFields --project A365ShiftTracker.Infrastructure --startup-project A365ShiftTracker.API
```
Expected: Migration file created in `Migrations/`.

- [ ] **Step 4: Apply migration**

```bash
dotnet ef database update --project A365ShiftTracker.Infrastructure --startup-project A365ShiftTracker.API
```
Expected: `Done.`

- [ ] **Step 5: Commit**

```bash
git add -A backend/A365ShiftTracker.Domain/Entities/User.cs
git add -A backend/A365ShiftTracker.Infrastructure/
git commit -m "feat: add 2FA fields to User entity and apply migration"
```

---

## Task 8: Add IEmailService + SmtpEmailService

**Files:**
- Create: `backend/A365ShiftTracker.Application/Interfaces/IEmailService.cs`
- Create: `backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs`
- Modify: `backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Install MailKit**

```bash
cd backend/A365ShiftTracker.Infrastructure
dotnet add package MailKit
```

- [ ] **Step 2: Create IEmailService**

Create `backend/A365ShiftTracker.Application/Interfaces/IEmailService.cs`:

```csharp
namespace A365ShiftTracker.Application.Interfaces;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string displayName, string code);
}
```

- [ ] **Step 3: Create SmtpEmailService**

Create `backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs`:

```csharp
using A365ShiftTracker.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace A365ShiftTracker.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;

    public SmtpEmailService(IConfiguration config) => _config = config;

    public async Task SendOtpEmailAsync(string toEmail, string displayName, string code)
    {
        var smtpHost = _config["Smtp:Host"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
        var username  = _config["Smtp:Username"] ?? string.Empty;
        var password  = _config["Smtp:Password"] ?? string.Empty;
        var fromName  = _config["Smtp:FromName"] ?? "A365 CRM";
        var fromEmail = _config["Smtp:FromEmail"] ?? username;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress(displayName, toEmail));
        message.Subject = "Your A365 CRM Login Code";

        message.Body = new TextPart("html")
        {
            Text = $"""
                <div style="font-family:DM Sans,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
                  <h2 style="color:#1e293b;margin-bottom:8px;">Your login code</h2>
                  <p style="color:#64748b;margin-bottom:24px;">Use this code to complete your A365 CRM sign-in. It expires in <strong>5 minutes</strong>.</p>
                  <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#4361EE;text-align:center;padding:20px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:24px;">{code}</div>
                  <p style="color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
                """
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
```

- [ ] **Step 4: Register in DependencyInjection.cs**

In `backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs`, add after the existing service registrations:

```csharp
services.AddScoped<IEmailService, SmtpEmailService>();
```

- [ ] **Step 5: Add SMTP config to appsettings.json**

In `backend/A365ShiftTracker.API/appsettings.json` (the source file, not the bin copy), add:

```json
"Smtp": {
  "Host": "smtp.gmail.com",
  "Port": "587",
  "Username": "your@gmail.com",
  "Password": "your-app-password",
  "FromName": "A365 CRM",
  "FromEmail": "your@gmail.com"
}
```

- [ ] **Step 6: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 7: Commit**

```bash
git add -A backend/A365ShiftTracker.Application/Interfaces/IEmailService.cs
git add -A backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs
git add -A backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs
git add backend/A365ShiftTracker.API/appsettings.json
git commit -m "feat: add IEmailService + MailKit SmtpEmailService for OTP emails"
```

---

## Task 9: Add 2FA DTOs + Update IAuthService

**Files:**
- Modify: `backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs`
- Modify: `backend/A365ShiftTracker.Application/Interfaces/IAuthService.cs`

- [ ] **Step 1: Add 2FA DTOs**

Append to end of `backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs`:

```csharp
// ─── Responses ─────────────────────────────────────────────

public class LoginResponse
{
    // Returned when 2FA is NOT required — full auth granted
    public int? Id { get; set; }
    public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? Role { get; set; }
    public List<string> Permissions { get; set; } = new();

    // Returned when 2FA IS required — partial auth
    public bool Requires2FA { get; set; } = false;
    public string TwoFactorMethod { get; set; } = "email"; // "email" | "totp"
    public string PartialToken { get; set; } = string.Empty; // short-lived JWT, returned in body only
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

// ─── 2FA Requests ───────────────────────────────────────────

public class VerifyOtpRequest
{
    public string Code { get; set; } = string.Empty;
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpRequest
{
    public string Code { get; set; } = string.Empty;
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpSetupRequest
{
    public string Code { get; set; } = string.Empty;
}

public class TotpSetupResponse
{
    public string QrCodeUri { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
}

public class Require2FARequest
{
    public bool Required { get; set; }
    public string Method { get; set; } = "email"; // "email" | "totp"
}
```

- [ ] **Step 2: Update IAuthService**

Replace the entire contents of `backend/A365ShiftTracker.Application/Interfaces/IAuthService.cs`:

```csharp
using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    string GenerateJwtToken(int userId, string email);
    Task<string> RequestPasswordResetAsync(string email);
    Task ResetPasswordAsync(string token, string newPassword);

    // Email OTP
    Task SendOtpAsync(string partialToken);
    Task<LoginResponse> VerifyOtpAsync(VerifyOtpRequest request);

    // TOTP
    Task<LoginResponse> VerifyTotpAsync(VerifyTotpRequest request);
    Task<TotpSetupResponse> GetTotpSetupAsync(int userId);
    Task VerifyAndEnableTotpAsync(int userId, VerifyTotpSetupRequest request);
    Task DisableTotpAsync(int userId);
}
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build
```
Expected: Build errors on AuthService (not yet updated) — that's expected. Fix in next task.

- [ ] **Step 4: Commit DTOs only**

```bash
git add backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs
git add backend/A365ShiftTracker.Application/Interfaces/IAuthService.cs
git commit -m "feat: add 2FA DTOs and extend IAuthService interface"
```

---

## Task 10: Implement AuthService with 2FA + Permission Caching

**Files:**
- Modify: `backend/A365ShiftTracker.Application/Services/AuthService.cs`
- Modify: `backend/A365ShiftTracker.Infrastructure/DependencyInjection.cs` (move AuthService to Infrastructure for IMemoryCache access, or inject IMemoryCache via Application layer)

**Note:** `IMemoryCache` is in `Microsoft.Extensions.Caching.Memory` which is available in Application layer via the SDK. Just add the using.

- [ ] **Step 1: Install OtpNet**

```bash
cd backend/A365ShiftTracker.Application
dotnet add package OtpNet
```

- [ ] **Step 2: Replace AuthService entirely**

Replace the entire contents of `backend/A365ShiftTracker.Application/Services/AuthService.cs`:

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OtpNet;

namespace A365ShiftTracker.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly IMemoryCache _cache;

    public AuthService(IUnitOfWork uow, IConfiguration config, IEmailService emailService, IMemoryCache cache)
    {
        _uow = uow;
        _config = config;
        _emailService = emailService;
        _cache = cache;
    }

    // ── Register ────────────────────────────────────────────

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existing = await _uow.Users.FindAsync(u => u.Email == request.Email);
        if (existing.Any())
            throw new InvalidOperationException("Email already registered.");

        var user = new Domain.Entities.User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName
        };

        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();

        var defaultRole = (await _uow.Roles.FindAsync(r => r.Name == "User")).FirstOrDefault();
        if (defaultRole != null)
        {
            await _uow.UserRoles.AddAsync(new Domain.Entities.UserRole
            {
                UserId = user.Id,
                RoleId = defaultRole.Id
            });
            await _uow.SaveChangesAsync();
        }

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new AuthResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions
        };
    }

    // ── Login ───────────────────────────────────────────────

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var users = await _uow.Users.FindAsync(u => u.Email == request.Email);
        var user = users.FirstOrDefault()
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated. Contact your administrator.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        user.LastLoginAt = DateTime.UtcNow;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        // 2FA required — issue partial token
        if (user.TwoFactorRequired)
        {
            var partialToken = GeneratePartialToken(user.Id, user.Email, user.TwoFactorMethod);
            return new LoginResponse
            {
                Requires2FA = true,
                TwoFactorMethod = user.TwoFactorMethod,
                PartialToken = partialToken
            };
        }

        // No 2FA — issue full token
        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions,
            Requires2FA = false
        };
    }

    // ── Email OTP ────────────────────────────────────────────

    public async Task SendOtpAsync(string partialToken)
    {
        var (userId, _) = ValidatePartialToken(partialToken);
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        var code = new Random().Next(100000, 999999).ToString();
        user.OtpCode = BCrypt.Net.BCrypt.HashPassword(code);
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(5);
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        await _emailService.SendOtpEmailAsync(user.Email, user.DisplayName ?? user.Email, code);
    }

    public async Task<LoginResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var (userId, attempts) = ValidatePartialToken(request.PartialToken);
        if (attempts >= 5)
            throw new UnauthorizedAccessException("Too many attempts. Please log in again.");

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (user.OtpCode is null || user.OtpExpiry is null || user.OtpExpiry < DateTime.UtcNow)
            throw new UnauthorizedAccessException("OTP expired. Request a new code.");

        if (!BCrypt.Net.BCrypt.Verify(request.Code, user.OtpCode))
            throw new UnauthorizedAccessException("Invalid code.");

        // Clear OTP
        user.OtpCode = null;
        user.OtpExpiry = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions
        };
    }

    // ── TOTP ─────────────────────────────────────────────────

    public async Task<LoginResponse> VerifyTotpAsync(VerifyTotpRequest request)
    {
        var (userId, attempts) = ValidatePartialToken(request.PartialToken);
        if (attempts >= 5)
            throw new UnauthorizedAccessException("Too many attempts. Please log in again.");

        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found.");

        if (!user.IsTotpEnabled || user.TotpSecret is null)
            throw new UnauthorizedAccessException("TOTP not configured.");

        var secretBytes = Base32Encoding.ToBytes(user.TotpSecret);
        var totp = new Totp(secretBytes);
        if (!totp.VerifyTotp(request.Code, out _, VerificationWindow.RfcSpecifiedNetworkDelay))
            throw new UnauthorizedAccessException("Invalid authenticator code.");

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new LoginResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions),
            Role = roleName, Permissions = permissions
        };
    }

    public async Task<TotpSetupResponse> GetTotpSetupAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(secretBytes);

        // Store tentatively — only committed on verify-setup
        user.TotpSecret = secret;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();

        var issuer = Uri.EscapeDataString("A365 CRM");
        var account = Uri.EscapeDataString(user.Email);
        var qrUri = $"otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30";

        return new TotpSetupResponse { QrCodeUri = qrUri, Secret = secret };
    }

    public async Task VerifyAndEnableTotpAsync(int userId, VerifyTotpSetupRequest request)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.TotpSecret is null)
            throw new InvalidOperationException("No TOTP secret found. Call setup first.");

        var secretBytes = Base32Encoding.ToBytes(user.TotpSecret);
        var totp = new Totp(secretBytes);
        if (!totp.VerifyTotp(request.Code, out _, VerificationWindow.RfcSpecifiedNetworkDelay))
            throw new UnauthorizedAccessException("Invalid code. TOTP not enabled.");

        user.IsTotpEnabled = true;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    public async Task DisableTotpAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsTotpEnabled = false;
        user.TotpSecret = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Password Reset ───────────────────────────────────────

    public async Task<string> RequestPasswordResetAsync(string email)
    {
        var users = await _uow.Users.FindAsync(u => u.Email == email);
        var user = users.FirstOrDefault()
            ?? throw new KeyNotFoundException("No account found with that email.");

        var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.ResetToken = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
        return token;
    }

    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var users = await _uow.Users.FindAsync(u =>
            u.ResetToken == token && u.ResetTokenExpiry > DateTime.UtcNow);
        var user = users.FirstOrDefault()
            ?? throw new InvalidOperationException("Invalid or expired reset token.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;
        await _uow.Users.UpdateAsync(user);
        await _uow.SaveChangesAsync();
    }

    // ── Token Helpers ────────────────────────────────────────

    public string GenerateJwtToken(int userId, string email)
        => GenerateJwtToken(userId, email, "User", new List<string>());

    public string GenerateJwtToken(int userId, string email, string role, List<string> permissions)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, role)
        };
        foreach (var perm in permissions)
            claims.Add(new Claim("permission", perm));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GeneratePartialToken(int userId, string email, string method)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new("2fa_pending", "true"),
            new("2fa_method", method),
            new("2fa_attempts", "0")
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private (int userId, int attempts) ValidatePartialToken(string partialToken)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(partialToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidAudience = _config["Jwt:Audience"],
                IssuerSigningKey = key
            }, out _);

            var pending = principal.FindFirst("2fa_pending")?.Value;
            if (pending != "true")
                throw new UnauthorizedAccessException("Invalid partial token.");

            var userId = int.Parse(principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "0");
            var attempts = int.Parse(principal.FindFirst("2fa_attempts")?.Value ?? "0");
            return (userId, attempts);
        }
        catch (SecurityTokenException)
        {
            throw new UnauthorizedAccessException("Partial token expired or invalid. Please log in again.");
        }
    }

    // ── Permission Caching ───────────────────────────────────

    private async Task<(string roleName, List<string> permissions)> GetUserRoleAndPermissionsAsync(int userId)
    {
        var cacheKey = $"permissions:{userId}";
        if (_cache.TryGetValue(cacheKey, out (string role, List<string> perms) cached))
            return cached;

        var userRoles = await _uow.UserRoles.Query()
            .Where(ur => ur.UserId == userId)
            .Include(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .ToListAsync();

        if (!userRoles.Any())
            return ("User", new List<string>());

        var roleOrder = new[] { "Admin", "Manager", "User" };
        var primaryRole = userRoles
            .OrderBy(ur => Array.IndexOf(roleOrder, ur.Role.Name) is var idx && idx < 0 ? 999 : idx)
            .First().Role;

        var permissions = userRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();

        var result = (primaryRole.Name, permissions);
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));
        return result;
    }
}
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add -A backend/A365ShiftTracker.Application/Services/AuthService.cs
git commit -m "feat: implement 2FA login flow, OTP, TOTP, permission caching in AuthService"
```

---

## Task 11: Update AuthController with 2FA Endpoints

**Files:**
- Modify: `backend/A365ShiftTracker.API/Controllers/AuthController.cs`

- [ ] **Step 1: Replace AuthController entirely**

```csharp
using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _env;

    public AuthController(IAuthService authService, IWebHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        SetAuthCookie(result.Token);
        result.Token = string.Empty;
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Registration successful."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (result.Requires2FA)
        {
            // Return partial token in body — no auth cookie set yet
            return Ok(ApiResponse<LoginResponse>.Ok(result, "2FA required."));
        }

        SetAuthCookie(result.Token);
        result.Token = string.Empty;
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
    }

    [HttpPost("send-otp")]
    public async Task<ActionResult<ApiResponse<bool>>> SendOtp([FromBody] SendOtpRequest request)
    {
        await _authService.SendOtpAsync(request.PartialToken);
        return Ok(ApiResponse<bool>.Ok(true, "OTP sent to your email."));
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> VerifyOtp(VerifyOtpRequest request)
    {
        var result = await _authService.VerifyOtpAsync(request);
        SetAuthCookie(result.Token);
        result.Token = string.Empty;
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
    }

    [HttpPost("verify-totp")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> VerifyTotp(VerifyTotpRequest request)
    {
        var result = await _authService.VerifyTotpAsync(request);
        SetAuthCookie(result.Token);
        result.Token = string.Empty;
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
    }

    [HttpGet("totp/setup")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<TotpSetupResponse>>> TotpSetup()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub")
            ?? throw new UnauthorizedAccessException("Not authenticated."), 
            System.Globalization.CultureInfo.InvariantCulture);
        // Simpler: use BaseApiController — but AuthController doesn't extend it.
        // Parse sub claim directly:
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Not authenticated.");
        var uid = int.Parse(sub);
        var result = await _authService.GetTotpSetupAsync(uid);
        return Ok(ApiResponse<TotpSetupResponse>.Ok(result));
    }

    [HttpPost("totp/verify-setup")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> TotpVerifySetup(VerifyTotpSetupRequest request)
    {
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Not authenticated.");
        var userId = int.Parse(sub);
        await _authService.VerifyAndEnableTotpAsync(userId, request);
        return Ok(ApiResponse<bool>.Ok(true, "Authenticator app enabled."));
    }

    [HttpPost("totp/disable")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> TotpDisable()
    {
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Not authenticated.");
        var userId = int.Parse(sub);
        await _authService.DisableTotpAsync(userId);
        return Ok(ApiResponse<bool>.Ok(true, "Authenticator app disabled."));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/", SameSite = SameSiteMode.None, Secure = true });
        Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/" });
        return Ok(ApiResponse<bool>.Ok(true, "Logged out successfully."));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<string>>> ForgotPassword(ForgotPasswordRequest request)
    {
        var token = await _authService.RequestPasswordResetAsync(request.Email);
        return Ok(ApiResponse<string>.Ok(token, "Password reset token generated."));
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPassword(ResetPasswordRequest request)
    {
        await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
        return Ok(ApiResponse<bool>.Ok(true, "Password reset successful."));
    }

    private void SetAuthCookie(string token)
    {
        var isProduction = !_env.IsDevelopment();
        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction ? SameSiteMode.Strict : SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddHours(8),
            Path = "/"
        });
    }
}
```

Also add `SendOtpRequest` DTO to `AuthDtos.cs`:

```csharp
public class SendOtpRequest
{
    public string PartialToken { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add -A backend/A365ShiftTracker.API/Controllers/AuthController.cs
git add backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs
git commit -m "feat: add 2FA endpoints to AuthController (send-otp, verify-otp, verify-totp, TOTP setup)"
```

---

## Task 12: Admin 2FA Management Endpoint

**Files:**
- Modify: `backend/A365ShiftTracker.API/Controllers/AdminController.cs`

- [ ] **Step 1: Read current AdminController**

Open `backend/A365ShiftTracker.API/Controllers/AdminController.cs` and find the existing action list. Add these two actions inside the class:

```csharp
[HttpPost("users/{id}/2fa")]
public async Task<ActionResult<ApiResponse<bool>>> SetUserTwoFactor(int id, Require2FARequest request)
{
    // Get user via admin service or directly via UoW — depends on existing AdminService
    // If AdminService has a GetUserAsync(id), use that. Otherwise inject IUnitOfWork.
    // Pattern: find the user and update TwoFactorRequired + TwoFactorMethod
    var users = await _uow.Users.FindAsync(u => u.Id == id);
    var user = users.FirstOrDefault()
        ?? throw new KeyNotFoundException($"User {id} not found.");

    user.TwoFactorRequired = request.Required;
    user.TwoFactorMethod = request.Method;
    await _uow.Users.UpdateAsync(user);
    await _uow.SaveChangesAsync();

    // Invalidate permission cache for this user
    _cache.Remove($"permissions:{id}");

    return Ok(ApiResponse<bool>.Ok(true,
        request.Required ? $"2FA ({request.Method}) required for user {id}." : $"2FA disabled for user {id}."));
}

[HttpDelete("users/{id}/2fa")]
public async Task<ActionResult<ApiResponse<bool>>> RemoveUserTwoFactor(int id)
{
    var users = await _uow.Users.FindAsync(u => u.Id == id);
    var user = users.FirstOrDefault()
        ?? throw new KeyNotFoundException($"User {id} not found.");

    user.TwoFactorRequired = false;
    await _uow.Users.UpdateAsync(user);
    await _uow.SaveChangesAsync();
    _cache.Remove($"permissions:{id}");

    return Ok(ApiResponse<bool>.Ok(true, $"2FA disabled for user {id}."));
}
```

Inject `IUnitOfWork _uow` and `IMemoryCache _cache` into the AdminController constructor alongside any existing services.

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded.`

- [ ] **Step 3: Run and smoke test**

```bash
cd backend && dotnet run --project A365ShiftTracker.API
```
Open `http://localhost:5231/swagger` in browser. Verify new 2FA endpoints appear under Auth and Admin sections.

- [ ] **Step 4: Commit**

```bash
git add -A backend/A365ShiftTracker.API/Controllers/AdminController.cs
git commit -m "feat: add admin endpoints to toggle per-user 2FA requirement"
```

---

## Task 13: Frontend — Install React Query + Wrap App

**Files:**
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Install packages**

```bash
cd frontend
npm install @tanstack/react-query qrcode
```

- [ ] **Step 2: Update main.jsx**

Replace the entire contents of `frontend/src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 minutes default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 3: Add lazy loading to App.jsx**

Replace all eager page imports at the top of `frontend/src/App.jsx` with lazy imports. Replace the block from `import Dashboard` through `import Tickets` with:

```jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import './index.css';

const Dashboard       = lazy(() => import('./pages/Dashboard/Dashboard'));
const Sales           = lazy(() => import('./pages/Sales/Sales'));
const Contact         = lazy(() => import('./pages/Contact/Contacts/Contacts'));
const Timesheet       = lazy(() => import('./pages/Timesheet/Timesheet'));
const Finance         = lazy(() => import('./pages/Finance/Finance'));
const TodoList        = lazy(() => import('./pages/TodoList/TodoList'));
const Invoice         = lazy(() => import('./pages/Invoice/Invoice'));
const AIFollowup      = lazy(() => import('./pages/AIFollowup/AIFollowup'));
const Vendor          = lazy(() => import('./pages/Vendor/Vendor'));
const AIAgentsLayout  = lazy(() => import('./pages/AIAgents/AIAgentsLayout'));
const Admin           = lazy(() => import('./pages/Admin/Admin'));
const Settings        = lazy(() => import('./pages/Settings/Settings'));
const Projects        = lazy(() => import('./pages/Projects/Projects'));
const Documents       = lazy(() => import('./pages/Documents/Documents'));
const Company         = lazy(() => import('./pages/Company/Company'));
const Leads           = lazy(() => import('./pages/Leads/Leads'));
const Calendar        = lazy(() => import('./pages/Calendar/Calendar'));
const Reports         = lazy(() => import('./pages/Reports/Reports'));
const Legal           = lazy(() => import('./pages/Legal/Legal'));
const Tickets         = lazy(() => import('./pages/Tickets/Tickets'));
```

Then wrap the `<Routes>` block inside `<Suspense>`:

```jsx
<Suspense fallback={
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#4361EE', fontSize:14 }}>
    Loading…
  </div>
}>
  <Routes>
    {/* ... all existing routes unchanged ... */}
  </Routes>
</Suspense>
```

- [ ] **Step 4: Verify dev server starts**

```bash
cd frontend && npm run dev
```
Expected: Server starts, navigate to `http://localhost:5173`, app loads normally.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/main.jsx frontend/src/App.jsx
git commit -m "perf: add TanStack Query provider and lazy-load all page routes"
```

---

## Task 14: Create Pagination Component

**Files:**
- Create: `frontend/src/components/Pagination/Pagination.jsx`

- [ ] **Step 1: Create the component**

```jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }) {
  if (totalPages <= 1 && page === 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3 mt-2">
      <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg px-2 py-1 text-sm border"
          style={{
            background: 'var(--card-bg, #fff)',
            borderColor: 'var(--border-color, #e2e8f0)',
            color: 'var(--text-primary, #1e293b)',
          }}
        >
          {[25, 50, 100].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm mr-2" style={{ color: '#64748B' }}>
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            color: page <= 1 ? '#94a3b8' : '#4361EE',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            color: page >= totalPages ? '#94a3b8' : '#4361EE',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Pagination/Pagination.jsx
git commit -m "feat: add shared Pagination component"
```

---

## Task 15: Update Frontend Services for Pagination

**Files:**
- Modify: `frontend/src/services/contactService.js`
- Modify: `frontend/src/services/leadService.js`
- Create: `frontend/src/services/projectService.js`
- Modify: `frontend/src/services/companyService.js`
- Modify: `frontend/src/services/expenseService.js`
- Modify: `frontend/src/services/incomeService.js`
- Modify: `frontend/src/services/timesheetService.js`

- [ ] **Step 1: Update contactService.js**

Change `getContacts` to accept pagination params:

```js
getContacts: async (page = 1, pageSize = 25) => {
    return await apiClient.get(`/contacts?page=${page}&pageSize=${pageSize}`);
},
```

- [ ] **Step 2: Update leadService.js**

```js
getLeads: async (page = 1, pageSize = 25) => {
    return await apiClient.get(`/leads?page=${page}&pageSize=${pageSize}`);
},
```

- [ ] **Step 3: Create projectService.js**

Create `frontend/src/services/projectService.js`:

```js
import { apiClient } from './apiClient';

export const projectService = {
    getProjects: async (page = 1, pageSize = 25) => {
        return await apiClient.get(`/projects?page=${page}&pageSize=${pageSize}`);
    },
    getProjectById: async (id) => {
        return await apiClient.get(`/projects/${id}`);
    },
    createProject: async (data) => {
        return await apiClient.post('/projects', data);
    },
    updateProject: async (id, data) => {
        return await apiClient.put(`/projects/${id}`, data);
    },
    deleteProject: async (id) => {
        await apiClient.delete(`/projects/${id}`);
        return id;
    },
};
```

- [ ] **Step 4: Update companyService.js**

Change `getCompanies` (or equivalent getter) to pass page/pageSize:

```js
getCompanies: async (page = 1, pageSize = 25) => {
    return await apiClient.get(`/companies?page=${page}&pageSize=${pageSize}`);
},
```

- [ ] **Step 5: Update expenseService.js, incomeService.js, timesheetService.js**

Same pattern — add `page = 1, pageSize = 25` params and append to URL.

For `expenseService.js`:
```js
getExpenses: async (page = 1, pageSize = 25) => {
    return await apiClient.get(`/expenses?page=${page}&pageSize=${pageSize}`);
},
```

For `incomeService.js`:
```js
getIncomes: async (page = 1, pageSize = 25) => {
    return await apiClient.get(`/incomes?page=${page}&pageSize=${pageSize}`);
},
```

For `timesheetService.js`:
```js
getEntries: async (page = 1, pageSize = 25) => {
    return await apiClient.get(`/timesheet?page=${page}&pageSize=${pageSize}`);
},
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/
git commit -m "feat: add pagination params to all frontend service methods"
```

---

## Task 16: Update Login Page with 2FA Step

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`
- Modify: `frontend/src/pages/Auth/Login.jsx`

- [ ] **Step 1: Update AuthContext.login to handle requires2FA**

In `frontend/src/context/AuthContext.jsx`, replace the `login` function:

```js
async function login(email, password) {
    const data = await apiClient.post('/auth/login', { email, password });

    // 2FA required — return the challenge info, don't set user yet
    if (data.requires2FA) {
        return { requires2FA: true, method: data.twoFactorMethod, partialToken: data.partialToken };
    }

    const user = {
        id: data.id, email: data.email, displayName: data.displayName,
        role: data.role, permissions: data.permissions || []
    };
    setStoredUser(user);
    setCurrentUser(user);
    return { requires2FA: false, user };
}

async function completeLogin(loginResponse) {
    const user = {
        id: loginResponse.id, email: loginResponse.email,
        displayName: loginResponse.displayName,
        role: loginResponse.role, permissions: loginResponse.permissions || []
    };
    setStoredUser(user);
    setCurrentUser(user);
}
```

Add `completeLogin` to the context `value` object.

- [ ] **Step 2: Replace Login.jsx**

Replace the entire contents of `frontend/src/pages/Auth/Login.jsx`:

```jsx
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, KeyRound, Smartphone } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import loginBg from '../../assets/images/Login.png';

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
};
const focusStyle = { borderColor: 'rgba(67,97,238,0.6)', background: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 3px rgba(67,97,238,0.14)' };
const blurStyle  = { borderColor: 'rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', boxShadow: 'none' };

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // 2FA state
  const [step, setStep]               = useState('credentials'); // 'credentials' | 'otp' | 'totp'
  const [partialToken, setPartialToken] = useState('');
  const [otpCode, setOtpCode]         = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();

  // ── Step 1: Password ───────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requires2FA) {
        setPartialToken(result.partialToken);
        if (result.method === 'email') {
          // Auto-send OTP
          await apiClient.post('/auth/send-otp', { partialToken: result.partialToken });
          startResendCooldown();
          setStep('otp');
        } else {
          setStep('totp');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // ── Step 2A: Email OTP ─────────────────────────────────────
  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiClient.post('/auth/verify-otp', { code: otpCode, partialToken });
      await completeLogin(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleResendOtp() {
    setError('');
    try {
      await apiClient.post('/auth/send-otp', { partialToken });
      startResendCooldown();
    } catch (err) {
      setError(err.message);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) { clearInterval(cooldownRef.current); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  // ── Step 2B: TOTP ──────────────────────────────────────────
  async function handleTotpSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiClient.post('/auth/verify-totp', { code: otpCode, partialToken });
      await completeLogin(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // ── Shared card wrapper ─────────────────────────────────────
  return (
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(7,9,15,0.30) 100%)' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #4361EE, #7C3AED, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div className="rounded-[26px] p-8 border" style={{ background: 'rgba(13,17,28,0.88)', backdropFilter: 'blur(28px) saturate(1.6)', WebkitBackdropFilter: 'blur(28px) saturate(1.6)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)' }}>

          {/* Brand */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', boxShadow: '0 8px 28px rgba(67,97,238,0.45)' }}>
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h1 className="text-[24px] font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>A365Shift CRM</h1>
            <p className="text-slate-500 text-[12.5px] mt-1">
              {step === 'credentials' ? 'Sign in to your workspace' : step === 'otp' ? 'Check your email for a code' : 'Enter your authenticator code'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 px-4 py-3 rounded-xl text-[12.5px] text-center" style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.28)', color: '#FDA4AF' }}>
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.form key="creds" onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-[13.5px] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-[13.5px] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Link to="/forgot-password" className="text-[12px]" style={{ color: '#64748B', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <button type="submit" disabled={loading} className="w-full mt-1 flex items-center justify-center gap-2 py-[13px] rounded-xl font-semibold text-[13.5px] text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3D54D8 100%)', boxShadow: '0 4px 22px rgba(67,97,238,0.45)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.72 : 1, fontFamily: 'DM Sans, sans-serif' }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /><span>Signing in…</span></> : <><span>Sign in</span><ArrowRight size={15} /></>}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form key="otp" onSubmit={handleOtpSubmit} className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(67,97,238,0.15)', border: '1px solid rgba(67,97,238,0.3)' }}>
                    <KeyRound size={18} style={{ color: '#4361EE' }} />
                  </div>
                  <p className="text-[13px]" style={{ color: '#94a3b8' }}>We sent a 6-digit code to <strong className="text-white">{email}</strong></p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>6-Digit Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))} placeholder="000000" required className="w-full px-4 py-3 rounded-xl text-white text-center text-[20px] tracking-[0.3em] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                </div>
                <button type="submit" disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 py-[13px] rounded-xl font-semibold text-[13.5px] text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3D54D8 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || otpCode.length < 6) ? 0.72 : 1 }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /><span>Verifying…</span></> : <><span>Verify Code</span><ArrowRight size={15} /></>}
                </button>
                <div className="text-center">
                  <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} className="text-[12px] transition-colors" style={{ color: resendCooldown > 0 ? '#475569' : '#4361EE', background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
                <button type="button" onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); }} className="w-full text-[12px] text-center" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Back to sign in
                </button>
              </motion.form>
            )}

            {step === 'totp' && (
              <motion.form key="totp" onSubmit={handleTotpSubmit} className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(67,97,238,0.15)', border: '1px solid rgba(67,97,238,0.3)' }}>
                    <Smartphone size={18} style={{ color: '#4361EE' }} />
                  </div>
                  <p className="text-[13px]" style={{ color: '#94a3b8' }}>Enter the 6-digit code from your authenticator app</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>Authenticator Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))} placeholder="000000" required className="w-full px-4 py-3 rounded-xl text-white text-center text-[20px] tracking-[0.3em] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                </div>
                <button type="submit" disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 py-[13px] rounded-xl font-semibold text-[13.5px] text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3D54D8 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || otpCode.length < 6) ? 0.72 : 1 }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /><span>Verifying…</span></> : <><span>Verify</span><ArrowRight size={15} /></>}
                </button>
                <button type="button" onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); }} className="w-full text-[12px] text-center" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Back to sign in
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center mt-6 text-[11px] tracking-wider" style={{ color: '#334155', fontFamily: 'DM Sans, sans-serif' }}>
            AI-BUSINESS CRM &nbsp;·&nbsp; ENTERPRISE SUITE
          </p>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Verify login flow**

```bash
cd frontend && npm run dev
```
Navigate to `http://localhost:5173/login`. Confirm form renders identically to before for users without 2FA. To test 2FA: enable it for a user via the admin API, then log in — the OTP step should appear.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git add frontend/src/pages/Auth/Login.jsx
git commit -m "feat: add 2FA step to login flow (email OTP + TOTP)"
```

---

## Task 17: Add TOTP Setup to Settings

**Files:**
- Modify: `frontend/src/pages/Settings/Settings.jsx`

- [ ] **Step 1: Read existing Settings.jsx**

Open `frontend/src/pages/Settings/Settings.jsx` to understand its current tab structure before modifying.

- [ ] **Step 2: Add Security tab with TOTP setup**

Add a new tab button labelled "Security" to the existing tabs list. Add this tab panel (insert after the last existing tab panel):

```jsx
import QRCode from 'qrcode';

// Inside the component, add state:
const [totpSetup, setTotpSetup] = useState(null);      // { qrCodeUri, secret }
const [qrDataUrl, setQrDataUrl] = useState('');
const [totpCode, setTotpCode]   = useState('');
const [totpStatus, setTotpStatus] = useState('');      // success/error message
const [totpEnabled, setTotpEnabled] = useState(currentUser?.isTotpEnabled || false);

async function handleTotpSetup() {
    try {
        const data = await apiClient.get('/auth/totp/setup');
        setTotpSetup(data);
        const url = await QRCode.toDataURL(data.qrCodeUri, { width: 200, margin: 1 });
        setQrDataUrl(url);
    } catch (err) {
        setTotpStatus(err.message);
    }
}

async function handleTotpVerifySetup(e) {
    e.preventDefault();
    try {
        await apiClient.post('/auth/totp/verify-setup', { code: totpCode });
        setTotpEnabled(true);
        setTotpSetup(null);
        setQrDataUrl('');
        setTotpCode('');
        setTotpStatus('Authenticator app enabled successfully.');
    } catch (err) {
        setTotpStatus(err.message);
    }
}

async function handleTotpDisable() {
    try {
        await apiClient.post('/auth/totp/disable', {});
        setTotpEnabled(false);
        setTotpStatus('Authenticator app disabled.');
    } catch (err) {
        setTotpStatus(err.message);
    }
}
```

Security tab panel JSX:

```jsx
{activeTab === 'security' && (
  <div className="max-w-md">
    <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Authenticator App (TOTP)</h3>
    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
      Use Google Authenticator, Authy, or any TOTP app for extra login security.
    </p>

    {totpStatus && (
      <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: totpStatus.includes('success') || totpStatus.includes('disabled') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: totpStatus.includes('success') || totpStatus.includes('disabled') ? '#10b981' : '#f43f5e', border: `1px solid ${totpStatus.includes('success') || totpStatus.includes('disabled') ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
        {totpStatus}
      </div>
    )}

    {!totpEnabled && !totpSetup && (
      <button onClick={handleTotpSetup} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#4361EE', border: 'none', cursor: 'pointer' }}>
        Enable Authenticator App
      </button>
    )}

    {totpEnabled && !totpSetup && (
      <button onClick={handleTotpDisable} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}>
        Disable Authenticator App
      </button>
    )}

    {totpSetup && qrDataUrl && (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Scan this QR code with your authenticator app:</p>
        <img src={qrDataUrl} alt="TOTP QR Code" className="rounded-lg border p-2" style={{ background: '#fff', borderColor: 'var(--border-color)' }} />
        <p className="text-xs font-mono break-all p-2 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          Manual key: {totpSetup.secret}
        </p>
        <form onSubmit={handleTotpVerifySetup} className="flex gap-2">
          <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g,''))} placeholder="Enter 6-digit code" className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          <button type="submit" disabled={totpCode.length < 6} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#4361EE', border: 'none', cursor: totpCode.length < 6 ? 'not-allowed' : 'pointer', opacity: totpCode.length < 6 ? 0.6 : 1 }}>
            Confirm
          </button>
        </form>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Navigate to Settings → Security tab. Click "Enable Authenticator App". Confirm a QR code appears. Scan with Google Authenticator, enter the 6-digit code, confirm it saves.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Settings/Settings.jsx
git commit -m "feat: add TOTP authenticator setup UI to Settings security tab"
```

---

## Task 18: Wire Pagination into List Pages

Apply pagination UI to the main list views. For each page, the pattern is:

1. Add `const [page, setPage] = useState(1)` and `const [pageSize, setPageSize] = useState(25)` state
2. Pass `page` and `pageSize` to the service call
3. Store `totalPages` from the response (response shape: `{ items, totalCount, page, pageSize, totalPages }`)
4. Render `<Pagination>` below the list

- [ ] **Step 1: Contacts page**

Open `frontend/src/pages/Contact/Contacts/Contacts.jsx`. Find the data-fetching `useEffect` that calls `contactService.getContacts()`. Replace the fetching pattern:

```jsx
import Pagination from '../../../components/Pagination/Pagination';

// State additions:
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);
const [totalPages, setTotalPages] = useState(1);

// In fetchContacts (or useEffect):
const result = await contactService.getContacts(page, pageSize);
setContacts(result.items);     // was: setContacts(result)
setTotalPages(result.totalPages);

// Add dependency: useEffect deps array should include [page, pageSize]

// Below the contact list JSX, add:
<Pagination
  page={page}
  totalPages={totalPages}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
/>
```

- [ ] **Step 2: Leads page**

Open `frontend/src/pages/Leads/Leads.jsx`. Apply the same pattern with `leadService.getLeads(page, pageSize)`.

- [ ] **Step 3: Projects page**

Open `frontend/src/pages/Projects/Projects.jsx`. Apply pattern with `projectService.getProjects(page, pageSize)`. Import from the new `projectService.js`.

- [ ] **Step 4: Finance page**

Open `frontend/src/pages/Finance/Finance.jsx`. The Finance page likely fetches both expenses and incomes. Apply pagination to each list independently (separate page/pageSize state per list, or combine with tabs).

- [ ] **Step 5: Verify in browser**

```bash
cd frontend && npm run dev
```
Navigate to Contacts, Leads, Projects pages. Confirm pagination controls appear at bottom. Changing page should load different records.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src/pages/
git commit -m "feat: add server-side pagination UI to contacts, leads, projects, finance pages"
```

---

## Task 19: Final Backend appsettings + Run Full Build

- [ ] **Step 1: Update the actual source appsettings.json** (not the bin copy)

Open `backend/A365ShiftTracker.API/appsettings.json`. Verify it has:
- `Smtp` section (from Task 8)
- `Encryption.Key` section (should already exist)
- All existing sections intact

- [ ] **Step 2: Full build**

```bash
cd backend && dotnet build
```
Expected: `Build succeeded. 0 Error(s).`

- [ ] **Step 3: Run and verify Swagger**

```bash
cd backend && dotnet run --project A365ShiftTracker.API
```
Open `http://localhost:5231/swagger`. Verify:
- `POST /api/auth/send-otp` exists
- `POST /api/auth/verify-otp` exists
- `POST /api/auth/verify-totp` exists
- `GET  /api/auth/totp/setup` exists
- All list endpoints show `page` and `pageSize` query params

- [ ] **Step 4: Full frontend build check**

```bash
cd frontend && npm run build
```
Expected: `Build succeeded` with no TypeScript/ESLint errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete backend optimization and 2FA implementation"
```

---

## Self-Review Checklist

- [x] **PagedResult<T>** — Task 1 ✓
- [x] **GetPagedAsync + AsNoTracking** — Task 2 ✓
- [x] **Response compression** — Task 3 ✓
- [x] **IMemoryCache registration** — Task 3 ✓
- [x] **Permission caching** — Task 10 ✓
- [x] **Contact pagination** — Task 4 ✓
- [x] **Project, Lead, Company pagination** — Task 5 ✓
- [x] **Expense, Income, Task, Timesheet, Invoice, Ticket, Log pagination** — Task 6 ✓
- [x] **2FA User fields + migration** — Task 7 ✓
- [x] **IEmailService + MailKit** — Task 8 ✓
- [x] **Auth DTOs + IAuthService** — Task 9 ✓
- [x] **AuthService with full 2FA logic** — Task 10 ✓
- [x] **AuthController 2FA endpoints** — Task 11 ✓
- [x] **Admin 2FA toggle** — Task 12 ✓
- [x] **React Query + lazy loading** — Task 13 ✓
- [x] **Pagination component** — Task 14 ✓
- [x] **Frontend service pagination params** — Task 15 ✓
- [x] **Login 2FA step UI** — Task 16 ✓
- [x] **TOTP Settings setup** — Task 17 ✓
- [x] **Pagination wired into list pages** — Task 18 ✓

**Note on double SaveChangesAsync audit fix:** The audit log currently does 2 saves. The fix — batch all audit entries and add them before the second `base.SaveChangesAsync` call — is already structurally present in `AppDbContext.SaveChangesAsync`. The current code already does this correctly (adds `auditEntries` then calls `base.SaveChangesAsync` once more). No additional change needed beyond what was already implemented.
