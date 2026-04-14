# Design Spec: Tickets, Audit, Invoice Restructure, Legal Module
**Date:** 2026-04-14  
**Project:** A365 CRM  
**Stack:** React 19 + Vite + Tailwind + Bootstrap (frontend) · ASP.NET Core + EF Core + SQL Server (backend)  
**Implementation order:** Audit → Legal → Tickets → Invoice Restructure

---

## Overview

Four independent features built sequentially so the Audit infrastructure is in place before new entities (Legal, Tickets) are created.

| Feature | Type | Risk |
|---------|------|------|
| Audit System | Base layer — touches all entities | High (DB migration + EF interceptor) |
| Legal Module | Net-new module | Low |
| Tickets Module | Net-new module + AI integration | Medium |
| Invoice Restructure | Refactor + new entity | Medium |

---

## 1. Audit System (Base Layer)

### Goal
Enterprise-grade change tracking: know **who** changed **what field**, **from what value**, **to what value**, and **when** — on any record in the system.

### Backend

#### 1.1 Extend `AuditableEntity`
File: `A365ShiftTracker.Domain/Common/BaseEntity.cs`

Add to `AuditableEntity`:
```csharp
public int? CreatedByUserId { get; set; }
public int? UpdatedByUserId { get; set; }
public string? CreatedByName { get; set; }   // denormalized for display speed
public string? UpdatedByName { get; set; }
```

All entities that extend `AuditableEntity` inherit these fields automatically:
Contact, Lead, Company, Project, Expense, Income, TimesheetEntry, Task, Document, EmailTemplate, ActivityLog.

**Entities to upgrade from `BaseEntity` → `AuditableEntity`** (currently missing audit fields):
`ProjectFinance`, `Milestone`, `Stakeholder`, `Charge` — upgrade as part of Phase 1 so all financial records get full audit coverage from day one.

#### 1.2 New `AuditLog` Entity
File: `A365ShiftTracker.Domain/Entities/AuditLog.cs`

```csharp
public class AuditLog : BaseEntity
{
    public string EntityName { get; set; }      // "Contact", "Lead", "LegalAgreement", etc.
    public int EntityId { get; set; }
    public string FieldName { get; set; }        // "Status", "DealValue", etc.
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Action { get; set; }           // "Created" | "Updated" | "Deleted"
    public int ChangedByUserId { get; set; }
    public string ChangedByName { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}
```

`AuditLog` is **append-only** — no Update or Delete endpoints.

#### 1.3 EF Core `AuditInterceptor`
File: `A365ShiftTracker.Infrastructure/Data/AuditInterceptor.cs`

- Implements `SaveChangesInterceptor`
- On `SavingChangesAsync`, inspects `ChangeTracker.Entries()` for Added/Modified/Deleted entities
- For each `AuditableEntity`: stamps `UpdatedByUserId` / `UpdatedByName` from the current user (via `ICurrentUserService`)
- For each changed property: writes one `AuditLog` row per field change
- Skips audit-exempt fields: `UpdatedAt`, `UpdatedByUserId`, `UpdatedByName`
- Registered in `DependencyInjection.cs`

#### 1.4 `ICurrentUserService`
File: `A365ShiftTracker.Application/Common/ICurrentUserService.cs`

```csharp
public interface ICurrentUserService
{
    int? UserId { get; }
    string? UserName { get; }
    string? IpAddress { get; }
}
```

Implemented in `A365ShiftTracker.Infrastructure/Helpers/CurrentUserService.cs` — reads from `IHttpContextAccessor`.

#### 1.5 `AuditLogsController`
```
GET  /api/audit-logs?entityName=Contact&entityId=42    → paginated change history
```
Returns: `[{ fieldName, oldValue, newValue, action, changedByName, changedAt, ipAddress }]`

#### 1.6 DB Migration
New migration: `AddAuditFieldsAndAuditLogTable`
- Adds 4 columns to all `AuditableEntity` tables
- Creates `AuditLogs` table

### Frontend

#### 1.7 `<AuditPanel>` Component
File: `src/components/AuditPanel/AuditPanel.jsx`

Props: `entityName: string`, `entityId: number`

Renders a collapsible "History" timeline tab showing:
- Action icon (Created / Updated / Deleted)
- Field name + old value → new value
- Changed by (name) · timestamp (relative + absolute on hover)
- IP address (admin-only visible)

Plugged into: Contact modal, Lead modal, Company modal, Project detail, LegalModal, TicketModal (all as a "History" tab).

Uses the `slv-action-icon` + `badge-enterprise` design system classes.

---

## 2. Legal Module

