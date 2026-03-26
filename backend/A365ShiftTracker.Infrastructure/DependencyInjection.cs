using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Application.Services;
using A365ShiftTracker.Infrastructure.Data;
using A365ShiftTracker.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace A365ShiftTracker.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(3)));

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

        return services;
    }
}
