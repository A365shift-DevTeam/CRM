# Security & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 15 identified security vulnerabilities and bugs across the backend (.NET 9) and frontend (React 19).

**Architecture:** Fixes are grouped by area: secrets management, auth hardening, backend data integrity, and frontend stability. Each task is self-contained and can be committed independently.

**Tech Stack:** C# / .NET 9 / ASP.NET Core, EF Core 9 (PostgreSQL), React 19 / Vite, Tailwind CSS

---

## File Map

### Backend — Modified
- `backend/A365ShiftTracker.API/appsettings.json` — replace real SMTP credentials with placeholders
- `backend/A365ShiftTracker.API/Program.cs` — add rate limiting, restrict CORS methods
- `backend/A365ShiftTracker.API/Controllers/AuthController.cs` — fix int.Parse → TryParse, fix reset-token response
- `backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs` — add [Required]/[EmailAddress]/[StringLength] attributes
- `backend/A365ShiftTracker.Application/Interfaces/IEmailService.cs` — add SendPasswordResetEmailAsync
- `backend/A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs` — add BeginTransactionAsync
- `backend/A365ShiftTracker.Application/Services/AuthService.cs` — fix registration transaction, fix exception swallow, send reset email
- `backend/A365ShiftTracker.API/Controllers/UploadController.cs` — sanitize folder parameter
- `backend/A365ShiftTracker.Infrastructure/Data/AppDbContext.cs` — add startup key validation, HasPrecision on decimal fields
- `backend/A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs` — implement BeginTransactionAsync
- `backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs` — add SendPasswordResetEmailAsync

### Frontend — Modified
- `frontend/src/App.jsx` — wrap with ErrorBoundary
- `frontend/src/pages/Dashboard/Dashboard.jsx` — add AbortController to data-fetch useEffect

### Frontend — Created
- `frontend/src/components/ErrorBoundary.jsx` — class component ErrorBoundary

---

## Task 1: Remove Hardcoded Secrets from appsettings.json

**Files:**
- Modify: `backend/A365ShiftTracker.API/appsettings.json`
- Modify: `.gitignore`

- [ ] **Step 1: Replace SMTP credentials with placeholder values in appsettings.json**

The real email address and app-password must not be in source control. Replace them with empty placeholders. The developer running the project must set real values via environment variables or `dotnet user-secrets`.

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "User ID=postgres;Password=postgres;Server=localhost;Port=5432;Database=a365shift_tracker;"
  },
  "Jwt": {
    "Key": "",
    "Issuer": "A365ShiftTracker",
    "Audience": "A365ShiftTrackerApp"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000"
    ]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "Encryption": {
    "Key": ""
  },
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": "587",
    "Username": "",
    "Password": "",
    "FromName": "A365 CRM",
    "FromEmail": ""
  },
  "App": {
    "FrontendBaseUrl": "http://localhost:5173"
  },
  "AllowedHosts": "*"
}
```

Note: Also removed `Include Error Detail=true;` from the connection string (exposes DB errors to clients).

- [ ] **Step 2: Add appsettings.Development.json to .gitignore**

Open `.gitignore` and add these lines at the bottom:

```
# Local developer secrets — never commit
appsettings.Development.json
appsettings.*.local.json
```

- [ ] **Step 3: Create a local secrets file for development (not committed)**

Create `backend/A365ShiftTracker.API/appsettings.Development.json` (this file must NOT be committed — it is covered by .gitignore above):

```json
{
  "Jwt": {
    "Key": "REPLACE_WITH_A_RANDOM_64_CHAR_SECRET_USE_pwgen_OR_openssl"
  },
  "Encryption": {
    "Key": "REPLACE_WITH_A_DIFFERENT_RANDOM_64_CHAR_SECRET"
  },
  "Smtp": {
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com"
  }
}
```

- [ ] **Step 4: Add startup validation to Program.cs that refuses to start if secrets are empty**

In `Program.cs`, add this block immediately after `var builder = WebApplication.CreateBuilder(args);`:

```csharp
// ─── Startup secret validation ─────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
var encKey = builder.Configuration["Encryption:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be set to a random secret of at least 32 characters. Use appsettings.Development.json or environment variables.");
if (string.IsNullOrWhiteSpace(encKey) || encKey.Length < 32)
    throw new InvalidOperationException("Encryption:Key must be set to a random secret of at least 32 characters. Use appsettings.Development.json or environment variables.");
