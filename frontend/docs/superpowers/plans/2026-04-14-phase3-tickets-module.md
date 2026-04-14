# Phase 3 — Tickets Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified helpdesk + internal task tracker with AI auto-generation from raw text (emails, logs, conversation snippets). Supports Client Support, Bug, and Internal Task ticket types, linked to the full CRM graph.

**Architecture:** `Ticket` + `TicketComment` entities. `TicketsController` with a `POST /ai-generate` endpoint that calls Claude API (`claude-sonnet-4-6`) to parse raw text into structured ticket fields. Frontend: Kanban + list view, `<TicketModal>` with Comments thread, `<AITicketModal>` 3-step wizard.

**Tech Stack:** ASP.NET Core 8 · EF Core · PostgreSQL · Anthropic Claude API (`claude-sonnet-4-6`) · React 19 · Lucide icons

**Prerequisite:** Phase 1 must be complete (AuditableEntity with user-stamp fields). The Claude API key must be configured in `appsettings.json` or environment variables.

---

## File Map

**Backend — Created:**
- `A365ShiftTracker.Domain/Entities/Ticket.cs`
- `A365ShiftTracker.Domain/Entities/TicketComment.cs`
- `A365ShiftTracker.Application/DTOs/TicketDtos.cs`
- `A365ShiftTracker.Application/Interfaces/ITicketService.cs`
- `A365ShiftTracker.Application/Services/TicketService.cs`
- `A365ShiftTracker.Application/Services/TicketAiService.cs`
- `A365ShiftTracker.API/Controllers/TicketsController.cs`

**Backend — Modified:**
- `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs` — add `Tickets` + `TicketComments` DbSets
- `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs` — add `Tickets`, `TicketComments` properties
- `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs` — add lazy properties
- `A365ShiftTracker.Infrastructure/DependencyInjection.cs` — register services
- `appsettings.json` (or `appsettings.Development.json`) — add `Claude:ApiKey` config
- DB migration: `AddTicketsAndTicketCommentsTable`

**Frontend — Created:**
- `src/services/ticketService.js`
- `src/pages/Tickets/Tickets.jsx`
- `src/pages/Tickets/TicketModal.jsx`
- `src/pages/Tickets/AITicketModal.jsx`
- `src/pages/Tickets/Tickets.css`

**Frontend — Modified:**
- `src/App.jsx` — add `/tickets` route
- `src/layouts/MainLayout.jsx` — add Tickets nav entry between Leads and Calendar

---

### Task 1: Create `Ticket` and `TicketComment` entities

**Files:**
- Create: `A365ShiftTracker.Domain/Entities/Ticket.cs`
- Create: `A365ShiftTracker.Domain/Entities/TicketComment.cs`

- [ ] **Step 1: Create `Ticket.cs`**

```csharp
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class Ticket : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;    // "TKT-2026-0001"
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Internal Task";          // "Client Support"|"Bug"|"Internal Task"
    public string Priority { get; set; } = "Medium";             // "Critical"|"High"|"Medium"|"Low"
    public string Status { get; set; } = "Open";                 // "Open"|"In Progress"|"Pending"|"Resolved"|"Closed"
    public string? Category { get; set; }                        // "Billing"|"Technical"|"Feature Request"

    // CRM Links
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }

    // Assignment
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }

    // Timeline
    public DateTime? DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    // AI metadata
    public bool IsAiGenerated { get; set; } = false;
    public string? AiSource { get; set; }                        // "Email"|"ActivityLog"
    public decimal? AiConfidence { get; set; }                   // 0.0 – 1.0
    public string? AiRawInput { get; set; }

    // Navigation
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
}
```

- [ ] **Step 2: Create `TicketComment.cs`**

```csharp
using A365ShiftTracker.Domain.Common;

namespace A365ShiftTracker.Domain.Entities;

public class TicketComment : BaseEntity
{
    public int TicketId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;               // internal note vs client-visible
    public int AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Ticket Ticket { get; set; } = null!;
}
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Domain
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add A365ShiftTracker.Domain/Entities/Ticket.cs \
        A365ShiftTracker.Domain/Entities/TicketComment.cs
git commit -m "feat(tickets): add Ticket + TicketComment entities"
```

---

### Task 2: Create DTOs

**Files:**
- Create: `A365ShiftTracker.Application/DTOs/TicketDtos.cs`

- [ ] **Step 1: Create the DTO file**

```csharp
namespace A365ShiftTracker.Application.DTOs;

public class TicketDto
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public bool IsAiGenerated { get; set; }
    public string? AiSource { get; set; }
    public decimal? AiConfidence { get; set; }
    public string? AiRawInput { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public List<TicketCommentDto> Comments { get; set; } = new();
}

public class TicketCommentDto
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public int AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTicketRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Internal Task";
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "Open";
    public string? Category { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsAiGenerated { get; set; } = false;
    public string? AiSource { get; set; }
    public decimal? AiConfidence { get; set; }
    public string? AiRawInput { get; set; }
}

public class UpdateTicketRequest : CreateTicketRequest
{
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}

public class CreateTicketCommentRequest
{
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;
    public string AuthorName { get; set; } = string.Empty;
}

public class AiGenerateTicketRequest
{
    public string RawText { get; set; } = string.Empty;
}

public class AiGeneratedTicketDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Internal Task";
    public string Priority { get; set; } = "Medium";
    public string? Category { get; set; }
    public string? SuggestedContactName { get; set; }
    public string? SuggestedCompanyName { get; set; }
    public decimal Confidence { get; set; }
}

public class TicketStatsDto
{
    public int Open { get; set; }
    public int InProgress { get; set; }
    public int Pending { get; set; }
    public int Resolved { get; set; }
    public int Closed { get; set; }
    public int Critical { get; set; }
    public int High { get; set; }
    public int Medium { get; set; }
    public int Low { get; set; }
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Application
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add A365ShiftTracker.Application/DTOs/TicketDtos.cs
git commit -m "feat(tickets): add Ticket DTOs"
```