### Goal
Track MSA, NDA, SOW, and Internal Approval agreements through their full lifecycle with renewal alerts and CRM entity linking.

### Backend

#### 2.1 `LegalAgreement` Entity
File: `A365ShiftTracker.Domain/Entities/LegalAgreement.cs`

```csharp
public class LegalAgreement : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;      // "MSA"|"NDA"|"SOW"|"Internal Approval"
    public string Status { get; set; } = "Draft";          // "Draft"|"Under Review"|"Approved"|"Signed"|"Expired"|"Terminated"
    public string? Version { get; set; }                   // "v1.0"
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
    public int? RenewalNoticeDays { get; set; }            // alert X days before expiry

    // Document
    public string? FileUrl { get; set; }                   // Cloudinary
    public string? FileName { get; set; }
    public string? Notes { get; set; }
}
```

#### 2.2 `LegalAgreementsController`
```
GET    /api/legal-agreements                          → all (filtered by userId)
GET    /api/legal-agreements/{id}
POST   /api/legal-agreements
PUT    /api/legal-agreements/{id}
DELETE /api/legal-agreements/{id}
GET    /api/legal-agreements/expiring-soon            → expiring within RenewalNoticeDays window
```

#### 2.3 DB Migration
`AddLegalAgreementsTable`

### Frontend

#### 2.4 `legalService.js`
File: `src/services/legalService.js`  
Pattern: mirrors `leadService.js`.

#### 2.5 Legal Page
File: `src/pages/Legal/Legal.jsx`  
Route: `/legal` (replaces `PlaceholderPage` in `App.jsx`)

Layout:
- `StatsGrid` — Total Agreements · Active (Signed) · Expiring Soon · Drafts
- `PageToolbar` — search, filter by Type + Status, sort, `+ New Agreement` action button
- `StandardListView` columns: Title · Type · Status · Counter-party · Effective Date · Expiry Date · actions

Status lifecycle badges using `badge-enterprise` classes:
```
Draft (gray) → Under Review (blue) → Approved (amber) → Signed (green) → Expired (rose) | Terminated (gray)
```

#### 2.6 `<LegalModal>`
File: `src/pages/Legal/LegalModal.jsx`

Tabs: **Details** · **Parties & Dates** · **Document** · **History** (AuditPanel)

Fields:
- Title, Type (MSA/NDA/SOW/Internal Approval), Version, Status
- Contact / Company / Project / Lead pickers (all optional)
- OurSignatory, CounterSignatory
- EffectiveDate, ExpiryDate, SignedDate
- AutoRenew toggle + RenewalNoticeDays input
- File upload (Cloudinary — same `storageService` pattern)
- Notes

#### 2.7 Expiry Notifications
On app load (`MainLayout.jsx`), call `GET /api/legal-agreements/expiring-soon`.  
For each result, push a notification via the existing `NotificationBell` component.  
Format: *"NDA with Acme Corp expires in 12 days"*

---

## 3. Tickets Module

### Goal
Unified helpdesk + internal task tracker with AI auto-generation from raw text (emails, logs, conversation snippets). Linked to the full CRM graph.

### Backend

#### 3.1 `Ticket` Entity
File: `A365ShiftTracker.Domain/Entities/Ticket.cs`

```csharp
public class Ticket : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;  // "TKT-2026-0001"
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Internal Task";       // "Client Support"|"Bug"|"Internal Task"
    public string Priority { get; set; } = "Medium";          // "Critical"|"High"|"Medium"|"Low"
    public string Status { get; set; } = "Open";              // "Open"|"In Progress"|"Pending"|"Resolved"|"Closed"
    public string? Category { get; set; }                     // "Billing"|"Technical"|"Feature Request"|etc.

    // CRM Links
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? LeadId { get; set; }

    // Assignment
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }

    // SLA / Timeline
    public DateTime? DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    // AI metadata
    public bool IsAiGenerated { get; set; } = false;
    public string? AiSource { get; set; }                     // "Email"|"ActivityLog"
    public decimal? AiConfidence { get; set; }                // 0.0 – 1.0
    public string? AiRawInput { get; set; }                   // source text parsed by AI

    // Navigation
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
}
```

#### 3.2 `TicketComment` Entity
File: `A365ShiftTracker.Domain/Entities/TicketComment.cs`

```csharp
public class TicketComment : BaseEntity
{
    public int TicketId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;             // internal note vs client-visible
    public int AuthorUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Ticket Ticket { get; set; } = null!;
}
```