```

- [ ] **Step 5: Commit**

```bash
git add backend/A365ShiftTracker.API/appsettings.json backend/A365ShiftTracker.API/Program.cs .gitignore
git commit -m "security: remove hardcoded secrets, add startup key validation"
```

---

## Task 2: Add Rate Limiting to Authentication Endpoints

**Files:**
- Modify: `backend/A365ShiftTracker.API/Program.cs`
- Modify: `backend/A365ShiftTracker.API/Controllers/AuthController.cs`

- [ ] **Step 1: Register rate limiting in Program.cs**

Add this block after the output caching registration (around line 90 in the original file):

```csharp
// ─── Rate Limiting ────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Auth endpoints: 10 requests per minute per IP
    options.AddSlidingWindowLimiter("AuthPolicy", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;
        opt.QueueLimit = 0;
    });
});
```

- [ ] **Step 2: Add UseRateLimiter to the middleware pipeline in Program.cs**

In the middleware pipeline section (after `app.UseResponseCompression();`), add:

```csharp
app.UseRateLimiter();
```

- [ ] **Step 3: Apply rate limiter policy to AuthController**

Open `AuthController.cs`. At the class level, add the attribute:

```csharp
using Microsoft.AspNetCore.RateLimiting;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("AuthPolicy")]
public class AuthController : ControllerBase
```

Authenticated endpoints (those marked `[Authorize]`) can be excluded since they require a valid token. Add `[DisableRateLimiting]` to the TOTP/OTP management endpoints that require an existing session:

```csharp
[HttpGet("totp/setup")]
[Authorize]
[DisableRateLimiting]
public async Task<ActionResult<ApiResponse<TotpSetupResponse>>> TotpSetup()

[HttpPost("totp/verify-setup")]
[Authorize]
[DisableRateLimiting]
public async Task<ActionResult<ApiResponse<bool>>> TotpVerifySetup(...)

[HttpPost("totp/disable")]
[Authorize]
[DisableRateLimiting]
public async Task<ActionResult<ApiResponse<bool>>> TotpDisable()

[HttpPost("email-otp/send-enable")]
[Authorize]
[DisableRateLimiting]
public async Task<ActionResult<ApiResponse<bool>>> EmailOtpSendEnable()

[HttpPost("email-otp/verify-enable")]
[Authorize]
[DisableRateLimiting]
public async Task<ActionResult<ApiResponse<bool>>> EmailOtpVerifyEnable(...)

[HttpPost("email-otp/disable")]
[Authorize]
[DisableRateLimiting]
public async Task<ActionResult<ApiResponse<bool>>> EmailOtpDisable()