---

### Task 3: Create `TicketAiService`

**Files:**
- Create: `A365ShiftTracker.Application/Services/TicketAiService.cs`

- [ ] **Step 1: Add Claude API NuGet package to Application project (if not already added)**

```bash
cd backend && dotnet add A365ShiftTracker.Application package Anthropic.SDK
```

If `Anthropic.SDK` is not available, use `System.Net.Http.Json` with a raw HTTP call instead (see Step 2 alternative).

- [ ] **Step 2: Create `TicketAiService.cs`**

This service uses raw HttpClient to call Claude API so there are no extra package dependencies:

```csharp
using System.Net.Http.Json;
using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using Microsoft.Extensions.Configuration;

namespace A365ShiftTracker.Application.Services;

public class TicketAiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public TicketAiService(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _http = httpClientFactory.CreateClient("Claude");
        _apiKey = config["Claude:ApiKey"] ?? throw new InvalidOperationException("Claude:ApiKey not configured");
    }

    public async Task<AiGeneratedTicketDto> GenerateTicketAsync(string rawText)
    {
        var systemPrompt = """
            You are a CRM assistant. Given raw text (email, log entry, or note), extract a support/task ticket.
            
            Return ONLY valid JSON with these exact fields:
            {
              "title": "concise summary (max 80 chars)",
              "description": "cleaned body text",
              "type": "Client Support" | "Bug" | "Internal Task",
              "priority": "Critical" | "High" | "Medium" | "Low",
              "category": "Billing" | "Technical" | "Feature Request" | "HR" | "Legal" | "Other" | null,
              "suggestedContactName": "full name if mentioned, else null",
              "suggestedCompanyName": "company name if mentioned, else null",
              "confidence": 0.0 to 1.0
            }
            
            Priority rules:
            - Critical: words like "urgent", "ASAP", "system down", "data loss", "P0"
            - High: "important", "today", "by EOD", "blocking"
            - Low: "when possible", "nice to have", "future", "someday"
            - Medium: everything else
            """;

        var requestBody = new
        {
            model = "claude-sonnet-4-6",
            max_tokens = 512,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = rawText }
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", _apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = JsonContent.Create(requestBody);

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);

        var text = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        // Strip markdown code fences if present
        text = text.Trim();
        if (text.StartsWith("```")) text = text.Split('\n', 2)[1];
        if (text.EndsWith("```")) text = text[..text.LastIndexOf("```")];

        var result = JsonSerializer.Deserialize<AiGeneratedTicketDto>(text,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result ?? new AiGeneratedTicketDto
        {
            Title = "Untitled Ticket",
            Type = "Internal Task",
            Priority = "Medium",
            Confidence = 0.0m
        };
    }
}
```

- [ ] **Step 3: Add `Claude:ApiKey` to config**

In `A365ShiftTracker.API/appsettings.Development.json` (do NOT commit the real key — use user secrets or env vars in production):

```json
{
  "Claude": {
    "ApiKey": "sk-ant-YOUR_KEY_HERE"
  }
}
```

For production, set environment variable `Claude__ApiKey`.

- [ ] **Step 4: Register `HttpClientFactory` and `TicketAiService` in `DependencyInjection.cs`**

```csharp
services.AddHttpClient("Claude");
services.AddScoped<TicketAiService>();
```

- [ ] **Step 5: Build**

```bash
cd backend && dotnet build A365ShiftTracker.Application
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add A365ShiftTracker.Application/Services/TicketAiService.cs \
        A365ShiftTracker.Infrastructure/DependencyInjection.cs
git commit -m "feat(tickets): add TicketAiService (Claude API integration)"
```

---

### Task 4: Create `ITicketService` and `TicketService`

**Files:**
- Create: `A365ShiftTracker.Application/Interfaces/ITicketService.cs`
- Create: `A365ShiftTracker.Application/Services/TicketService.cs`

- [ ] **Step 1: Create the interface**

```csharp
using A365ShiftTracker.Application.DTOs;

namespace A365ShiftTracker.Application.Interfaces;

public interface ITicketService
{
    Task<List<TicketDto>> GetAllAsync(int userId);
    Task<TicketDto?> GetByIdAsync(int id, int userId);
    Task<TicketDto> CreateAsync(CreateTicketRequest req, int userId);
    Task<TicketDto?> UpdateAsync(int id, UpdateTicketRequest req, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<TicketStatsDto> GetStatsAsync(int userId);
    Task<TicketCommentDto> AddCommentAsync(int ticketId, CreateTicketCommentRequest req, int userId);
    Task<List<TicketCommentDto>> GetCommentsAsync(int ticketId, int userId);
}
```

- [ ] **Step 2: Create the service**

```csharp
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Services;

public class TicketService : ITicketService
{
    private readonly IUnitOfWork _uow;

    public TicketService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<TicketDto>> GetAllAsync(int userId)
    {
        var items = await _uow.Tickets.FindAsync(t => t.UserId == userId);
        return items.OrderByDescending(t => t.CreatedAt).Select(MapToDto).ToList();
    }

    public async Task<TicketDto?> GetByIdAsync(int id, int userId)
    {
        var ticket = await _uow.Tickets.FindOneAsync(t => t.Id == id && t.UserId == userId);
        if (ticket == null) return null;
        var comments = await _uow.TicketComments.FindAsync(c => c.TicketId == id);
        ticket.Comments = comments.OrderBy(c => c.CreatedAt).ToList();
        return MapToDto(ticket);
    }

