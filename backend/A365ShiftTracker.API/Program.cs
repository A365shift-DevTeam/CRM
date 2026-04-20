using System.Text;
using A365ShiftTracker.API.Middleware;
using A365ShiftTracker.Infrastructure;
using A365ShiftTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

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
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Admin", "Manager"));

    // Module-level policies
    var modules = new[] { "Dashboard", "Sales", "Contacts", "Timesheet", "Finance", "TodoList", "Invoice", "AIAgents", "Admin", "ActivityLog", "Notifications", "Calendar", "Notes", "Tags", "EmailTemplates", "Documents", "Reports" };
    var actions = new[] { "View", "Create", "Edit", "Delete" };
    foreach (var module in modules)
    {
        foreach (var action in actions)
        {
            var code = $"{module.ToLower()}.{action.ToLower()}";
            options.AddPolicy($"Permission:{code}", policy =>
                policy.RequireAssertion(ctx =>
                    ctx.User.IsInRole("Admin") ||
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

// ─── Controllers ───────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
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

// ─── Middleware Pipeline ───────────────────────────────────
app.UseResponseCompression(); // must be first
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseStaticFiles(); // Serve uploaded files from wwwroot
app.UseAuthentication();
app.UseAuthorization();
app.UseOutputCache();
app.MapControllers();

app.Run();