#### 3.3 `TicketsController`
```
GET    /api/tickets                                   → all (filtered by userId)
GET    /api/tickets/{id}                              → with comments
POST   /api/tickets
PUT    /api/tickets/{id}
DELETE /api/tickets/{id}
GET    /api/tickets/stats                             → counts by status + priority
POST   /api/tickets/ai-generate                       → { rawText } → suggested ticket fields
GET    /api/tickets/{id}/comments
POST   /api/tickets/{id}/comments
```

Auto-number logic: `TKT-{YYYY}-{userId-scoped sequential padded to 4 digits}` generated server-side on create.

#### 3.4 AI Generation — `TicketAiService`
File: `A365ShiftTracker.Application/Services/TicketAiService.cs`

- Accepts raw text input
- Calls Claude API (`claude-sonnet-4-6`) with a structured system prompt:
  - Classify Type (Client Support / Bug / Internal Task)
  - Suggest Priority (Critical / High / Medium / Low) based on urgency language
  - Extract Title (concise summary)
  - Extract Description (cleaned body)
  - Identify referenced Contact name / Company name (fuzzy matched against DB)
  - Return `AiConfidence` (0.0–1.0)
- Returns JSON response; controller maps to ticket fields

#### 3.5 DB Migration
`AddTicketsAndTicketCommentsTable`

### Frontend

#### 3.6 `ticketService.js`
File: `src/services/ticketService.js`  
Pattern: mirrors `leadService.js` + `POST ai-generate` method.

#### 3.7 Tickets Page
File: `src/pages/Tickets/Tickets.jsx`  
Route: `/tickets` (new nav entry)

Layout:
- `StatsGrid` — Open · In Progress · Resolved Today · Overdue
- `PageToolbar` — search, filter by Type + Priority + Status, sort, `+ New Ticket` + `✨ AI Generate` action buttons
- View modes: **List** (StandardListView) · **Kanban** (columns: Open → In Progress → Pending → Resolved)

List columns: Ticket No. · Title · Type · Priority · Linked To · Assigned · Due Date · Status

Priority color system:
- Critical → `#F43F5E`
- High → `#F59E0B`
- Medium → `#4361EE`
- Low → `#64748B`

#### 3.8 `<TicketModal>`
File: `src/pages/Tickets/TicketModal.jsx`

Tabs: **Details** · **Comments** · **History** (AuditPanel)

Fields:
- TicketNumber (read-only, auto-generated)
- Title, Type, Priority, Category, Status
- Description (textarea)
- CRM link pickers: Contact, Company, Project, Lead (all optional)
- Assigned To (user picker)
- Due Date
- AI badge (`✨ AI Generated` + confidence %) shown when `IsAiGenerated = true`

Comments section (inside Comments tab):
- Thread of comments with Internal / Client-visible toggle
- Add comment textarea + submit

#### 3.9 `<AITicketModal>`
File: `src/pages/Tickets/AITicketModal.jsx`

3-step flow:
1. **Input** — paste raw text (email body, log snippet, conversation)
2. **Preview** — AI returns prefilled ticket fields; user reviews/edits; confidence score shown
3. **Confirm** — saves ticket with `IsAiGenerated = true`

#### 3.10 Nav Entry
Add "Tickets" to `MainLayout.jsx` nav sidebar (between Leads and Calendar).

---

## 4. Invoice Restructure

### Goal
Fix the mislabeled "Invoice" nav entry, split the 3000-line monolith into focused components, and introduce a proper `Invoice` entity triggered by milestone status changes.

### Backend

#### 4.1 `Invoice` Entity
File: `A365ShiftTracker.Domain/Entities/Invoice.cs`

```csharp
public class Invoice : AuditableEntity, IOwnedByUser
{
    public int UserId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;  // "INV-2026-0001"
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
    public string Status { get; set; } = "Draft";              // "Draft"|"Sent"|"Paid"|"Overdue"|"Cancelled"
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }

    // Navigation
    public ProjectFinance ProjectFinance { get; set; } = null!;
    public Milestone Milestone { get; set; } = null!;
}
```

#### 4.2 `InvoicesController`
```
GET    /api/invoices                                  → all (filtered by userId)
GET    /api/invoices/{id}
POST   /api/invoices                                  → manual create
PUT    /api/invoices/{id}                             → status update, notes
DELETE /api/invoices/{id}
GET    /api/invoices/by-project/{projectFinanceId}    → all invoices for a deal
```

#### 4.3 Auto-create Trigger
In `MilestonesController` (existing), when milestone `Status` is set to `"Invoiced"`:
- Auto-create an `Invoice` record with amounts derived from `ProjectFinance.DealValue` + `Charges`
- `InvoiceNumber` generated server-side: `INV-{YYYY}-{padded sequential}`

