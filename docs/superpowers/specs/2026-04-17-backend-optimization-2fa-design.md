# Design: Backend Performance Optimization + OTP/2FA Authentication

**Date:** 2026-04-17  
**Project:** A365 CRM (A365ShiftTracker)  
**Status:** Approved

---

## Overview

Two goals in one plan:
1. Fix all backend and frontend performance bottlenecks causing slow page loads across all modules.
2. Add secure two-factor authentication (email OTP + optional TOTP authenticator app) with per-user admin control.

---

## Part 1 — Backend Performance

### 1.1 Pagination

**Problem:** Every `GetAll` endpoint loads the entire table into memory. With hundreds or thousands of records this is the primary cause of slow loads.

**Fix:** Add a `PagedResult<T>` generic wrapper and a `GetPagedAsync` method to `IRepository<T>`. All list endpoints accept `?page=1&pageSize=25` query params. Filtering and pagination happen at the database level using `.Skip().Take()` — never in memory.

```csharp
public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
```

**Affected endpoints:** Contacts, Projects, Leads, Tasks, Timesheet, Finance (Expenses + Incomes), Companies, Invoices, LegalAgreements, Tickets, ActivityLogs, AuditLogs, Notifications.

**Default page size:** 25. Max allowed: 100.

### 1.2 AsNoTracking on All Read Queries

**Problem:** `Repository.FindAsync` and `Repository.Query()` do not use `AsNoTracking()`. EF Core tracks every returned entity for change detection — CPU and memory overhead with no benefit for read-only operations.

**Fix:** Add `.AsNoTracking()` to `FindAsync` and expose a `QueryNoTracking()` method. Write operations (Add/Update/Delete) continue using tracked queries.

### 1.3 Response Compression

**Problem:** No compression configured. Large JSON payloads (contact lists, project lists) are sent uncompressed.

**Fix:** Add Brotli + GZip response compression in `Program.cs`:

```csharp
builder.Services.AddResponseCompression(opts => {
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.Providers.Add<GzipCompressionProvider>();
});
app.UseResponseCompression(); // before UseCors
```

Expected payload reduction: 60–80% for JSON list responses.

### 1.4 In-Memory Caching

**Problem:** Role + permission joins run on every login (expensive N+1 chain: UserRoles → Role → RolePermissions → Permission). Column configs are re-fetched from DB on every page load.

**Fix:** Add `IMemoryCache` to DI. Cache with the following TTLs:

| Data | TTL | Invalidation trigger |
|------|-----|----------------------|
| User role + permissions | 5 min | User role change / login |
| Contact column config | 10 min | Column save/update/delete |
| Task column config | 10 min | Column save/update/delete |
| Timesheet column config | 10 min | Column save/update/delete |

Cache key pattern: `"permissions:{userId}"`, `"columns:contact"`, etc.

### 1.5 Fix Double SaveChangesAsync in Audit Logging

**Problem:** `AppDbContext.SaveChangesAsync` calls `base.SaveChangesAsync` twice — once for the business record, once for audit entries. Every write operation costs 2 round-trips to the database.

**Fix:** Resolve `EntityId` for new records immediately after the first `base.SaveChangesAsync` (EF populates `.Entity.Id` after save), then add audit entries and call `base.SaveChangesAsync` once more — this is already the current structure but can be optimized by batching all audit entries and doing a single second save rather than per-entity saves.

Additionally, audit logging for **read-only** data (columns, cached lookups) is skipped.

---

## Part 2 — Two-Factor Authentication

### 2.1 User Entity Changes

New fields added to `User` entity via a single EF Core migration:

```csharp
// Email OTP
public string? OtpCode { get; set; }        // BCrypt-hashed 6-digit code
public DateTime? OtpExpiry { get; set; }    // 5-minute expiry

// TOTP Authenticator App
public string? TotpSecret { get; set; }     // AES-encrypted Base32 secret
public bool IsTotpEnabled { get; set; } = false;

// Admin 2FA control
public bool TwoFactorRequired { get; set; } = false;
public string TwoFactorMethod { get; set; } = "email"; // "email" | "totp"
```

### 2.2 Login Flow (Two-Step)

#### Step 1 — Password Verification (`POST /api/auth/login`)

- Validates email + password (unchanged behavior)
- **If `TwoFactorRequired = false`**: issues full JWT `auth_token` cookie immediately (existing behavior, no change for users without 2FA)
- **If `TwoFactorRequired = true`**: issues a short-lived **partial JWT** (5-min expiry, claim `"2fa_pending": "true"`) stored in a separate `auth_partial` cookie. Returns `{ requires2FA: true, method: "email"|"totp" }` — no `auth_token` cookie set yet.

#### Step 2A — Email OTP (`POST /api/auth/send-otp`)

- Requires valid `auth_partial` cookie
- Generates a cryptographically random 6-digit code
- Hashes with BCrypt, stores in `User.OtpCode` + `User.OtpExpiry = UtcNow + 5 min`
- Sends HTML email via MailKit SMTP with the code
- Returns `{ sent: true }` — code never returned in response

#### Step 2B — Verify Email OTP (`POST /api/auth/verify-otp`)

- Requires valid `auth_partial` cookie + `{ code: "123456" }` body
- Validates BCrypt hash + expiry
- On success: clears `OtpCode`/`OtpExpiry`, deletes `auth_partial` cookie, sets full `auth_token` cookie
- On failure: returns 401. Attempt count is encoded in the `auth_partial` JWT claim `"2fa_attempts"`. After 5 failed attempts the partial token is rejected and the user must restart login from Step 1.