[HttpPost("logout")]
[AllowAnonymous]
[DisableRateLimiting]
public IActionResult Logout()
```

- [ ] **Step 4: Commit**

```bash
git add backend/A365ShiftTracker.API/Program.cs backend/A365ShiftTracker.API/Controllers/AuthController.cs
git commit -m "security: add sliding-window rate limiting to auth endpoints"
```

---

## Task 3: Fix Password Reset — Stop Returning Token in API Response

The current `ForgotPassword` endpoint returns the raw reset token in the response body. The token must only travel via email. The email must also include a proper link.

**Files:**
- Modify: `backend/A365ShiftTracker.Application/Interfaces/IEmailService.cs`
- Modify: `backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs`
- Modify: `backend/A365ShiftTracker.Application/Services/AuthService.cs`
- Modify: `backend/A365ShiftTracker.API/Controllers/AuthController.cs`

- [ ] **Step 1: Add SendPasswordResetEmailAsync to IEmailService**

Replace the content of `IEmailService.cs`:

```csharp
namespace A365ShiftTracker.Application.Interfaces;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string displayName, string code);
    Task SendPasswordResetEmailAsync(string toEmail, string displayName, string resetLink);
}
```

- [ ] **Step 2: Implement SendPasswordResetEmailAsync in SmtpEmailService**

Open `backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs`. Find the class and add the method. (Read the file first to find the exact structure, then add after `SendOtpEmailAsync`.)

The implementation follows the exact same pattern as `SendOtpEmailAsync` — using MailKit to send a message. Add this method to the class:

```csharp
public async Task SendPasswordResetEmailAsync(string toEmail, string displayName, string resetLink)
{
    var message = new MimeKit.MimeMessage();
    message.From.Add(new MimeKit.MailboxAddress(_fromName, _fromEmail));
    message.To.Add(new MimeKit.MailboxAddress(displayName, toEmail));
    message.Subject = "Reset your A365 CRM password";
    message.Body = new MimeKit.TextPart("html")
    {
        Text = $@"
            <p>Hi {System.Net.WebUtility.HtmlEncode(displayName)},</p>
            <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
            <p><a href=""{System.Net.WebUtility.HtmlEncode(resetLink)}"">Reset Password</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>"
    };
    using var client = new MailKit.Net.Smtp.SmtpClient();
    await client.ConnectAsync(_host, _port, MailKit.Security.SecureSocketOptions.StartTls);
    await client.AuthenticateAsync(_username, _password);
    await client.SendAsync(message);
    await client.DisconnectAsync(true);
}
```

Note: `_host`, `_port`, `_username`, `_password`, `_fromName`, `_fromEmail` are the private fields already used by `SendOtpEmailAsync` in this class.

- [ ] **Step 3: Update AuthService.RequestPasswordResetAsync to send the email and return void**

In `AuthService.cs`, change `RequestPasswordResetAsync` to send the email instead of returning the token. Also add the frontend base URL config:

```csharp
public async Task RequestPasswordResetAsync(string email)
{
    // Use a generic message to avoid account enumeration
    var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.Email == email);
    if (user == null) return; // Don't reveal whether the account exists

    var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
    // URL-encode the token so it survives query string transmission
    var encodedToken = Uri.EscapeDataString(token);

    user.ResetToken = token;
    user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
    await _uow.Users.UpdateAsync(user);
    await _uow.SaveChangesAsync();

    var baseUrl = _config["App:FrontendBaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
    var resetLink = $"{baseUrl}/reset-password?token={encodedToken}";
    await _emailService.SendPasswordResetEmailAsync(user.Email, user.DisplayName ?? user.Email, resetLink);
}
```

- [ ] **Step 4: Update IAuthService interface signature**

Find `backend/A365ShiftTracker.Application/Interfaces/IAuthService.cs` and update the method signature:

```csharp
// Change from:
Task<string> RequestPasswordResetAsync(string email);
// To:
Task RequestPasswordResetAsync(string email);
```

- [ ] **Step 5: Update AuthController.ForgotPassword to return generic success**

In `AuthController.cs`, replace the `ForgotPassword` action:

```csharp
[HttpPost("forgot-password")]
public async Task<ActionResult<ApiResponse<bool>>> ForgotPassword(ForgotPasswordRequest request)
{
    await _authService.RequestPasswordResetAsync(request.Email);
    // Always return success to prevent account enumeration
    return Ok(ApiResponse<bool>.Ok(true, "If an account with that email exists, a reset link has been sent."));
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/A365ShiftTracker.Application/Interfaces/IEmailService.cs \
        backend/A365ShiftTracker.Application/Interfaces/IAuthService.cs \
        backend/A365ShiftTracker.Infrastructure/Services/SmtpEmailService.cs \
        backend/A365ShiftTracker.Application/Services/AuthService.cs \
        backend/A365ShiftTracker.API/Controllers/AuthController.cs
git commit -m "security: send password reset token via email only, prevent account enumeration"
```

---

## Task 4: Fix Path Traversal in UploadController

**Files:**
- Modify: `backend/A365ShiftTracker.API/Controllers/UploadController.cs`

- [ ] **Step 1: Replace unsafe folder handling with sanitized version**

In `UploadController.cs`, replace the `Upload` method's folder handling section. The allowed folder names are a fixed whitelist. Add a static set and update the method:

```csharp
private static readonly HashSet<string> AllowedFolders = new(StringComparer.OrdinalIgnoreCase)
{
    "general", "documents", "invoices", "contacts", "projects", "avatars", "receipts", "legal"
};

[HttpPost]
[RequestSizeLimit(10_485_760)]
public async Task<IActionResult> Upload(IFormFile file, [FromForm] string? folder)
{
    if (file == null || file.Length == 0)
        return BadRequest(new { error = "No file provided." });

    if (file.Length > MaxFileSize)
        return BadRequest(new { error = "File size exceeds 10MB limit." });

    var ext = Path.GetExtension(file.FileName);
    if (!AllowedExtensions.Contains(ext))
        return BadRequest(new { error = $"File type '{ext}' is not allowed." });

    // Whitelist folder names — reject anything not in the list (prevents path traversal)
    var subFolder = (!string.IsNullOrWhiteSpace(folder) && AllowedFolders.Contains(folder))
        ? folder
        : "general";

    var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
    var uploadsRoot = Path.GetFullPath(Path.Combine(webRoot, "uploads"));
    var uploadsDir = Path.GetFullPath(Path.Combine(uploadsRoot, subFolder));

    // Defense-in-depth: verify resolved path is still under uploads root
    if (!uploadsDir.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase))
        return BadRequest(new { error = "Invalid folder." });

    Directory.CreateDirectory(uploadsDir);

    var uniqueName = $"{Guid.NewGuid():N}{ext}";
    var filePath = Path.Combine(uploadsDir, uniqueName);

    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    var fileUrl = $"/uploads/{subFolder}/{uniqueName}";
    return Ok(new { url = fileUrl, fileName = file.FileName, fileType = file.ContentType, fileSize = file.Length });
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/A365ShiftTracker.API/Controllers/UploadController.cs
git commit -m "security: fix path traversal in upload controller via folder whitelist"
```

---

## Task 5: Fix int.Parse → int.TryParse in AuthController

All six `int.Parse(sub)` calls in `AuthController` throw `FormatException` on malformed claims, returning 500 instead of 401.

**Files:**
- Modify: `backend/A365ShiftTracker.API/Controllers/AuthController.cs`

- [ ] **Step 1: Extract a helper method and replace all int.Parse calls**

Add a private helper at the bottom of `AuthController`:

```csharp
private int GetCurrentUserId()
{
    var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(sub, out var uid))
        throw new UnauthorizedAccessException("Not authenticated.");
    return uid;
}
```

Then replace every occurrence of:
```csharp
var sub = User.FindFirst(...)?.Value ?? User.FindFirst(...)?.Value ?? throw new UnauthorizedAccessException("Not authenticated.");
var uid = int.Parse(sub);
```
or
```csharp
await _authService.SomeMethod(int.Parse(sub));
```

With:
```csharp
var uid = GetCurrentUserId();
```

The six endpoints to update are: `TotpSetup`, `TotpVerifySetup`, `TotpDisable`, `EmailOtpSendEnable`, `EmailOtpVerifyEnable`, `EmailOtpDisable`.

- [ ] **Step 2: Commit**

```bash
git add backend/A365ShiftTracker.API/Controllers/AuthController.cs
git commit -m "fix: replace int.Parse with TryParse for JWT sub claim in AuthController"
```

---

## Task 6: Add DTO Validation Attributes

**Files:**
- Modify: `backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs`

- [ ] **Step 1: Add System.ComponentModel.DataAnnotations attributes to request DTOs**

Replace the request DTOs at the top of `AuthDtos.cs` with validated versions:

```csharp
using System.ComponentModel.DataAnnotations;

