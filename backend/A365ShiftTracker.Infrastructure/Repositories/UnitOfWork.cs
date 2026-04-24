using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using A365ShiftTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace A365ShiftTracker.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context) => _context = context;

    private IRepository<User>? _users;
    private IRepository<Role>? _roles;
    private IRepository<Permission>? _permissions;
    private IRepository<UserRole>? _userRoles;
    private IRepository<RolePermission>? _rolePermissions;
    private IRepository<Contact>? _contacts;
    private IRepository<ContactColumn>? _contactColumns;
    private IRepository<Project>? _projects;
    private IRepository<TaskItem>? _tasks;
    private IRepository<TaskColumn>? _taskColumns;
    private IRepository<ProjectFinance>? _projectFinances;
    private IRepository<Milestone>? _milestones;
    private IRepository<Stakeholder>? _stakeholders;
    private IRepository<Charge>? _charges;
    private IRepository<Expense>? _expenses;
    private IRepository<Income>? _incomes;
    private IRepository<TimesheetEntry>? _timesheetEntries;
    private IRepository<TimesheetColumn>? _timesheetColumns;
    private IRepository<VendorResponse>? _vendorResponses;
    private IRepository<VendorEmail>? _vendorEmails;
    private IRepository<ActivityLog>? _activityLogs;
    private IRepository<Notification>? _notifications;
    private IRepository<SavedFilter>? _savedFilters;
    private IRepository<Note>? _notes;
    private IRepository<Tag>? _tags;
    private IRepository<EntityTag>? _entityTags;
    private IRepository<EmailTemplate>? _emailTemplates;
    private IRepository<Document>? _documents;
    private IRepository<Company>? _companies;
    private IRepository<Lead>? _leads;
    private IRepository<AuditLog>? _auditLogs;
    private IRepository<LegalAgreement>? _legalAgreements;
    private IRepository<Ticket>? _tickets;
    private IRepository<TicketComment>? _ticketComments;
    private IRepository<Invoice>? _invoices;
    private IRepository<Organization>? _organizations;
    private IRepository<OrgSalesSettings>? _orgSalesSettings;

    public IRepository<User> Users => _users ??= new Repository<User>(_context);
    public IRepository<Role> Roles => _roles ??= new Repository<Role>(_context);
    public IRepository<Permission> Permissions => _permissions ??= new Repository<Permission>(_context);
    public IRepository<UserRole> UserRoles => _userRoles ??= new Repository<UserRole>(_context);
    public IRepository<RolePermission> RolePermissions => _rolePermissions ??= new Repository<RolePermission>(_context);
    public IRepository<Contact> Contacts => _contacts ??= new Repository<Contact>(_context);
    public IRepository<ContactColumn> ContactColumns => _contactColumns ??= new Repository<ContactColumn>(_context);
    public IRepository<Project> Projects => _projects ??= new Repository<Project>(_context);
    public IRepository<TaskItem> Tasks => _tasks ??= new Repository<TaskItem>(_context);
    public IRepository<TaskColumn> TaskColumns => _taskColumns ??= new Repository<TaskColumn>(_context);
    public IRepository<ProjectFinance> ProjectFinances => _projectFinances ??= new Repository<ProjectFinance>(_context);
    public IRepository<Milestone> Milestones => _milestones ??= new Repository<Milestone>(_context);
    public IRepository<Stakeholder> Stakeholders => _stakeholders ??= new Repository<Stakeholder>(_context);
    public IRepository<Charge> Charges => _charges ??= new Repository<Charge>(_context);
    public IRepository<Expense> Expenses => _expenses ??= new Repository<Expense>(_context);
    public IRepository<Income> Incomes => _incomes ??= new Repository<Income>(_context);
    public IRepository<TimesheetEntry> TimesheetEntries => _timesheetEntries ??= new Repository<TimesheetEntry>(_context);
    public IRepository<TimesheetColumn> TimesheetColumns => _timesheetColumns ??= new Repository<TimesheetColumn>(_context);
    public IRepository<VendorResponse> VendorResponses => _vendorResponses ??= new Repository<VendorResponse>(_context);
    public IRepository<VendorEmail> VendorEmails => _vendorEmails ??= new Repository<VendorEmail>(_context);
    public IRepository<ActivityLog> ActivityLogs => _activityLogs ??= new Repository<ActivityLog>(_context);
    public IRepository<Notification> Notifications => _notifications ??= new Repository<Notification>(_context);
    public IRepository<SavedFilter> SavedFilters => _savedFilters ??= new Repository<SavedFilter>(_context);
    public IRepository<Note> Notes => _notes ??= new Repository<Note>(_context);
    public IRepository<Tag> Tags => _tags ??= new Repository<Tag>(_context);
    public IRepository<EntityTag> EntityTags => _entityTags ??= new Repository<EntityTag>(_context);
    public IRepository<EmailTemplate> EmailTemplates => _emailTemplates ??= new Repository<EmailTemplate>(_context);
    public IRepository<Document> Documents => _documents ??= new Repository<Document>(_context);
    public IRepository<Company> Companies => _companies ??= new Repository<Company>(_context);
    public IRepository<Lead> Leads => _leads ??= new Repository<Lead>(_context);
    public IRepository<AuditLog> AuditLogs => _auditLogs ??= new Repository<AuditLog>(_context);
    public IRepository<LegalAgreement> LegalAgreements => _legalAgreements ??= new Repository<LegalAgreement>(_context);
    public IRepository<Ticket> Tickets => _tickets ??= new Repository<Ticket>(_context);
    public IRepository<TicketComment> TicketComments => _ticketComments ??= new Repository<TicketComment>(_context);
    public IRepository<Invoice> Invoices => _invoices ??= new Repository<Invoice>(_context);
    public IRepository<Organization> Organizations => _organizations ??= new Repository<Organization>(_context);
    public IRepository<OrgSalesSettings> OrgSalesSettings => _orgSalesSettings ??= new Repository<OrgSalesSettings>(_context);

    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();

    public async Task<IDbContextTransaction> BeginTransactionAsync()
        => await _context.Database.BeginTransactionAsync();

    public void Dispose() => _context.Dispose();
}