#### Step 2C — Verify TOTP (`POST /api/auth/verify-totp`)

- Requires valid `auth_partial` cookie + `{ code: "123456" }` body
- Validates against `User.TotpSecret` using **OtpNet** library (30-second window, ±1 window tolerance for clock skew)
- On success: deletes `auth_partial` cookie, sets full `auth_token` cookie

### 2.3 TOTP Setup Flow

Users who opt in to TOTP go through a one-time setup in Settings:

```
GET  /api/auth/totp/setup         → generates secret, returns { qrCodeUri, secret, issuer }
POST /api/auth/totp/verify-setup  → { code } — confirms setup, enables TOTP
POST /api/auth/totp/disable       → disables TOTP (requires current password confirmation)
```

- Secret generated using `OtpNet.KeyGeneration.GenerateRandomKey()`
- `qrCodeUri` is an `otpauth://totp/...` URI — frontend renders it as a QR image using the `qrcode` npm package
- Secret stored AES-encrypted in `User.TotpSecret`
- `IsTotpEnabled = true` only after successful `verify-setup`

### 2.4 Admin 2FA Management

New endpoints under the existing `/api/admin` controller:

```
POST   /api/admin/users/{id}/2fa          → { required: true, method: "email"|"totp" }
DELETE /api/admin/users/{id}/2fa          → disables 2FA requirement for user
GET    /api/admin/users                   → response includes twoFactorRequired, isTotpEnabled fields
```

Admin view in the Admin panel shows a 2FA status column per user with a toggle.

### 2.5 SMTP Email Service

New `IEmailService` interface in Application layer (stays decoupled from infrastructure):

```csharp
public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string displayName, string code);
}
```

`SmtpEmailService` implements it using **MailKit**. Configuration in `appsettings.json`:

```json
"Smtp": {
  "Host": "smtp.gmail.com",
  "Port": 587,
  "EnableSsl": true,
  "Username": "your@gmail.com",
  "Password": "your-app-password",
  "FromName": "A365 CRM",
  "FromEmail": "your@gmail.com"
}
```

OTP email is HTML-formatted: shows the 6-digit code prominently, states it expires in 5 minutes.

---

## Part 3 — Frontend Performance

### 3.1 TanStack Query (React Query v5)

Install `@tanstack/react-query`. Wrap `App.jsx` in `<QueryClientProvider>`. Replace `useEffect + useState` data-fetching patterns with `useQuery` hooks throughout all list pages.

Benefits:
- Automatic client-side caching — second visit to any list page is instant
- Background refetch (stale-while-revalidate)
- Request deduplication — one network call even if multiple components need the same data
- Built-in loading/error states

Cache TTLs per module:
- Contacts, Projects, Leads, Tasks: `staleTime: 2 * 60 * 1000` (2 min)
- Finance, Timesheet, Invoices: `staleTime: 60 * 1000` (1 min)
- Column configs, Tags, Email templates: `staleTime: 10 * 60 * 1000` (10 min)

Mutations (`useQuery` → `useMutation`) handle create/update/delete and automatically invalidate the relevant query cache keys.

### 3.2 Route-Based Code Splitting

All page imports in `App.jsx` converted to `React.lazy()`. Heavy libraries (Recharts, Framer Motion, jsPDF, xlsx) are only downloaded when the user visits the page that needs them.

```jsx
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Contacts  = lazy(() => import('./pages/Contact/Contacts'));
// ... all routes
```

Single `<Suspense fallback={<PageSkeleton />}>` wrapper. `PageSkeleton` is a lightweight shimmer/spinner component matching the existing design system.

### 3.3 Pagination UI

Shared `<Pagination>` component added to `src/components/Pagination/`:
- Shows: `← Prev | Page 3 of 12 | Next →`
- Page size selector: 25 / 50 / 100
- Current page stored in URL query param `?page=1` (browser back/forward works)
- Styling matches existing design system (`#4361EE` primary, existing button/card patterns)

All list views receive this component below the list table/cards.

### 3.4 Login Page 2FA UI

The existing login page gains a two-step flow:

**Step 1 (unchanged):** Email + password form.

**Step 2 (new — only shown when `requires2FA: true`):** Slides in smoothly using Framer Motion:
- **Email OTP:** "We sent a 6-digit code to your email." + 6-box digit input + "Resend code" button (60-second cooldown timer)
- **TOTP:** "Enter the 6-digit code from your authenticator app." + single 6-digit input

**TOTP Setup (Settings page):**
- New "Security" tab in Settings
- Shows current 2FA status
- "Enable Authenticator App" button → shows QR code + manual entry secret + verification input
- "Disable" button with password confirmation

---

## Libraries Added

### Backend (NuGet)
| Package | Purpose |
|---------|---------|
| `MailKit` | SMTP email sending |
| `OtpNet` | TOTP code generation + validation |
| `Microsoft.Extensions.Caching.Memory` | IMemoryCache (already in SDK, just register) |

### Frontend (npm)
| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Data fetching + caching |
| `qrcode` | Render TOTP QR codes |

---

## Migration Summary

One new EF Core migration: `AddTwoFactorAuthFields`
- Adds `otp_code`, `otp_expiry`, `totp_secret`, `is_totp_enabled`, `two_factor_required`, `two_factor_method` columns to `users` table

---

## Out of Scope

- Redis / distributed caching (deferred — not needed at current scale)
- SMS OTP (SMTP email only)
- WebSocket / real-time push notifications
- Audit log archiving / pruning strategy