namespace A365ShiftTracker.Application.DTOs;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DisplayName { get; set; }
}

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class SendOtpRequest
{
    [Required]
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyOtpRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string PartialToken { get; set; } = string.Empty;
}

public class VerifyTotpSetupRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}

public class VerifyEmailOtpEnableRequest
{
    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}
```

Keep all the response DTOs (`AuthResponse`, `LoginResponse`, `TotpSetupResponse`, `Require2FARequest`) unchanged.

- [ ] **Step 2: Verify [ApiController] is active (it provides automatic 400 on model validation failure)**

`[ApiController]` is already on `AuthController`. No additional changes needed — ASP.NET Core will automatically return `400 Bad Request` with validation details when any `[Required]` field is missing.

- [ ] **Step 3: Commit**

```bash
git add backend/A365ShiftTracker.Application/DTOs/AuthDtos.cs
git commit -m "fix: add validation attributes to auth request DTOs"
```

---

## Task 7: Fix User Registration Transaction

Currently `RegisterAsync` calls `SaveChangesAsync` twice without a transaction. If the second call fails, a user exists without a role.

**Files:**
- Modify: `backend/A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs`
- Modify: `backend/A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs`
- Modify: `backend/A365ShiftTracker.Application/Services/AuthService.cs`

- [ ] **Step 1: Add BeginTransactionAsync to IUnitOfWork**

```csharp
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace A365ShiftTracker.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    // ... all existing repository properties remain unchanged ...

    Task<int> SaveChangesAsync();
    Task<IDbContextTransaction> BeginTransactionAsync();
}
```

- [ ] **Step 2: Implement BeginTransactionAsync in UnitOfWork**

In `UnitOfWork.cs`, add the using and implement the method:

```csharp
using Microsoft.EntityFrameworkCore.Storage;

