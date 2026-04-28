using System.Text;
using A365ShiftTracker.API.Middleware;
using A365ShiftTracker.Infrastructure;
using A365ShiftTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IO.Compression;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ─── Startup secret validation ─────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
var encKey = builder.Configuration["Encryption:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException(
        "Jwt:Key must be set to a random secret of at least 32 characters. " +
        "Use appsettings.Development.json or environment variables.");
if (string.IsNullOrWhiteSpace(encKey) || encKey.Length < 32)
    throw new InvalidOperationException(
        "Encryption:Key must be set to a random secret of at least 32 characters. " +
        "Use appsettings.Development.json or environment variables.");

// ─── Response Compression ─────────────────────────────────
builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<BrotliCompressionProvider>();
    opts.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(opts =>
    opts.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(opts =>
    opts.Level = CompressionLevel.Fastest);

// ─── Infrastructure (EF Core, Repositories, Services) ──────
builder.Services.AddInfrastructure(builder.Configuration);

// ─── JWT Authentication ────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };

        // Read JWT from httpOnly cookie — token never exposed to frontend JS
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Cookie takes priority; Authorization header still works for Swagger / API tools
                var cookieToken = context.Request.Cookies["auth_token"];
                if (!string.IsNullOrEmpty(cookieToken))
                    context.Token = cookieToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Role hierarchy policies
    options.AddPolicy("SuperAdminOnly", policy =>
        policy.RequireRole("SUPER_ADMIN"));

    options.AddPolicy("OrgAdminOrAbove", policy =>
        policy.RequireRole("SUPER_ADMIN", "ORG_ADMIN"));

    options.AddPolicy("ManagerOrAbove", policy =>
        policy.RequireRole("SUPER_ADMIN", "ORG_ADMIN", "MANAGER"));

    options.AddPolicy("Authenticated", policy =>
        policy.RequireRole("SUPER_ADMIN", "ORG_ADMIN", "MANAGER", "EMPLOYEE"));

    // Module-level permission policies (checked via permission claim or elevated roles)
    var modules = new[] { "Dashboard", "Sales", "Contacts", "Timesheet", "Finance", "TodoList", "Invoice", "AIAgents", "Admin", "ActivityLog", "Notifications", "Calendar", "Notes", "Tags", "EmailTemplates", "Documents", "Reports" };
    var actions = new[] { "View", "Create", "Edit", "Delete" };
    foreach (var module in modules)
    {
        foreach (var action in actions)
        {
            var code = $"{module.ToLower()}.{action.ToLower()}";
            options.AddPolicy($"Permission:{code}", policy =>
                policy.RequireAssertion(ctx =>
                    ctx.User.IsInRole("SUPER_ADMIN") ||
                    ctx.User.IsInRole("ORG_ADMIN") ||
                    ctx.User.HasClaim("permission", code)));
        }
    }
});

// ─── Output Caching ───────────────────────────────────────
builder.Services.AddOutputCache(opts =>
{
    // Default policy: cache per user (via auth cookie) for 30 seconds
    opts.AddBasePolicy(b => b.SetVaryByQuery("*").Expire(TimeSpan.FromSeconds(30)));
    // Named policy for read-heavy stats — 60 seconds per user
    opts.AddPolicy("StatsCache", b => b
        .Expire(TimeSpan.FromSeconds(60))
        .SetVaryByQuery("*")
        .Tag("stats"));
});

// ─── Rate Limiting ────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddSlidingWindowLimiter("AuthPolicy", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;
        opt.QueueLimit = 0;
    });
});

// ─── Controllers ───────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
    });

// ─── CORS (allow React frontend) ──────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                    ?? ["http://localhost:5173", "http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ─── Swagger ───────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "A365 Shift Tracker API",
        Version = "v1",
        Description = "CRM Backend API for A365 Shift Tracker"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ─── Startup Schema Patches ────────────────────────────────
// Idempotent DDL — safe to run on every start.
// Handles columns added outside the normal EF migration flow.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.ExecuteSqlRawAsync(
        "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS user_limit integer NULL;");
}

// ─── Middleware Pipeline ───────────────────────────────────
app.UseResponseCompression(); // must be first
app.UseMiddleware<ExceptionMiddleware>();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TenantMiddleware>();
app.UseMiddleware<FirstLoginMiddleware>();
app.UseOutputCache();
app.MapControllers();

app.Run();
