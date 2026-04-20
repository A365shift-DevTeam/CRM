using System.Threading.Channels;
using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Application.Services;
using A365ShiftTracker.Domain.Entities;
using A365ShiftTracker.Infrastructure.Data;
using A365ShiftTracker.Infrastructure.Helpers;
using A365ShiftTracker.Infrastructure.Repositories;
using A365ShiftTracker.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace A365ShiftTracker.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Audit log background channel (singleton, bounded to 1000 batches)
        var auditChannel = Channel.CreateBounded<IReadOnlyList<AuditLog>>(
            new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.DropOldest });
        services.AddSingleton(auditChannel.Reader);
        services.AddSingleton(auditChannel.Writer);
        services.AddHostedService<AuditBackgroundService>();

        // Database — pooled context reduces per-request allocation significantly
        services.AddDbContextPool<AppDbContext>((sp, options) =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(3))
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

        // Current user service
        services.AddHttpContextAccessor();
        services.AddMemoryCache();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // Repositories
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IIncomeService, IncomeService>();
        services.AddScoped<ITimesheetService, TimesheetService>();
        services.AddScoped<IProjectFinanceService, ProjectFinanceService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ICalendarService, CalendarService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<INoteService, NoteService>();
        services.AddScoped<ITagService, TagService>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<ILeadService, LeadService>();
        services.AddScoped<ILegalAgreementService, LegalAgreementService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddHttpClient("Claude");
        services.AddScoped<TicketAiService>();

        return services;
    }
}