// Add to the class body:
public async Task<IDbContextTransaction> BeginTransactionAsync()
    => await _context.Database.BeginTransactionAsync();
```

- [ ] **Step 3: Update RegisterAsync to use a transaction**

In `AuthService.cs`, replace the `RegisterAsync` method:

```csharp
public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
{
    var exists = await _uow.Users.Query().AnyAsync(u => u.Email == request.Email);
    if (exists)
        throw new InvalidOperationException("Email already registered.");

    await using var tx = await _uow.BeginTransactionAsync();
    try
    {
        var user = new Domain.Entities.User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName
        };

        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync(); // generates user.Id

        var defaultRole = await _uow.Roles.Query().FirstOrDefaultAsync(r => r.Name == "User");
        if (defaultRole != null)
        {
            await _uow.UserRoles.AddAsync(new Domain.Entities.UserRole
            {
                UserId = user.Id,
                RoleId = defaultRole.Id
            });
            await _uow.SaveChangesAsync();
        }

        await tx.CommitAsync();

        var (roleName, permissions) = await GetUserRoleAndPermissionsAsync(user.Id);
        return new AuthResponse
        {
            Id = user.Id, Email = user.Email, DisplayName = user.DisplayName,
            Token = GenerateJwtToken(user.Id, user.Email, roleName, permissions, user.DisplayName),
            Role = roleName, Permissions = permissions,
            IsTotpEnabled = user.IsTotpEnabled,
            TwoFactorRequired = user.TwoFactorRequired,
            TwoFactorMethod = user.TwoFactorMethod
        };
    }
    catch
    {
        await tx.RollbackAsync();
        throw;
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/A365ShiftTracker.Application/Interfaces/IUnitOfWork.cs \
        backend/A365ShiftTracker.Infrastructure/Repositories/UnitOfWork.cs \
        backend/A365ShiftTracker.Application/Services/AuthService.cs
git commit -m "fix: wrap user registration in a transaction to prevent partial state"
```

---

## Task 8: Fix Exception Swallow in 2FA Attempt Tracking

**Files:**
- Modify: `backend/A365ShiftTracker.Application/Services/AuthService.cs`

- [ ] **Step 1: Add ILogger and replace empty catch with logging**

In `AuthService.cs`, add `ILogger<AuthService>` to the constructor:

```csharp
private readonly IUnitOfWork _uow;
private readonly IConfiguration _config;
private readonly IEmailService _emailService;
private readonly IMemoryCache _cache;
private readonly ILogger<AuthService> _logger;

public AuthService(IUnitOfWork uow, IConfiguration config, IEmailService emailService,
    IMemoryCache cache, ILogger<AuthService> logger)
{
    _uow = uow;
    _config = config;
    _emailService = emailService;
    _cache = cache;
    _logger = logger;
}
```

Then replace the `IncrementAttempts` method:

```csharp
private void IncrementAttempts(string partialToken, int userId)
{
    try
    {
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(partialToken);
        var jti = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        if (jti is not null)
        {
            var jtiCount = _cache.TryGetValue($"2fa_attempts:{jti}", out int jtiStored) ? jtiStored : 0;
            _cache.Set($"2fa_attempts:{jti}", jtiCount + 1, TimeSpan.FromMinutes(6));
        }
    }
    catch (Exception ex)
    {
        _logger.LogWarning(ex, "Failed to parse partial token for 2FA attempt tracking for userId={UserId}", userId);
    }

    var userKey = $"2fa_attempts:user:{userId}";
    var userCount = _cache.TryGetValue(userKey, out int userStored) ? userStored : 0;
    _cache.Set(userKey, userCount + 1, TimeSpan.FromMinutes(5));
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/A365ShiftTracker.Application/Services/AuthService.cs
git commit -m "fix: log instead of swallow exception in 2FA attempt tracking"
```

---

## Task 9: Add Decimal Precision and Fix Encryption Key Validation in AppDbContext

**Files:**
- Modify: `backend/A365ShiftTracker.Infrastructure/Data/AppDbContext.cs`

- [ ] **Step 1: Throw on startup if encryption key is missing**

In `AppDbContext.cs`, find the constructor and update the key assignment:

Find the line:
```csharp
var encKey = _configuration?["Encryption:Key"] ?? string.Empty;
```

Replace it with:
```csharp
var encKey = _configuration?["Encryption:Key"];
if (string.IsNullOrWhiteSpace(encKey))
    throw new InvalidOperationException("Encryption:Key configuration is missing. Set it via environment variables or appsettings.Development.json.");
```

- [ ] **Step 2: Add explicit decimal precision to Invoice encrypted fields**

In the Invoice entity configuration section (around line 470 in AppDbContext.cs), after each `HasConversion(decConv)` call, add `HasPrecision`:

```csharp
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
    e.Property(i => i.ClientName).HasConversion(strConv);
    e.Property(i => i.ClientGstin).HasConversion(strConv);
    e.Property(i => i.Currency).HasConversion(strConv);
    e.Property(i => i.SubTotal).HasConversion(decConv).HasPrecision(18, 2);
    e.Property(i => i.TaxAmount).HasConversion(decConv).HasPrecision(18, 2);
    e.Property(i => i.TotalAmount).HasConversion(decConv).HasPrecision(18, 2);
});
```

- [ ] **Step 3: Create a migration for the precision change**

Run in the `backend/` directory (the solution root or the API project directory):

```bash
cd backend
dotnet ef migrations add AddInvoiceDecimalPrecision --project A365ShiftTracker.Infrastructure --startup-project A365ShiftTracker.API
```

Expected output: migration file created in `A365ShiftTracker.Infrastructure/Migrations/`.

- [ ] **Step 4: Apply migration**

```bash
dotnet ef database update --project A365ShiftTracker.Infrastructure --startup-project A365ShiftTracker.API
```

Expected output: `Done.`

- [ ] **Step 5: Commit**

```bash
git add backend/A365ShiftTracker.Infrastructure/Data/AppDbContext.cs \
        backend/A365ShiftTracker.Infrastructure/Migrations/
