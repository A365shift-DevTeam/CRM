using A365ShiftTracker.Application.Common;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using A365ShiftTracker.Infrastructure.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace A365ShiftTracker.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUser;
    private readonly IConfiguration? _configuration;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService? currentUser = null, IConfiguration? configuration = null)
        : base(options)
    {
        _currentUser = currentUser;
        _configuration = configuration;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<ContactColumn> ContactColumns => Set<ContactColumn>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<TaskColumn> TaskColumns => Set<TaskColumn>();
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
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<LegalAgreement> LegalAgreements => Set<LegalAgreement>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─── Encryption converters ─────────────────────────
        var encKey = _configuration?["Encryption:Key"] ?? string.Empty;
        var strConv = new EncryptedStringConverter(encKey);
        var decConv = new EncryptedDecimalConverter(encKey);
        var decNullConv = new EncryptedNullableDecimalConverter(encKey);

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
            e.Property(c => c.Name).HasConversion(strConv);
            e.Property(c => c.Phone).HasConversion(strConv);
            e.Property(c => c.Gstin).HasConversion(strConv);
            e.Property(c => c.JobTitle).HasConversion(strConv);
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
            e.Property(p => p.Stages).HasColumnType("jsonb");
            e.HasIndex(p => p.UserId);
            e.Property(p => p.ClientName).HasConversion(strConv);
            e.Property(p => p.Phone).HasConversion(strConv);
        });

        // ─── Tasks ─────────────────────────────────────────
        modelBuilder.Entity<TaskItem>(e =>
        {
            e.ToTable("tasks");
            e.Property(t => t.Values).HasColumnType("jsonb");
            e.HasIndex(t => t.UserId);
        });

        // ─── Task Columns ──────────────────────────────────
        modelBuilder.Entity<TaskColumn>(e =>
        {
            e.ToTable("task_columns");
            e.HasIndex(c => c.ColId).IsUnique();
            e.Property(c => c.Config).HasColumnType("jsonb");
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
            e.Property(pf => pf.ClientName).HasConversion(strConv);
            e.Property(pf => pf.ClientGstin).HasConversion(strConv);
            e.Property(pf => pf.Currency).HasConversion(strConv);
            e.Property(pf => pf.DealValue).HasConversion(decNullConv);
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
            e.Property(ex => ex.Amount).HasConversion(decConv);
        });

        // ─── Incomes ───────────────────────────────────────
        modelBuilder.Entity<Income>(e =>
        {
            e.ToTable("incomes");
            e.HasIndex(i => i.UserId);
            e.Property(i => i.Amount).HasConversion(decConv);
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
            e.Property(d => d.FileUrl).HasConversion(strConv);
        });

        // ─── Companies ───────────────────────────────────
        modelBuilder.Entity<Company>(e =>
        {
            e.ToTable("companies");
            e.HasIndex(c => c.UserId);
            e.HasIndex(c => c.Name);
            e.Property(c => c.Name).HasConversion(strConv);
            e.Property(c => c.Gstin).HasConversion(strConv);
        });

        // ─── Leads ───────────────────────────────────────
        modelBuilder.Entity<Lead>(e =>
        {
            e.ToTable("leads");
            e.HasIndex(l => l.UserId);
            e.HasIndex(l => l.Stage);
            e.Property(l => l.ContactName).HasConversion(strConv);
        });

        // ─── Audit Logs ──────────────────────────────────
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.HasIndex(a => new { a.EntityName, a.EntityId });
            e.HasIndex(a => a.ChangedAt);
            e.HasIndex(a => a.ChangedByUserId);
        });

        // ─── Legal Agreements ─────────────────────────────
        modelBuilder.Entity<LegalAgreement>(e =>
        {
            e.ToTable("legal_agreements");
            e.HasIndex(l => l.UserId);
            e.HasIndex(l => l.Status);
            e.HasIndex(l => l.Type);
            e.HasIndex(l => l.ExpiryDate);
        });

        // ─── Tickets ─────────────────────────────────────
        modelBuilder.Entity<Ticket>(e =>
        {
            e.ToTable("tickets");
            e.HasIndex(t => t.UserId);
            e.HasIndex(t => t.Status);
            e.HasIndex(t => t.Priority);
            e.HasIndex(t => t.TicketNumber).IsUnique();
            e.HasMany(t => t.Comments).WithOne(c => c.Ticket)
                .HasForeignKey(c => c.TicketId).OnDelete(DeleteBehavior.Cascade);
            e.Property(t => t.AiConfidence).HasColumnType("decimal(4,3)");
        });

        modelBuilder.Entity<TicketComment>(e =>
        {
            e.ToTable("ticket_comments");
            e.HasIndex(c => c.TicketId);
        });

        // ─── Invoices ─────────────────────────────────────
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
            e.Property(i => i.SubTotal).HasConversion(decConv);
            e.Property(i => i.TaxAmount).HasConversion(decConv);
            e.Property(i => i.TotalAmount).HasConversion(decConv);
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

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        NormalizeDateTimeKinds();

        var now = DateTime.UtcNow;
        var userId = _currentUser?.UserId;
        var userName = _currentUser?.UserName ?? "System";
        var ipAddress = _currentUser?.IpAddress;

        var auditEntries = new List<AuditLog>();

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
                if (userId.HasValue)
                {
                    entry.Entity.CreatedByUserId = userId;
                    entry.Entity.CreatedByName = userName;
                    entry.Entity.UpdatedByUserId = userId;
                    entry.Entity.UpdatedByName = userName;
                }

                auditEntries.Add(new AuditLog
                {
                    EntityName = entry.Entity.GetType().Name,
                    EntityId = 0, // updated after save
                    FieldName = "_record",
                    OldValue = null,
                    NewValue = "created",
                    Action = "Created",
                    ChangedByUserId = userId ?? 0,
                    ChangedByName = userName,
                    ChangedAt = now,
                    IpAddress = ipAddress
                });
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                if (userId.HasValue)
                {
                    entry.Entity.UpdatedByUserId = userId;
                    entry.Entity.UpdatedByName = userName;
                }

                var skipFields = new HashSet<string> { "UpdatedAt", "UpdatedByUserId", "UpdatedByName" };

                foreach (var prop in entry.Properties
                    .Where(p => p.IsModified && !skipFields.Contains(p.Metadata.Name)))
                {
                    var oldVal = prop.OriginalValue?.ToString();
                    var newVal = prop.CurrentValue?.ToString();
                    if (oldVal == newVal) continue;

                    auditEntries.Add(new AuditLog
                    {
                        EntityName = entry.Entity.GetType().Name,
                        EntityId = entry.Entity.Id,
                        FieldName = prop.Metadata.Name,
                        OldValue = oldVal,
                        NewValue = newVal,
                        Action = "Updated",
                        ChangedByUserId = userId ?? 0,
                        ChangedByName = userName,
                        ChangedAt = now,
                        IpAddress = ipAddress
                    });
                }
            }
            else if (entry.State == EntityState.Deleted)
            {
                auditEntries.Add(new AuditLog
                {
                    EntityName = entry.Entity.GetType().Name,
                    EntityId = entry.Entity.Id,
                    FieldName = "_record",
                    OldValue = "existed",
                    NewValue = null,
                    Action = "Deleted",
                    ChangedByUserId = userId ?? 0,
                    ChangedByName = userName,
                    ChangedAt = now,
                    IpAddress = ipAddress
                });
            }
        }

        // Snapshot Added entries before save so we can fix EntityIds after
        var addedSnapshots = ChangeTracker.Entries<AuditableEntity>()
            .Where(e => e.State == EntityState.Added)
            .Select(e => (entry: e, log: auditEntries.FirstOrDefault(l => l.Action == "Created" && l.EntityName == e.Entity.GetType().Name && l.EntityId == 0)))
            .Where(x => x.log != null)
            .ToList();

        var result = await base.SaveChangesAsync(cancellationToken);

        // Fix EntityId for newly-inserted records
        foreach (var (entry, log) in addedSnapshots)
        {
            if (log != null) log.EntityId = entry.Entity.Id;
        }

        if (auditEntries.Count > 0)
        {
            AuditLogs.AddRange(auditEntries);
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private void NormalizeDateTimeKinds()
    {
        foreach (var entry in ChangeTracker.Entries()
                     .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified))
        {
            foreach (var property in entry.Properties)
            {
                // Check the actual boxed value — handles both DateTime and DateTime?
                // (a non-null DateTime? boxes to DateTime, so this covers both cases)
                if (property.CurrentValue is DateTime dt && dt.Kind != DateTimeKind.Utc)
                {
                    property.CurrentValue = NormalizeDateTime(dt);
                }
            }
        }
    }

    private static DateTime NormalizeDateTime(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
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
