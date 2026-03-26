using A365ShiftTracker.Domain.Entities;

namespace A365ShiftTracker.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Role> Roles { get; }
    IRepository<Permission> Permissions { get; }
    IRepository<UserRole> UserRoles { get; }
    IRepository<RolePermission> RolePermissions { get; }
    IRepository<Contact> Contacts { get; }
    IRepository<ContactColumn> ContactColumns { get; }
    IRepository<Project> Projects { get; }
    IRepository<TaskItem> Tasks { get; }
    IRepository<ProjectFinance> ProjectFinances { get; }
    IRepository<Milestone> Milestones { get; }
    IRepository<Stakeholder> Stakeholders { get; }
    IRepository<Charge> Charges { get; }
    IRepository<Expense> Expenses { get; }
    IRepository<Income> Incomes { get; }
    IRepository<TimesheetEntry> TimesheetEntries { get; }
    IRepository<TimesheetColumn> TimesheetColumns { get; }
    IRepository<VendorResponse> VendorResponses { get; }
    IRepository<VendorEmail> VendorEmails { get; }
    Task<int> SaveChangesAsync();
}