git commit -m "fix: throw on missing encryption key, add precision to invoice decimal fields"
```

---

## Task 10: Add React ErrorBoundary

**Files:**
- Create: `frontend/src/components/ErrorBoundary.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create ErrorBoundary component**

Create `frontend/src/components/ErrorBoundary.jsx`:

```jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.5rem', background: '#4361EE', color: '#fff',
              border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap App with ErrorBoundary in App.jsx**

In `App.jsx`, import and apply the ErrorBoundary:

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ThemeProvider>
          <ToastProvider>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#4361EE', fontSize: 14 }}>
              Loading…
            </div>
          }>
          <Routes>
            {/* ... all existing routes unchanged ... */}
          </Routes>
          </Suspense>
          </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ErrorBoundary.jsx frontend/src/App.jsx
git commit -m "fix: add ErrorBoundary to prevent full app crash on unhandled component errors"
```

---

## Task 11: Fix Dashboard useEffect Memory Leak — Add AbortController

**Files:**
- Modify: `frontend/src/pages/Dashboard/Dashboard.jsx`

- [ ] **Step 1: Add AbortController to the data-fetch useEffect**

In `Dashboard.jsx`, find the `useEffect` that starts at `if (!currentUser) return;` (around line 974). Replace the entire useEffect with an abort-safe version:

