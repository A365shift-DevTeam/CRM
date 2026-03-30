using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace A365ShiftTracker.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<ContactColumn> ContactColumns => Set<ContactColumn>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<ProjectFinance> ProjectFinances => Set<ProjectFinance>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<Stakeholder> Stakeholders => Set<Stakeholder>();
    public DbSet<Charge> Charges => Set<Charge>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<TimesheetEntry> TimesheetEntries => Set<TimesheetEntry>();
    public DbSet<TimesheetColumn> TimesheetColumns => Set<TimesheetColumn>();
    public DbSet<VendorResponse> VendorResponses => Set<VendorResponse>();
    public DbSet<VendorEmail> VendorEmails => Set<VendorEmail>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SavedFilter> SavedFilters => Set<SavedFilter>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<EntityTag> EntityTags => Set<EntityTag>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<Document> Documents => Set<Document>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─── Users ─────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasIndex(u => u.Email).IsUnique();
            e.HasMany(u => u.UserRoles).WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Roles ─────────────────────────────────────────
        modelBuilder.Entity<Role>(e =>
        {
            e.ToTable("roles");
            e.HasIndex(r => r.Name).IsUnique();
            e.HasMany(r => r.UserRoles).WithOne(ur => ur.Role)
                .HasForeignKey(ur => ur.RoleId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(r => r.RolePermissions).WithOne(rp => rp.Role)
                .HasForeignKey(rp => rp.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Permissions ───────────────────────────────────
        modelBuilder.Entity<Permission>(e =>
        {
            e.ToTable("permissions");
            e.HasIndex(p => p.Code).IsUnique();
            e.HasMany(p => p.RolePermissions).WithOne(rp => rp.Permission)
                .HasForeignKey(rp => rp.PermissionId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── User Roles (junction) ─────────────────────────
        modelBuilder.Entity<UserRole>(e =>
        {
            e.ToTable("user_roles");
            e.HasIndex(ur => new { ur.UserId, ur.RoleId }).IsUnique();
        });

        // ─── Role Permissions (junction) ────────────────────
        modelBuilder.Entity<RolePermission>(e =>
        {
            e.ToTable("role_permissions");
            e.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique();
        });

        // ─── Seed: Roles ────────────────────────────────────
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Admin", Description = "Full access to all features", IsSystem = true },
            new Role { Id = 2, Name = "Manager", Description = "Can manage teams and view reports", IsSystem = true },
            new Role { Id = 3, Name = "User", Description = "Standard user with limited access", IsSystem = true }
        );

        // ─── Seed: Permissions ──────────────────────────────
        var permissions = new List<Permission>();
        var id = 1;
        var modules = new[]
        {
            "Dashboard", "Sales", "Contacts", "Timesheet",
            "Finance", "TodoList", "Invoice", "AIAgents", "Admin",
            "ActivityLog", "Notifications", "Calendar", "Notes",
            "Tags", "EmailTemplates", "Documents", "Reports"
        };
        var actions = new[] { "View", "Create", "Edit", "Delete" };

        foreach (var module in modules)
        {
            foreach (var action in actions)
            {
                permissions.Add(new Permission
                {
                    Id = id,
                    Module = module,
                    Action = action,
                    Code = $"{module.ToLower()}.{action.ToLower()}",
                    Description = $"{action} access to {module}"
                });
                id++;
            }
        }
        modelBuilder.Entity<Permission>().HasData(permissions);

        // ─── Seed: Admin gets ALL permissions ────────────────
        var adminPerms = new List<RolePermission>();
        for (int i = 1; i < id; i++)
        {
            adminPerms.Add(new RolePermission { Id = i, RoleId = 1, PermissionId = i });
        }
        modelBuilder.Entity<RolePermission>().HasData(adminPerms);

        // ─── Seed: User gets View on most modules ────────────
        var userPerms = new List<RolePermission>();
        var userPermId = id; // continue from where permissions ended
        var userViewModules = new[] { "Dashboard", "Sales", "Contacts", "Timesheet", "Finance", "TodoList", "Invoice", "AIAgents", "ActivityLog", "Notifications", "Calendar", "Notes", "Tags", "EmailTemplates", "Documents", "Reports" };
        foreach (var module in userViewModules)
        {
            var viewPerm = permissions.Find(p => p.Code == $"{module.ToLower()}.view");
            if (viewPerm != null)
            {
                userPerms.Add(new RolePermission { Id = userPermId++, RoleId = 3, PermissionId = viewPerm.Id });
            }
        }
        // User can also create/edit tasks and timesheet
        var extraUserPerms = new[] { "todolist.create", "todolist.edit", "timesheet.create", "timesheet.edit" };
        foreach (var code in extraUserPerms)
        {
            var perm = permissions.Find(p => p.Code == code);
            if (perm != null)
            {
                userPerms.Add(new RolePermission { Id = userPermId++, RoleId = 3, PermissionId = perm.Id });
            }
        }
        modelBuilder.Entity<RolePermission>().HasData(userPerms);

        // ─── Seed: Manager gets everything except Admin module ─
        var managerPerms = new List<RolePermission>();
        var mgrPermId = userPermId;
        foreach (var perm in permissions.Where(p => p.Module != "Admin"))
        {
            managerPerms.Add(new RolePermission { Id = mgrPermId++, RoleId = 2, PermissionId = perm.Id });
        }
        modelBuilder.Entity<RolePermission>().HasData(managerPerms);

        // ─── Contacts ──────────────────────────────────────
        modelBuilder.Entity<Contact>(e =>
        {
            e.ToTable("contacts");
            e.HasIndex(c => c.EntityType);
            e.HasIndex(c => c.Status);
            e.HasIndex(c => c.Company);
            e.HasIndex(c => c.UserId);
        });

        // ─── Contact Columns ───────────────────────────────
        modelBuilder.Entity<ContactColumn>(e =>
        {
            e.ToTable("contact_columns");
            e.HasIndex(c => c.ColId).IsUnique();
            e.Property(c => c.Config).HasColumnType("jsonb");
        });

        // ─── Projects ──────────────────────────────────────
        modelBuilder.Entity<Project>(e =>
        {
            e.ToTable("projects");
            e.Property(p => p.History).HasColumnType("jsonb");
            e.HasIndex(p => p.UserId);
        });

        // ─── Tasks ─────────────────────────────────────────
        modelBuilder.Entity<TaskItem>(e =>
        {
            e.ToTable("tasks");
            e.Property(t => t.Values).HasColumnType("jsonb");
            e.HasIndex(t => t.UserId);
        });

        // ─── Project Finances ──────────────────────────────
        modelBuilder.Entity<ProjectFinance>(e =>
        {
            e.ToTable("project_finances");
            e.HasIndex(pf => pf.UserId);
            e.HasMany(pf => pf.Milestones).WithOne(m => m.ProjectFinance)
                .HasForeignKey(m => m.ProjectFinanceId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(pf => pf.Stakeholders).WithOne(s => s.ProjectFinance)
                .HasForeignKey(s => s.ProjectFinanceId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(pf => pf.Charges).WithOne(c => c.ProjectFinance)
                .HasForeignKey(c => c.ProjectFinanceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Milestone>(e =>
        {
            e.ToTable("milestones");
        });

        modelBuilder.Entity<Stakeholder>(e =>
        {
            e.ToTable("stakeholders");
        });

        modelBuilder.Entity<Charge>(e =>
        {
            e.ToTable("charges");
        });

        // ─── Expenses ──────────────────────────────────────
        modelBuilder.Entity<Expense>(e =>
        {
            e.ToTable("expenses");
            e.Property(ex => ex.Details).HasColumnType("jsonb");
            e.HasIndex(ex => ex.UserId);
        });

        // ─── Incomes ───────────────────────────────────────
        modelBuilder.Entity<Income>(e =>
        {
            e.ToTable("incomes");
            e.HasIndex(i => i.UserId);
        });

        // ─── Timesheet Entries ─────────────────────────────
        modelBuilder.Entity<TimesheetEntry>(e =>
        {
            e.ToTable("timesheet_entries");
            e.Property(te => te.Values).HasColumnType("jsonb");
            e.HasIndex(te => te.UserId);
        });

        // ─── Timesheet Columns ─────────────────────────────
        modelBuilder.Entity<TimesheetColumn>(e =>
        {
            e.ToTable("timesheet_columns");
            e.HasIndex(c => c.ColId).IsUnique();
            e.Property(c => c.Config).HasColumnType("jsonb");
        });

        // ─── Vendor Responses ──────────────────────────────
        modelBuilder.Entity<VendorResponse>(e =>
        {
            e.ToTable("vendor_responses");
            e.Property(v => v.Response).HasColumnType("jsonb");
            e.HasOne(v => v.Vendor).WithMany(c => c.VendorResponses)
                .HasForeignKey(v => v.VendorId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Vendor Emails ─────────────────────────────────
        modelBuilder.Entity<VendorEmail>(e =>
        {
            e.ToTable("vendor_emails");
            e.HasOne(v => v.Vendor).WithMany(c => c.VendorEmails)
                .HasForeignKey(v => v.VendorId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Activity Logs ────────────────────────────────
        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.ToTable("activity_logs");
            e.HasIndex(a => a.UserId);
            e.HasIndex(a => new { a.EntityType, a.EntityId });
        });

        // ─── Notifications ───────────────────────────────
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasIndex(n => n.UserId);
            e.HasIndex(n => n.IsRead);
        });

        // ─── Saved Filters ──────────────────────────────
        modelBuilder.Entity<SavedFilter>(e =>
        {
            e.ToTable("saved_filters");
            e.HasIndex(f => f.UserId);
        });

        // ─── Notes ───────────────────────────────────────
        modelBuilder.Entity<Note>(e =>
        {
            e.ToTable("notes");
            e.HasIndex(n => n.UserId);
            e.HasIndex(n => new { n.EntityType, n.EntityId });
        });

        // ─── Tags ────────────────────────────────────────
        modelBuilder.Entity<Tag>(e =>
        {
            e.ToTable("tags");
            e.HasIndex(t => t.UserId);
        });

        // ─── Entity Tags (junction) ─────────────────────
        modelBuilder.Entity<EntityTag>(e =>
        {
            e.ToTable("entity_tags");
            e.HasIndex(et => new { et.TagId, et.EntityType, et.EntityId }).IsUnique();
            e.HasOne(et => et.Tag).WithMany()
                .HasForeignKey(et => et.TagId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Email Templates ─────────────────────────────
        modelBuilder.Entity<EmailTemplate>(e =>
        {
            e.ToTable("email_templates");
            e.HasIndex(t => t.UserId);
        });

        // ─── Documents ───────────────────────────────────
        modelBuilder.Entity<Document>(e =>
        {
            e.ToTable("documents");
            e.HasIndex(d => d.UserId);
            e.HasIndex(d => new { d.EntityType, d.EntityId });
        });

        // ─── Snake case column naming convention ───────────
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            else if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    private static string ToSnakeCase(string name)
    {
        return string.Concat(
            name.Select((c, i) =>
                i > 0 && char.IsUpper(c) ? "_" + c.ToString().ToLower() : c.ToString().ToLower()
            )
        );
    }
}