#### 4.4 DB Migration
`AddInvoicesTable`

### Frontend — File Split

#### 4.5 Component Decomposition
`src/pages/Invoice/ProjectTrackerComplete.jsx` (~3000 lines) →

```
src/pages/Invoice/
  Invoice.jsx                        ← orchestrator (state management + routing between views)
  components/
    DealDashboard.jsx                ← dashboard KPIs, charts, project table
    DealWizard.jsx                   ← wizard shell (4-step progress indicator)
    BusinessDetails.jsx              ← wizard step 1: deal info + contact picker
    StakeholderPanel.jsx             ← wizard step 2: stakeholder splits
    MilestonePanel.jsx               ← wizard step 3: milestone configuration
    ChargesPanel.jsx                 ← wizard step 4: tax/charge configuration
    InvoiceList.jsx                  ← invoice list within a deal (new)
    InvoiceCard.jsx                  ← single invoice row (new)
```

Each component owns its own local state. `Invoice.jsx` holds the top-level `view` state (`"dashboard"` | `"project-detail"`) and passes handlers down.

#### 4.6 Logic Fixes
Three bugs identified during review:

1. **Milestone percentage validation** — add a running sum indicator; show a warning badge if milestones do not sum to 100%
2. **Currency conversion caching** — move exchange rate fetch into a `useMemo` with a 1-hour `localStorage` cache key (`fx_rates_cache` + `fx_rates_timestamp`); prevents a network call on every render
3. **Inconsistent state/API coupling** — each extracted component calls its own API directly (no prop-drilling of raw data); `Invoice.jsx` holds project list and passes `projectId` down for detail views

#### 4.7 Nav Label Fix
`MainLayout.jsx`: rename nav entry from **"Invoice"** → **"Deal Finance"**.

#### 4.8 `InvoiceList` Component
Shown inside the deal detail view (after opening a project):
- Columns: Invoice No. · Milestone · Sub-total · Tax · Total · Status · Invoice Date · Due Date · actions
- Actions: View PDF (calls existing `generateInvoicePDF`) · Mark Paid · Cancel
- `Mark as Paid` → calls `PUT /api/invoices/{id}` with `{ status: "Paid" }` + updates milestone `PaidDate`
- Status badges: `Draft (gray) → Sent (blue) → Paid (green) | Overdue (red) | Cancelled (gray)`

---

## Shared Decisions

### API Pattern
All new controllers follow the existing pattern in `BaseApiController.cs`:
- Auth via JWT Bearer (existing middleware)
- Data isolation via `IOwnedByUser` + `userId` from token claims
- Response envelope: `{ success, data, message }`

### Service Pattern (Frontend)
All new services (`legalService.js`, `ticketService.js`) follow the `leadService.js` pattern using `apiClient` from `apiClient.js`.

### CSS Pattern
All new pages use:
- `StatsGrid` + `PageToolbar` + `StandardListView` (existing shared components)
- `action-icon-btn text-{color}` for row actions (standardized in this sprint)
- `badge-enterprise badge-{color}` for status/type badges
- `pt-action-btn pt-action-{variant}` for toolbar buttons

### Navigation
New entries added to `MainLayout.jsx`:
- **Tickets** — between Leads and Calendar
- **Deal Finance** — rename of current Invoice entry
- **Legal** — existing placeholder replaced

---

## Implementation Order (Approach A — Sequential)

```
Phase 1 — Audit Base Layer
  1.1  Extend AuditableEntity + add ICurrentUserService
  1.2  Add AuditLog entity + DB migration
  1.3  Implement AuditInterceptor (EF SaveChanges hook)
  1.4  AuditLogsController
  1.5  <AuditPanel> frontend component

Phase 2 — Legal Module
  2.1  LegalAgreement entity + DB migration
  2.2  LegalAgreementsController
  2.3  legalService.js
  2.4  Legal.jsx page + LegalModal.jsx
  2.5  Expiry notification hook in MainLayout

Phase 3 — Tickets Module
  3.1  Ticket + TicketComment entities + DB migration
  3.2  TicketsController + TicketAiService (Claude API)
  3.3  ticketService.js
  3.4  Tickets.jsx page + TicketModal.jsx + AITicketModal.jsx
  3.5  Nav entry

Phase 4 — Invoice Restructure
  4.1  Invoice entity + DB migration
  4.2  InvoicesController + auto-create trigger in MilestonesController
  4.3  Split ProjectTrackerComplete.jsx → component tree
  4.4  InvoiceList.jsx + InvoiceCard.jsx
  4.5  Logic fixes (milestone validation, currency caching)
  4.6  Nav rename: Invoice → Deal Finance
```