```jsx
useEffect(() => {
  if (!currentUser) return;

  const controller = new AbortController();
  const { signal } = controller;

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const d = await projectService.getAll(1, 100, { signal });
      if (signal.aborted) return;
      setProjects(Array.isArray(d) ? d : (d?.items ?? []));
    } catch (e) {
      if (signal.aborted) return;
      console.error('Dashboard projects:', e);
    } finally {
      if (!signal.aborted) setLoadingProjects(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const d = await contactService.getContacts(1, 100, { signal });
      if (signal.aborted) return;
      setContacts((d?.items ?? d) || []);
    } catch (e) {
      if (signal.aborted) return;
      console.error('Dashboard contacts:', e);
    } finally {
      if (!signal.aborted) setLoadingContacts(false);
    }
  };

  const fetchTimesheet = async () => {
    try {
      setLoadingTimesheet(true);
      const d = await timesheetService.getEntries(1, 100, { signal });
      if (signal.aborted) return;
      setTimesheetEntries((d?.items ?? d) || []);
    } catch (e) {
      if (signal.aborted) return;
      console.error('Dashboard timesheet:', e);
    } finally {
      if (!signal.aborted) setLoadingTimesheet(false);
    }
  };

  const fetchFinance = async () => {
    try {
      setLoadingFinance(true);
      const [exp, inc] = await Promise.all([
        expenseService.getExpenses(1, 1000, { signal }),
        incomeService.getIncomes(1, 1000, { signal })
      ]);
      if (signal.aborted) return;
      setExpenses((exp?.items ?? exp) || []);
      setIncomes((inc?.items ?? inc) || []);
    } catch (e) {
      if (signal.aborted) return;
      console.error('Dashboard finance:', e);
    } finally {
      if (!signal.aborted) setLoadingFinance(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const d = await taskService.getAll({ signal });
      if (signal.aborted) return;
      setTasks(Array.isArray(d) ? d : (d?.items ?? d?.tasks ?? []));
    } catch (e) {
      if (signal.aborted) return;
      console.error('Dashboard tasks:', e);
    } finally {
      if (!signal.aborted) setLoadingTasks(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const a = await notificationService.getAlerts({ signal });
      if (signal.aborted) return;
      setAlerts(a || []);
    } catch (e) {
      if (signal.aborted) return;
      console.error('Dashboard alerts:', e);
    }
  };

  fetchProjects();
  fetchContacts();
  fetchTimesheet();
  fetchFinance();
  fetchTasks();
  fetchAlerts();

  return () => controller.abort();
}, [currentUser]);
```

Note: The `signal` parameter is passed to service calls. Most service methods accept it as an optional options parameter already (via `fetch` options). If a service does not accept `signal`, the `if (signal.aborted) return;` guard after the await still prevents the setState call — so this is safe regardless.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard/Dashboard.jsx
git commit -m "fix: add AbortController to Dashboard data fetch to prevent setState on unmounted component"
```

---

## Self-Review Checklist

- [x] Critical issue 1 (hardcoded secrets): Task 1
- [x] Critical issue 2 (reset token in response): Task 3
- [x] Critical issue 3 (path traversal): Task 4
- [x] Critical issue 4 (no rate limiting): Task 2
- [x] High issue 5 (registration transaction): Task 7
- [x] High issue 6 (exception swallow): Task 8
- [x] High issue 7 (no DTO validation): Task 6
- [x] High issue 8 (int.Parse → TryParse): Task 5
- [x] Medium issue 9 (no Error Boundary): Task 10
- [x] Medium issue 10 (Dashboard memory leak): Task 11
- [x] Medium issue 11 (decimal precision): Task 9
- [x] Medium issue 12 (encryption key fallback): Task 9
- [ ] Soft-delete in Dapper (noted in review, mitigated by existing manual filters — no code change required, addressed by documentation in code comment)
- [ ] Concurrency tokens on financial entities (requires schema migration and domain model change — deferred, scope too large for this batch)