    public async Task<TicketDto> CreateAsync(CreateTicketRequest req, int userId)
    {
        // Generate ticket number: TKT-{YYYY}-{sequential padded to 4}
        var existingCount = (await _uow.Tickets.FindAsync(t => t.UserId == userId)).Count;
        var number = $"TKT-{DateTime.UtcNow.Year}-{(existingCount + 1):D4}";

        var entity = new Ticket
        {
            UserId = userId,
            TicketNumber = number,
            Title = req.Title,
            Description = req.Description,
            Type = req.Type,
            Priority = req.Priority,
            Status = req.Status,
            Category = req.Category,
            ContactId = req.ContactId,
            CompanyId = req.CompanyId,
            ProjectId = req.ProjectId,
            LeadId = req.LeadId,
            AssignedToUserId = req.AssignedToUserId,
            AssignedToName = req.AssignedToName,
            DueDate = req.DueDate,
            IsAiGenerated = req.IsAiGenerated,
            AiSource = req.AiSource,
            AiConfidence = req.AiConfidence,
            AiRawInput = req.AiRawInput
        };

        await _uow.Tickets.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<TicketDto?> UpdateAsync(int id, UpdateTicketRequest req, int userId)
    {
        var entity = await _uow.Tickets.FindOneAsync(t => t.Id == id && t.UserId == userId);
        if (entity == null) return null;

        entity.Title = req.Title;
        entity.Description = req.Description;
        entity.Type = req.Type;
        entity.Priority = req.Priority;
        entity.Status = req.Status;
        entity.Category = req.Category;
        entity.ContactId = req.ContactId;
        entity.CompanyId = req.CompanyId;
        entity.ProjectId = req.ProjectId;
        entity.LeadId = req.LeadId;
        entity.AssignedToUserId = req.AssignedToUserId;
        entity.AssignedToName = req.AssignedToName;
        entity.DueDate = req.DueDate;
        entity.ResolvedAt = req.ResolvedAt;
        entity.ClosedAt = req.ClosedAt;

        await _uow.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var entity = await _uow.Tickets.FindOneAsync(t => t.Id == id && t.UserId == userId);
        if (entity == null) return false;
        _uow.Tickets.Remove(entity);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<TicketStatsDto> GetStatsAsync(int userId)
    {
        var all = await _uow.Tickets.FindAsync(t => t.UserId == userId);
        return new TicketStatsDto
        {
            Open = all.Count(t => t.Status == "Open"),
            InProgress = all.Count(t => t.Status == "In Progress"),
            Pending = all.Count(t => t.Status == "Pending"),
            Resolved = all.Count(t => t.Status == "Resolved"),
            Closed = all.Count(t => t.Status == "Closed"),
            Critical = all.Count(t => t.Priority == "Critical"),
            High = all.Count(t => t.Priority == "High"),
            Medium = all.Count(t => t.Priority == "Medium"),
            Low = all.Count(t => t.Priority == "Low"),
        };
    }

    public async Task<TicketCommentDto> AddCommentAsync(int ticketId, CreateTicketCommentRequest req, int userId)
    {
        var ticket = await _uow.Tickets.FindOneAsync(t => t.Id == ticketId && t.UserId == userId);
        if (ticket == null) throw new KeyNotFoundException("Ticket not found");

        var comment = new TicketComment
        {
            TicketId = ticketId,
            Comment = req.Comment,
            IsInternal = req.IsInternal,
            AuthorUserId = userId,
            AuthorName = req.AuthorName
        };

        await _uow.TicketComments.AddAsync(comment);
        await _uow.SaveChangesAsync();
        return MapCommentToDto(comment);
    }

    public async Task<List<TicketCommentDto>> GetCommentsAsync(int ticketId, int userId)
    {
        // Verify ownership
        var ticket = await _uow.Tickets.FindOneAsync(t => t.Id == ticketId && t.UserId == userId);
        if (ticket == null) return new List<TicketCommentDto>();
        var comments = await _uow.TicketComments.FindAsync(c => c.TicketId == ticketId);
        return comments.OrderBy(c => c.CreatedAt).Select(MapCommentToDto).ToList();
    }

    private static TicketDto MapToDto(Ticket t) => new()
    {
        Id = t.Id,
        TicketNumber = t.TicketNumber,
        Title = t.Title,
        Description = t.Description,
        Type = t.Type,
        Priority = t.Priority,
        Status = t.Status,
        Category = t.Category,
        ContactId = t.ContactId,
        CompanyId = t.CompanyId,
        ProjectId = t.ProjectId,
        LeadId = t.LeadId,
        AssignedToUserId = t.AssignedToUserId,
        AssignedToName = t.AssignedToName,
        DueDate = t.DueDate,
        ResolvedAt = t.ResolvedAt,
        ClosedAt = t.ClosedAt,
        IsAiGenerated = t.IsAiGenerated,
        AiSource = t.AiSource,
        AiConfidence = t.AiConfidence,
        AiRawInput = t.AiRawInput,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
        CreatedByName = t.CreatedByName,
        Comments = t.Comments.Select(MapCommentToDto).ToList()
    };

    private static TicketCommentDto MapCommentToDto(TicketComment c) => new()
    {
        Id = c.Id,
        TicketId = c.TicketId,
        Comment = c.Comment,
        IsInternal = c.IsInternal,
        AuthorUserId = c.AuthorUserId,
        AuthorName = c.AuthorName,
        CreatedAt = c.CreatedAt
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
git add A365ShiftTracker.Application/Interfaces/ITicketService.cs \
        A365ShiftTracker.Application/Services/TicketService.cs
git commit -m "feat(tickets): add ITicketService + TicketService"
```

---

### Task 5: Register in `AppDbContext`, `UnitOfWork`, and DI

**Files:**
- Modify: `A365ShiftTracker.Infrastructure/Data/AppDbContext.cs`
- Modify: `A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs`
- Modify: `A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs`
- Modify: `A365ShiftTracker.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Add DbSets to `AppDbContext.cs`**

Add alongside other DbSets:
```csharp
public DbSet<Ticket> Tickets => Set<Ticket>();
public DbSet<TicketComment> TicketComments => Set<TicketComment>();
```

Add table configs in `OnModelCreating` before the snake_case loop:
```csharp
// ─── Tickets ─────────────────────────────────────
modelBuilder.Entity<Ticket>(e =>
{
    e.ToTable("tickets");
    e.HasIndex(t => t.UserId);
    e.HasIndex(t => t.Status);
    e.HasIndex(t => t.Priority);
    e.HasIndex(t => t.TicketNumber).IsUnique();
    e.HasMany(t => t.Comments).WithOne(c => c.Ticket)
        .HasForeignKey(c => c.TicketId).OnDelete(DeleteBehavior.Cascade);
    e.Property(t => t.AiConfidence).HasColumnType("decimal(4,3)");
});

modelBuilder.Entity<TicketComment>(e =>
{
    e.ToTable("ticket_comments");
    e.HasIndex(c => c.TicketId);
});
```

- [ ] **Step 2: Add to `IUnitOfWork.cs`**

```csharp
IRepository<Ticket> Tickets { get; }
IRepository<TicketComment> TicketComments { get; }
```

- [ ] **Step 3: Add to `UnitOfWork.cs`**

```csharp
private IRepository<Ticket>? _tickets;
public IRepository<Ticket> Tickets => _tickets ??= new Repository<Ticket>(_context);

private IRepository<TicketComment>? _ticketComments;
public IRepository<TicketComment> TicketComments => _ticketComments ??= new Repository<TicketComment>(_context);
```

- [ ] **Step 4: Register in `DependencyInjection.cs`**

```csharp
services.AddScoped<ITicketService, TicketService>();
```

(TicketAiService was already registered in Task 3, Step 4.)

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
git commit -m "feat(tickets): register Tickets in DbContext, UnitOfWork, and DI"
```

---

### Task 6: Create `TicketsController`

**Files:**
- Create: `A365ShiftTracker.API/Controllers/TicketsController.cs`

- [ ] **Step 1: Create the controller**

```csharp
using A365ShiftTracker.Application.DTOs;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Application.Services;
using A365ShiftTracker.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets")]
public class TicketsController : BaseApiController
{
    private readonly ITicketService _service;
    private readonly TicketAiService _aiService;

    public TicketsController(ITicketService service, TicketAiService aiService)
    {
        _service = service;
        _aiService = aiService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(ApiResponse<List<TicketDto>>.Ok(result, "Tickets retrieved"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetByIdAsync(id, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<TicketDto>.Ok(result, "Ticket retrieved"));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.CreateAsync(req, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<TicketDto>.Ok(result, "Ticket created"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTicketRequest req)
    {
        var userId = GetCurrentUserId();
        var result = await _service.UpdateAsync(id, req, userId);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<TicketDto>.Ok(result, "Ticket updated"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _service.DeleteAsync(id, userId);
        if (!deleted) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(null, "Ticket deleted"));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetStatsAsync(userId);
        return Ok(ApiResponse<TicketStatsDto>.Ok(result, "Stats retrieved"));
    }

    [HttpPost("ai-generate")]
    public async Task<IActionResult> AiGenerate([FromBody] AiGenerateTicketRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RawText))
            return BadRequest(ApiResponse<object>.Fail("rawText is required"));
        try
        {
            var result = await _aiService.GenerateTicketAsync(req.RawText);
            return Ok(ApiResponse<AiGeneratedTicketDto>.Ok(result, "AI ticket generated"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"AI generation failed: {ex.Message}"));
        }
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _service.GetCommentsAsync(id, userId);
        return Ok(ApiResponse<List<TicketCommentDto>>.Ok(result, "Comments retrieved"));
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateTicketCommentRequest req)
    {
        var userId = GetCurrentUserId();
        try
        {
            var result = await _service.AddCommentAsync(id, req, userId);
            return Ok(ApiResponse<TicketCommentDto>.Ok(result, "Comment added"));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.Fail("Ticket not found"));
        }
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
git add A365ShiftTracker.API/Controllers/TicketsController.cs
git commit -m "feat(tickets): add TicketsController with CRUD + AI generate + comments"
```

---

### Task 7: Run DB Migration

- [ ] **Step 1: Generate migration**

```bash
cd backend && dotnet ef migrations add AddTicketsAndTicketCommentsTable \
  --project A365ShiftTracker.Infrastructure \
  --startup-project A365ShiftTracker.API
```

Expected: `Done.`

- [ ] **Step 2: Review migration**

Confirm:
- `tickets` table with all columns including `ai_confidence` as `decimal(4,3)`
- `ticket_comments` table
- Unique index on `ticket_number`
- Cascade delete on `ticket_comments.ticket_id`

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
git commit -m "feat(tickets): db migration AddTicketsAndTicketCommentsTable"
```

---

### Task 8: Create `ticketService.js`

**Files:**
- Create: `src/services/ticketService.js`

- [ ] **Step 1: Create the service**

```js
import apiClient from './apiClient';

const base = '/tickets';

export const ticketService = {
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

  getStats: () =>
    apiClient.get(`${base}/stats`).then(r => r.data?.data),

  aiGenerate: (rawText) =>
    apiClient.post(`${base}/ai-generate`, { rawText }).then(r => r.data?.data),

  getComments: (ticketId) =>
    apiClient.get(`${base}/${ticketId}/comments`).then(r => r.data?.data ?? []),

  addComment: (ticketId, data) =>
    apiClient.post(`${base}/${ticketId}/comments`, data).then(r => r.data?.data),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ticketService.js
git commit -m "feat(tickets): add ticketService.js"
```

---

### Task 9: Create `Tickets.css`

**Files:**
- Create: `src/pages/Tickets/Tickets.css`

- [ ] **Step 1: Create the CSS file**

```css
/* Tickets Module */

/* Priority color dots */
.ticket-priority-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  flex-shrink: 0;
}
.priority-critical { background: #F43F5E; }
.priority-high     { background: #F59E0B; }
.priority-medium   { background: #4361EE; }
.priority-low      { background: #94A3B8; }

/* Priority badges */
.ticket-priority-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}
.tpb-critical { background: rgba(244,63,94,0.10); color: #E11D48; }
.tpb-high     { background: rgba(245,158,11,0.10); color: #B45309; }
.tpb-medium   { background: rgba(67,97,238,0.10);  color: #4361EE; }
.tpb-low      { background: #F1F5F9; color: #64748B; }

/* Type badges */
.ticket-type-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}
.ttb-client  { background: rgba(6,182,212,0.10); color: #0891B2; }
.ttb-bug     { background: rgba(239,68,68,0.10); color: #DC2626; }
.ttb-internal { background: rgba(139,92,246,0.10); color: #7C3AED; }

/* AI Badge */
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(67,97,238,0.12), rgba(139,92,246,0.12));
  color: #7C3AED;
  border: 1px solid rgba(139,92,246,0.2);
}

/* Kanban */
.ticket-kanban {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  align-items: start;
}

.kanban-col {
  background: #F8FAFC;
  border: 1px solid #E1E8F4;
  border-radius: 12px;
  padding: 12px;
  min-height: 200px;
}

.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #E1E8F4;
}

.kanban-col-title {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kanban-count {
  font-size: 11px;
  font-weight: 700;
  background: #E1E8F4;
  color: #64748B;
  padding: 1px 8px;
  border-radius: 999px;
}

.kanban-card {
  background: #FFF;
  border: 1px solid #E1E8F4;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  box-shadow: 0 1px 4px rgba(15,23,42,0.04);
}

.kanban-card:hover {
  box-shadow: 0 4px 12px rgba(15,23,42,0.10);
  transform: translateY(-1px);
}

.kanban-card-number {
  font-size: 10.5px;
  color: #94A3B8;
  font-weight: 600;
  margin-bottom: 4px;
}

.kanban-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 8px;
  line-height: 1.3;
}

.kanban-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
}

/* AI Modal */
.ai-modal-step {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.ai-step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.ai-step-dot.active { background: #4361EE; color: #FFF; }
.ai-step-dot.done   { background: #10B981; color: #FFF; }
.ai-step-dot.pending { background: #E1E8F4; color: #94A3B8; }

.ai-step-line {
  flex: 1;
  height: 2px;
  background: #E1E8F4;
}

.ai-step-line.done { background: #10B981; }

.ai-textarea-raw {
  width: 100%;
  min-height: 160px;
  resize: vertical;
  font-size: 13px;
  line-height: 1.6;
}

.ai-confidence-bar {
  height: 4px;
  border-radius: 999px;
  background: #E1E8F4;
  margin-top: 4px;
}

.ai-confidence-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s;
}

/* Comment thread */
.comment-thread { display: flex; flex-direction: column; gap: 10px; }

.comment-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1px solid #E1E8F4;
}

.comment-item.internal {
  background: rgba(245,158,11,0.06);
  border-color: rgba(245,158,11,0.2);
}

.comment-author { font-size: 12px; font-weight: 700; color: #334155; }
.comment-time   { font-size: 11px; color: #94A3B8; }
.comment-body   { font-size: 13px; color: #475569; margin-top: 4px; line-height: 1.5; }
.comment-internal-label { font-size: 10px; font-weight: 700; color: #B45309; text-transform: uppercase; }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Tickets/Tickets.css
git commit -m "feat(tickets): add Tickets.css"
```

---

### Task 10: Create `AITicketModal.jsx`

**Files:**
- Create: `src/pages/Tickets/AITicketModal.jsx`

- [ ] **Step 1: Create the 3-step AI modal**

```jsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { ticketService } from '../../services/ticketService';

const STEPS = ['Input', 'Preview', 'Confirm'];

export default function AITicketModal({ show, onHide, onConfirm }) {
  const [step, setStep] = useState(0);
  const [rawText, setRawText] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setStep(0); setRawText(''); setPreview(null); setError(''); };
  const handleHide = () => { reset(); onHide(); };

  const handleAnalyze = async () => {
    if (!rawText.trim()) { setError('Paste some text first'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await ticketService.aiGenerate(rawText);
      setPreview(result);
      setStep(1);
    } catch (e) {
      setError('AI generation failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      title: preview.title,
      description: preview.description,
      type: preview.type,
      priority: preview.priority,
      category: preview.category,
      isAiGenerated: true,
      aiSource: 'Manual Input',
      aiConfidence: preview.confidence,
      aiRawInput: rawText,
    });
    handleHide();
  };

  const confidencePct = preview ? Math.round(preview.confidence * 100) : 0;
  const confidenceColor = confidencePct >= 80 ? '#10B981' : confidencePct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: '#7C3AED' }} />
          AI Ticket Generator
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Step indicator */}
        <div className="ai-modal-step">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`ai-step-dot ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`ai-step-line ${i < step ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Input */}
        {step === 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Paste an email, log snippet, or conversation. Claude will extract a structured ticket.
            </p>
            <Form.Control
              as="textarea"
              className="glass-input ai-textarea-raw"
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste email, Slack message, support log, or any text here…"
            />
            {error && <div className="text-danger mt-2" style={{ fontSize: 12 }}>{error}</div>}
          </div>
        )}

        {/* Step 1: Preview */}
        {step === 1 && preview && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>AI Confidence</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: confidenceColor }}>{confidencePct}%</span>
            </div>
            <div className="ai-confidence-bar">
              <div className="ai-confidence-fill" style={{ width: `${confidencePct}%`, background: confidenceColor }} />
            </div>

            <div style={{ marginTop: 16 }}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Title</Form.Label>
                <Form.Control className="glass-input" value={preview.title} onChange={e => setPreview({ ...preview, title: e.target.value })} />
              </Form.Group>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Type</Form.Label>
                  <Form.Select className="glass-input" value={preview.type} onChange={e => setPreview({ ...preview, type: e.target.value })}>
                    {['Client Support', 'Bug', 'Internal Task'].map(t => <option key={t}>{t}</option>)}
                  </Form.Select>
                </div>
                <div className="col-6">
                  <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Priority</Form.Label>
                  <Form.Select className="glass-input" value={preview.priority} onChange={e => setPreview({ ...preview, priority: e.target.value })}>
                    {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                  </Form.Select>
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Description</Form.Label>
                <Form.Control as="textarea" rows={4} className="glass-input" value={preview.description ?? ''} onChange={e => setPreview({ ...preview, description: e.target.value })} />
              </Form.Group>
              {preview.suggestedContactName && (
                <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #E1E8F4' }}>
                  Suggested contact: <strong>{preview.suggestedContactName}</strong>
                  {preview.suggestedCompanyName && <> · <strong>{preview.suggestedCompanyName}</strong></>}
                  <span style={{ color: '#94A3B8', marginLeft: 4 }}>(link manually in ticket details)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={24} style={{ color: '#10B981' }} />
            </div>
            <h6 style={{ fontWeight: 700, color: '#0F172A' }}>Ready to create</h6>
            <p style={{ fontSize: 13, color: '#64748B' }}>
              Ticket "<strong>{preview?.title}</strong>" will be created with an AI badge.
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide}>Cancel</Button>
        {step === 0 && (
          <Button onClick={handleAnalyze} disabled={loading} style={{ background: '#7C3AED', border: 'none' }}>
            {loading ? 'Analyzing…' : <><Sparkles size={14} style={{ marginRight: 6 }} />Analyze with AI</>}
          </Button>
        )}
        {step === 1 && (
          <>
            <Button variant="outline-secondary" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)} style={{ background: '#4361EE', border: 'none' }}>
              <ChevronRight size={14} style={{ marginRight: 4 }} />Looks Good
            </Button>
          </>
        )}
        {step === 2 && (
          <Button onClick={handleConfirm} style={{ background: '#10B981', border: 'none' }}>
            <Check size={14} style={{ marginRight: 6 }} />Create Ticket
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Tickets/AITicketModal.jsx
git commit -m "feat(tickets): add AITicketModal 3-step wizard"
```

---

### Task 11: Create `TicketModal.jsx`

**Files:**
- Create: `src/pages/Tickets/TicketModal.jsx`

- [ ] **Step 1: Create the modal**

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';
import { Send, Lock } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import AuditPanel from '../../components/AuditPanel/AuditPanel';
import { ticketService } from '../../services/ticketService';

const TYPES = ['Client Support', 'Bug', 'Internal Task'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const CATEGORIES = ['Billing', 'Technical', 'Feature Request', 'HR', 'Legal', 'Other'];

const emptyForm = {
  title: '', description: '', type: 'Internal Task', priority: 'Medium',
  status: 'Open', category: '', contactId: '', companyId: '', projectId: '',
  leadId: '', assignedToUserId: '', assignedToName: '', dueDate: '',
};

const PRIORITY_COLOR = { Critical: '#F43F5E', High: '#F59E0B', Medium: '#4361EE', Low: '#94A3B8' };

export default function TicketModal({ show, onHide, editing, onSaved, currentUserName }) {
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('details');
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title ?? '',
        description: editing.description ?? '',
        type: editing.type ?? 'Internal Task',
        priority: editing.priority ?? 'Medium',
        status: editing.status ?? 'Open',
        category: editing.category ?? '',
        contactId: editing.contactId ?? '',
        companyId: editing.companyId ?? '',
        projectId: editing.projectId ?? '',
        leadId: editing.leadId ?? '',
        assignedToUserId: editing.assignedToUserId ?? '',
        assignedToName: editing.assignedToName ?? '',
        dueDate: editing.dueDate ? editing.dueDate.split('T')[0] : '',
      });
      setComments(editing.comments ?? []);
    } else {
      setForm(emptyForm);
      setComments([]);
    }
    setTab('details');
    setCommentText('');
  }, [editing, show]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    const payload = {
      ...form,
      contactId: form.contactId ? parseInt(form.contactId) : null,
      companyId: form.companyId ? parseInt(form.companyId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      leadId: form.leadId ? parseInt(form.leadId) : null,
      assignedToUserId: form.assignedToUserId ? parseInt(form.assignedToUserId) : null,
      dueDate: form.dueDate || null,
    };
    onSaved(payload);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !editing) return;
    setSubmittingComment(true);
    try {
      const newComment = await ticketService.addComment(editing.id, {
        comment: commentText,
        isInternal,
        authorName: currentUserName ?? 'Me',
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <div>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 700 }}>
            {editing ? editing.ticketNumber : 'New Ticket'}
          </Modal.Title>
          {editing?.isAiGenerated && (
            <span className="ai-badge" style={{ fontSize: 10.5, marginTop: 4, display: 'inline-flex' }}>
              <Sparkles size={10} />AI Generated · {Math.round((editing.aiConfidence ?? 0) * 100)}%
            </span>
          )}
        </div>
      </Modal.Header>

      <Tab.Container activeKey={tab} onSelect={setTab}>
        <Modal.Body style={{ padding: 0 }}>
          <Nav variant="tabs" style={{ padding: '0 20px', borderBottom: '1px solid #E1E8F4', background: '#F8FAFC' }}>
            <Nav.Item><Nav.Link eventKey="details" style={{ fontSize: 13 }}>Details</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="comments" style={{ fontSize: 13 }}>Comments {comments.length > 0 ? `(${comments.length})` : ''}</Nav.Link></Nav.Item>
            {editing && <Nav.Item><Nav.Link eventKey="history" style={{ fontSize: 13 }}>History</Nav.Link></Nav.Item>}
          </Nav>

          <div style={{ padding: 20 }}>
            <Tab.Content>
              {/* Details Tab */}
              <Tab.Pane eventKey="details">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Title *</Form.Label>
                  <Form.Control className="glass-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief description of the issue" />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Type</Form.Label>
                    <Form.Select className="glass-input" value={form.type} onChange={e => set('type', e.target.value)}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Priority</Form.Label>
                    <Form.Select className="glass-input" value={form.priority} onChange={e => set('priority', e.target.value)}
                      style={{ borderLeft: `3px solid ${PRIORITY_COLOR[form.priority]}` }}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Status</Form.Label>
                    <Form.Select className="glass-input" value={form.status} onChange={e => set('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </Form.Select>
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Category</Form.Label>
                    <Form.Select className="glass-input" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">— None —</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Due Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
                  </div>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Description</Form.Label>
                  <Form.Control as="textarea" rows={4} className="glass-input" value={form.description} onChange={e => set('description', e.target.value)} />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Assigned To</Form.Label>
                    <Form.Control className="glass-input" value={form.assignedToName} onChange={e => set('assignedToName', e.target.value)} placeholder="Name" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Contact ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.contactId} onChange={e => set('contactId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Company ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.companyId} onChange={e => set('companyId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Project ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.projectId} onChange={e => set('projectId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Lead ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.leadId} onChange={e => set('leadId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
              </Tab.Pane>

              {/* Comments Tab */}
              <Tab.Pane eventKey="comments">
                <div className="comment-thread mb-3">
                  {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px 0', fontSize: 13 }}>No comments yet.</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className={`comment-item ${c.isInternal ? 'internal' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="comment-author">{c.authorName}</span>
                            {c.isInternal && <span className="comment-internal-label"><Lock size={9} /> Internal</span>}
                          </div>
                          <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="comment-body">{c.comment}</div>
                      </div>
                    ))
                  )}
                </div>

                {editing && (
                  <div style={{ borderTop: '1px solid #E1E8F4', paddingTop: 12 }}>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className="glass-input mb-2"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Add a comment…"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Form.Check
                        type="switch"
                        id="internal-switch"
                        label={<span style={{ fontSize: 12 }}>Internal note</span>}
                        checked={isInternal}
                        onChange={e => setIsInternal(e.target.checked)}
                      />
                      <button
                        className="pt-action-btn pt-action-primary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                        onClick={handleAddComment}
                        disabled={submittingComment || !commentText.trim()}
                      >
                        <Send size={12} style={{ marginRight: 4 }} />
                        {submittingComment ? 'Sending…' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </Tab.Pane>

              {/* History Tab */}
              {editing && (
                <Tab.Pane eventKey="history">
                  <AuditPanel entityName="Ticket" entityId={editing?.id} />
                </Tab.Pane>
              )}
            </Tab.Content>
          </div>
        </Modal.Body>
      </Tab.Container>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={handleSave} style={{ background: '#4361EE', border: 'none' }}>
          {editing ? 'Save Changes' : 'Create Ticket'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Tickets/TicketModal.jsx
git commit -m "feat(tickets): add TicketModal with Details/Comments/History tabs"
```

---

### Task 12: Create `Tickets.jsx` page

**Files:**
- Create: `src/pages/Tickets/Tickets.jsx`

- [ ] **Step 1: Create the page**

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { ticketService } from '../../services/ticketService';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import { Plus, Sparkles, LayoutList, Columns, AlertCircle, Clock, CheckCircle, Zap } from 'lucide-react';
import { FaPen, FaTrash } from 'react-icons/fa6';
import TicketModal from './TicketModal';
import AITicketModal from './AITicketModal';
import './Tickets.css';

const PRIORITY_BADGE = { Critical: 'tpb-critical', High: 'tpb-high', Medium: 'tpb-medium', Low: 'tpb-low' };
const TYPE_BADGE = { 'Client Support': 'ttb-client', 'Bug': 'ttb-bug', 'Internal Task': 'ttb-internal' };
const KANBAN_COLS = ['Open', 'In Progress', 'Pending', 'Resolved'];

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([ticketService.getAll(), ticketService.getStats()]);
      setTickets(data);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = tickets;
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.ticketNumber.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) list = list.filter(t => t.type === typeFilter);
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter);
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    setFiltered(list);
  }, [tickets, search, typeFilter, priorityFilter, statusFilter]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setShowModal(true); };

  const handleSaved = async (payload) => {
    try {
      if (editing) { await ticketService.update(editing.id, payload); }
      else { await ticketService.create(payload); }
      setShowModal(false);
      load();
    } catch (e) { alert(e.message); }
  };

  const handleAiConfirm = async (payload) => {
    try {
      await ticketService.create(payload);
      load();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try { await ticketService.delete(id); setTickets(prev => prev.filter(t => t.id !== id)); }
    catch (e) { alert(e.message); }
  };

  const statCards = stats ? [
    { label: 'Open', value: stats.open, icon: <AlertCircle size={18} />, color: '#4361EE' },
    { label: 'In Progress', value: stats.inProgress, icon: <Clock size={18} />, color: '#F59E0B' },
    { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={18} />, color: '#10B981' },
    { label: 'Critical', value: stats.critical, icon: <Zap size={18} />, color: '#F43F5E' },
  ] : [];

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{s.label}</span>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <PageToolbar
        title="Tickets"
        itemCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tickets…"
        extraControls={
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {['Client Support', 'Bug', 'Internal Task'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        }
        views={[
          { icon: <LayoutList size={15} />, key: 'list' },
          { icon: <Columns size={15} />, key: 'kanban' },
        ]}
        currentView={view}
        onViewChange={setView}
        actions={[
          { label: 'AI Generate', icon: <Sparkles size={16} />, variant: 'purple', onClick: () => setShowAiModal(true) },
          { label: 'New Ticket', icon: <Plus size={16} />, variant: 'primary', onClick: openCreate },
        ]}
      />

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
      ) : view === 'list' ? (
        /* List View */
        <div style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E1E8F4' }}>
              <tr>
                {['Ticket #', 'Title', 'Type', 'Priority', 'Status', 'Assigned', 'Due Date', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-5 text-muted">No tickets found.</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => openEdit(t)}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: '#4361EE', fontFamily: 'monospace', fontSize: 12 }}>{t.ticketNumber}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0F172A', maxWidth: 280 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    {t.isAiGenerated && <span className="ai-badge" style={{ marginTop: 3, display: 'inline-flex' }}><Sparkles size={9} />AI</span>}
                  </td>
                  <td style={{ padding: '10px 16px' }}><span className={`ticket-type-badge ${TYPE_BADGE[t.type] ?? ''}`}>{t.type}</span></td>
                  <td style={{ padding: '10px 16px' }}><span className={`ticket-priority-badge ${PRIORITY_BADGE[t.priority] ?? ''}`}><span className={`ticket-priority-dot priority-${t.priority.toLowerCase()}`} />{t.priority}</span></td>
                  <td style={{ padding: '10px 16px' }}><span className="badge-enterprise">{t.status}</span></td>
                  <td style={{ padding: '10px 16px', color: '#64748B' }}>{t.assignedToName ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#64748B' }}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, opacity: 0 }} className="row-actions">
                      <button className="action-icon-btn text-info" title="Edit" onClick={() => openEdit(t)}><FaPen size={12} /></button>
                      <button className="action-icon-btn text-danger" title="Delete" onClick={() => handleDelete(t.id)}><FaTrash size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="ticket-kanban">
          {KANBAN_COLS.map(col => {
            const colTickets = filtered.filter(t => t.status === col);
            return (
              <div key={col} className="kanban-col">
                <div className="kanban-col-header">
                  <span className="kanban-col-title">{col}</span>
                  <span className="kanban-count">{colTickets.length}</span>
                </div>
                {colTickets.map(t => (
                  <div key={t.id} className="kanban-card" onClick={() => openEdit(t)}>
                    <div className="kanban-card-number">{t.ticketNumber}</div>
                    <div className="kanban-card-title">{t.title}</div>
                    <div className="kanban-card-footer">
                      <span className={`ticket-priority-badge ${PRIORITY_BADGE[t.priority] ?? ''}`} style={{ fontSize: 10 }}>
                        <span className={`ticket-priority-dot priority-${t.priority.toLowerCase()}`} />{t.priority}
                      </span>
                      {t.isAiGenerated && <span className="ai-badge" style={{ fontSize: 10 }}><Sparkles size={9} />AI</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <TicketModal show={showModal} onHide={() => setShowModal(false)} editing={editing} onSaved={handleSaved} />
      <AITicketModal show={showAiModal} onHide={() => setShowAiModal(false)} onConfirm={handleAiConfirm} />
      <style>{`tr:hover .row-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Tickets/Tickets.jsx
git commit -m "feat(tickets): add Tickets.jsx page with list/kanban view, AI generate button"
```

---

### Task 13: Wire routing and nav

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/layouts/MainLayout.jsx`

- [ ] **Step 1: Add route in `App.jsx`**

```jsx
import Tickets from './pages/Tickets/Tickets';
// ...
<Route path="/tickets" element={<Tickets />} />
```

- [ ] **Step 2: Add nav entry in `MainLayout.jsx`**

Find where the Leads and Calendar nav items are. Add Tickets between them:

```jsx
// Look for the Leads nav item, add right after it:
{ path: '/tickets', label: 'Tickets', icon: <TicketIcon /> }
// or in JSX nav list:
<NavLink to="/tickets">Tickets</NavLink>
```

Use whatever icon library is already in use for the nav (Lucide `Ticket` or `LifeBuoy`).

- [ ] **Step 3: Test end-to-end**

```bash
cd frontend && npm run dev
```

1. Navigate to `/tickets` — stats and empty list appear
2. Click "New Ticket", fill in Title + Type + Priority, save — appears in list
3. Click "AI Generate", paste an email-style text like: `"Hi, our payment gateway is down and customers can't check out. This is urgent! - John from Acme Corp"`, click Analyze — verify AI fills in Priority=Critical, Type=Client Support
4. Confirm the AI ticket — appears with AI badge in list
5. Click a ticket, go to History tab — confirm audit entries appear
6. Switch to Kanban view — cards appear in correct columns

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/layouts/MainLayout.jsx
git commit -m "feat(tickets): wire Tickets route and nav entry"
```

---

### Phase 3 Complete

Tickets Module is fully operational with AI generation. Proceed to Phase 4 (Invoice Restructure).
