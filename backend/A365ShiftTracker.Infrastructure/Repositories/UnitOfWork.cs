using A365ShiftTracker.Application.Interfaces;
using A365ShiftTracker.Domain.Entities;
using A365ShiftTracker.Infrastructure.Data;

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

    public IRepository<User> Users => _users ??= new Repository<User>(_context);
    public IRepository<Role> Roles => _roles ??= new Repository<Role>(_context);
    public IRepository<Permission> Permissions => _permissions ??= new Repository<Permission>(_context);
    public IRepository<UserRole> UserRoles => _userRoles ??= new Repository<UserRole>(_context);
    public IRepository<RolePermission> RolePermissions => _rolePermissions ??= new Repository<RolePermission>(_context);
    public IRepository<Contact> Contacts => _contacts ??= new Repository<Contact>(_context);
    public IRepository<ContactColumn> ContactColumns => _contactColumns ??= new Repository<ContactColumn>(_context);
    public IRepository<Project> Projects => _projects ??= new Repository<Project>(_context);
    public IRepository<TaskItem> Tasks => _tasks ??= new Repository<TaskItem>(_context);
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

    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
}
