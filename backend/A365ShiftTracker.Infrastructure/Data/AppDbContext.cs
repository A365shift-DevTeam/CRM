using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Channels;
using A365ShiftTracker.Domain.Common;
using A365ShiftTracker.Domain.Entities;
using A365ShiftTracker.Infrastructure.Converters;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace A365ShiftTracker.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly IConfiguration? _configuration;
    private readonly ChannelWriter<IReadOnlyList<AuditLog>>? _auditChannel;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        IHttpContextAccessor? httpContextAccessor = null,
        IConfiguration? configuration = null,
        ChannelWriter<IReadOnlyList<AuditLog>>? auditChannel = null)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _auditChannel = auditChannel;
    }

    // Read org context directly from the ambient HTTP request.
    // IHttpContextAccessor is singleton and safe for use in pooled DbContext.
    private bool IsSuperAdmin =>
        _httpContextAccessor?.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value == "SUPER_ADMIN";

    private int? CurrentOrgId
    {
        get
        {
            var orgStr = _httpContextAccessor?.HttpContext?.User?.FindFirst("org_id")?.Value;
            return int.TryParse(orgStr, out var oid) ? oid : null;
        }
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<OrgRolePermission> OrgRolePermissions => Set<OrgRolePermission>();
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
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrgSalesSettings> OrgSalesSettings => Set<OrgSalesSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var encKey = _configuration?["Encryption:Key"];
        if (string.IsNullOrWhiteSpace(encKey))
            encKey = new string('x', 32);
#pragma warning disable CS8619
        var strConv = new EncryptedStringConverter(encKey);
#pragma warning restore CS8619
        var decConv = new EncryptedDecimalConverter(encKey);
        var decNullConv = new EncryptedNullableDecimalConverter(encKey);

        // ─── Users ─────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasMaxLength(20).HasDefaultValue("EMPLOYEE");
            e.Property(u => u.TotpSecret).HasConversion(strConv);
        });

        // ─── Permissions ───────────────────────────────────
        modelBuilder.Entity<Permission>(e =>
        {
            e.ToTable("permissions");
            e.HasIndex(p => p.Code).IsUnique();
        });

        // ─── OrgRolePermissions ────────────────────────────
        modelBuilder.Entity<OrgRolePermission>(e =>
        {
            e.ToTable("org_role_permissions");
            e.HasIndex(o => new { o.OrgId, o.Role, o.PermissionCode }).IsUnique();
            e.HasOne(o => o.Organization).WithMany(org => org.RolePermissions)
                .HasForeignKey(o => o.OrgId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Contacts ──────────────────────────────────────
        modelBuilder.Entity<Contact>(e =>
        {
            e.ToTable("contacts");
            e.HasIndex(c => c.EntityType);
            e.HasIndex(c => c.Status);
            e.HasIndex(c => c.Company);
            e.HasIndex(c => c.UserId);
            e.HasIndex(c => c.OrgId);
            e.HasIndex(c => new { c.UserId, c.CreatedAt });
            e.Property(c => c.Name).HasConversion(strConv);
            e.Property(c => c.Phone).HasConversion(strConv);
            e.Property(c => c.Gstin).HasConversion(strConv);
            e.Property(c => c.JobTitle).HasConversion(strConv);
        });

        // ─── Contact Columns ───────────────────────────────
        modelBuilder.Entity<ContactColumn>(e =>
        {
            e.ToTable("contact_columns");
            e.HasIndex(c => new { c.OrgId, c.ColId }).IsUnique();
            e.Property(c => c.Config).HasColumnType("jsonb");
        });

        // ─── Projects ──────────────────────────────────────
        modelBuilder.Entity<Project>(e =>
        {
            e.ToTable("projects");
            e.Property(p => p.History).HasColumnType("jsonb");
            e.Property(p => p.Stages).HasColumnType("jsonb");
            e.HasIndex(p => p.UserId);
            e.HasIndex(p => p.OrgId);
            e.Property(p => p.ClientName).HasConversion(strConv);
            e.Property(p => p.Phone).HasConversion(strConv);
        });

        // ─── Tasks ─────────────────────────────────────────
        modelBuilder.Entity<TaskItem>(e =>
        {
            e.ToTable("tasks");
            e.Property(t => t.Values).HasColumnType("jsonb");
            e.HasIndex(t => t.UserId);
            e.HasIndex(t => t.OrgId);
        });

        // ─── Task Columns ──────────────────────────────────
        modelBuilder.Entity<TaskColumn>(e =>
        {
            e.ToTable("task_columns");
            e.HasIndex(c => new { c.OrgId, c.ColId }).IsUnique();
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

        modelBuilder.Entity<Milestone>(e => e.ToTable("milestones"));
        modelBuilder.Entity<Stakeholder>(e => e.ToTable("stakeholders"));
        modelBuilder.Entity<Charge>(e => e.ToTable("charges"));

        // ─── Expenses ──────────────────────────────────────
        modelBuilder.Entity<Expense>(e =>
        {
            e.ToTable("expenses");
            e.Property(ex => ex.Details).HasColumnType("jsonb");
            e.HasIndex(ex => ex.UserId);
            e.HasIndex(ex => ex.OrgId);
            e.HasIndex(ex => new { ex.UserId, ex.Date });
            e.Property(ex => ex.Amount).HasConversion(decConv);
        });

        // ─── Incomes ───────────────────────────────────────
        modelBuilder.Entity<Income>(e =>
        {
            e.ToTable("incomes");
            e.HasIndex(i => i.UserId);
            e.HasIndex(i => i.OrgId);
            e.HasIndex(i => new { i.UserId, i.Date });
            e.Property(i => i.Amount).HasConversion(decConv);
        });

        // ─── Timesheet Entries ─────────────────────────────
        modelBuilder.Entity<TimesheetEntry>(e =>
        {
            e.ToTable("timesheet_entries");
            e.Property(te => te.Values).HasColumnType("jsonb");
            e.HasIndex(te => te.UserId);
            e.HasIndex(te => te.OrgId);
        });

        // ─── Timesheet Columns ─────────────────────────────
        modelBuilder.Entity<TimesheetColumn>(e =>
        {
            e.ToTable("timesheet_columns");
            e.HasIndex(c => new { c.OrgId, c.ColId }).IsUnique();
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
            e.HasIndex(a => a.OrgId);
            e.HasIndex(a => new { a.EntityType, a.EntityId });
        });

        // ─── Notifications ───────────────────────────────
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasIndex(n => n.UserId);
            e.HasIndex(n => n.OrgId);
            e.HasIndex(n => new { n.UserId, n.IsRead });
        });

        // ─── Saved Filters ──────────────────────────────
        modelBuilder.Entity<SavedFilter>(e =>
        {
            e.ToTable("saved_filters");
            e.HasIndex(f => f.UserId);
            e.HasIndex(f => f.OrgId);
        });

        // ─── Notes ───────────────────────────────────────
        modelBuilder.Entity<Note>(e =>
        {
            e.ToTable("notes");
            e.HasIndex(n => n.UserId);
            e.HasIndex(n => n.OrgId);
            e.HasIndex(n => new { n.EntityType, n.EntityId });
        });

        // ─── Tags ────────────────────────────────────────
        modelBuilder.Entity<Tag>(e =>
        {
            e.ToTable("tags");
            e.HasIndex(t => t.UserId);
            e.HasIndex(t => t.OrgId);
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
            e.HasIndex(t => t.OrgId);
        });

        // ─── Documents ───────────────────────────────────
        modelBuilder.Entity<Document>(e =>
        {
            e.ToTable("documents");
            e.HasIndex(d => d.UserId);
            e.HasIndex(d => d.OrgId);
            e.HasIndex(d => new { d.EntityType, d.EntityId });
            e.Property(d => d.FileUrl).HasConversion(strConv);
        });

        // ─── Companies ───────────────────────────────────
        modelBuilder.Entity<Company>(e =>
        {
            e.ToTable("companies");
            e.HasIndex(c => c.UserId);
            e.HasIndex(c => c.OrgId);
            e.HasIndex(c => c.Name);
            e.Property(c => c.Name).HasConversion(strConv);
            e.Property(c => c.Gstin).HasConversion(strConv);
        });

        // ─── Leads ───────────────────────────────────────
        modelBuilder.Entity<Lead>(e =>
        {
            e.ToTable("leads");
            e.HasIndex(l => l.UserId);
            e.HasIndex(l => l.OrgId);
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
            e.HasIndex(l => l.OrgId);
            e.HasIndex(l => l.Status);
            e.HasIndex(l => l.Type);
            e.HasIndex(l => l.ExpiryDate);
        });

        // ─── Tickets ─────────────────────────────────────
        modelBuilder.Entity<Ticket>(e =>
        {
            e.ToTable("tickets");
            e.HasIndex(t => t.UserId);
            e.HasIndex(t => t.OrgId);
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

        // ─── Organizations ────────────────────────────────
        modelBuilder.Entity<Organization>(e =>
        {
            e.ToTable("organizations");
            e.HasIndex(o => o.Slug).IsUnique();
            e.HasMany(o => o.Members).WithOne(u => u.Organization)
                .HasForeignKey(u => u.OrgId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(o => o.SalesSettings).WithOne(s => s.Organization)
                .HasForeignKey<OrgSalesSettings>(s => s.OrgId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── OrgSalesSettings ─────────────────────────────
        modelBuilder.Entity<OrgSalesSettings>(e =>
        {
            e.ToTable("org_sales_settings");
            e.HasIndex(s => s.OrgId).IsUnique();
            e.Property(s => s.ProductStages).HasColumnType("jsonb");
            e.Property(s => s.ServiceStages).HasColumnType("jsonb");
            e.Property(s => s.DeliveryStages).HasColumnType("jsonb");
            e.Property(s => s.FinanceStages).HasColumnType("jsonb");
            e.Property(s => s.LegalStages).HasColumnType("jsonb");
        });

        // ─── Invoices ─────────────────────────────────────
        modelBuilder.Entity<Invoice>(e =>
        {
            e.ToTable("invoices");
            e.HasIndex(i => i.UserId);
            e.HasIndex(i => i.OrgId);
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

        // ─── Seed: Permission codes ──────────────────────
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
            foreach (var action in actions)
                permissions.Add(new Permission
                {
                    Id = id++,
                    Module = module,
                    Action = action,
                    Code = $"{module.ToLower()}.{action.ToLower()}",
                    Description = $"{action} access to {module}"
                });
        modelBuilder.Entity<Permission>().HasData(permissions);

        // ─── Seed: SUPER_ADMIN user ──────────────────────
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Email = "superadmin@platform.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperAdmin@123!"),
            DisplayName = "Super Admin",
            Role = "SUPER_ADMIN",
            IsFirstLogin = false,
            IsActive = true,
            OrgId = null,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        // ─── Global query filters: soft-delete + org scope ────
        // Single pass combines both filters so EF Core has one filter per type.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
            .Where(t => !t.ClrType.IsAbstract))
        {
            var clrType = entityType.ClrType;
            var param = System.Linq.Expressions.Expression.Parameter(clrType, "e");
            System.Linq.Expressions.Expression? combined = null;

            // Soft-delete: AuditableEntity types
            if (typeof(AuditableEntity).IsAssignableFrom(clrType))
            {
                var isDeleted = System.Linq.Expressions.Expression.Property(param, nameof(AuditableEntity.IsDeleted));
                combined = System.Linq.Expressions.Expression.Equal(isDeleted, System.Linq.Expressions.Expression.Constant(false));
            }

            // Org scope: IOrgScoped types — SUPER_ADMIN bypasses, everyone else sees only their org
            if (typeof(IOrgScoped).IsAssignableFrom(clrType))
            {
                var thisConst = System.Linq.Expressions.Expression.Constant(this);
                var isSuperAdminExpr = System.Linq.Expressions.Expression.Property(thisConst, nameof(IsSuperAdmin));
                var orgIdProp = System.Linq.Expressions.Expression.Property(param, "OrgId");
                var currentOrgIdExpr = System.Linq.Expressions.Expression.Property(thisConst, nameof(CurrentOrgId));

                // CurrentOrgId is int? — coalesce to 0 (no real org has ID 0) so .Value
                // is never accessed on a null, which avoids InvalidOperationException
                // during login before the JWT is present in the HTTP context.
                var safeOrgId = System.Linq.Expressions.Expression.Coalesce(
                    currentOrgIdExpr,
                    System.Linq.Expressions.Expression.Constant(0));
                var orgEquals = System.Linq.Expressions.Expression.Equal(orgIdProp, safeOrgId);
                var orgFilter = System.Linq.Expressions.Expression.OrElse(isSuperAdminExpr, orgEquals);

                combined = combined != null
                    ? System.Linq.Expressions.Expression.AndAlso(combined, orgFilter)
                    : orgFilter;
            }

            if (combined != null)
                entityType.SetQueryFilter(System.Linq.Expressions.Expression.Lambda(combined, param));
        }

        // ─── Snake case column naming convention ───────────
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
            foreach (var property in entity.GetProperties())
                property.SetColumnName(ToSnakeCase(property.Name));
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        NormalizeDateTimeKinds();

        var now = DateTime.UtcNow;
        var claimsPrincipal = _httpContextAccessor?.HttpContext?.User;
        var userIdStr = claimsPrincipal?.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? claimsPrincipal?.FindFirstValue("sub");
        var userId = int.TryParse(userIdStr, out var uid) ? (int?)uid : null;
        var userName = claimsPrincipal?.FindFirstValue(ClaimTypes.Name)
                    ?? claimsPrincipal?.FindFirstValue("name");

        if (string.IsNullOrEmpty(userName) && userId.HasValue)
            userName = await GetDisplayNameAsync(userId.Value);

        userName ??= "System";
        var ipAddress = _httpContextAccessor?.HttpContext?.Connection?.RemoteIpAddress?.ToString();

        var auditEntries = new List<AuditLog>();
        var softDeleteFields = new HashSet<string> { "IsDeleted", "DeletedAt", "DeletedByUserId", "DeletedByName" };

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

                var entityNameForCreate = entry.Entity.GetType().Name;
                auditEntries.Add(new AuditLog
                {
                    EntityName = entityNameForCreate,
                    EntityId = 0,
                    FieldName = "_record",
                    OldValue = null,
                    NewValue = "created",
                    Action = "Created",
                    Description = BuildDescription("Created", entityNameForCreate, "_record", null, null),
                    ChangedByUserId = userId ?? 0,
                    ChangedByName = userName,
                    ChangedAt = now,
                    IpAddress = ipAddress
                });
            }
            else if (entry.State == EntityState.Modified)
            {
                var isSoftDelete = entry.Entity.IsDeleted &&
                    entry.Property(nameof(AuditableEntity.IsDeleted)).IsModified &&
                    !(bool)(entry.Property(nameof(AuditableEntity.IsDeleted)).OriginalValue ?? false);

                if (isSoftDelete)
                {
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedByUserId = userId;
                    entry.Entity.DeletedByName = userName;

                    var entityNameForDelete = entry.Entity.GetType().Name;
                    auditEntries.Add(new AuditLog
                    {
                        EntityName = entityNameForDelete,
                        EntityId = entry.Entity.Id,
                        FieldName = "_record",
                        OldValue = "existed",
                        NewValue = null,
                        Action = "Deleted",
                        Description = BuildDescription("Deleted", entityNameForDelete, "_record", null, null),
                        ChangedByUserId = userId ?? 0,
                        ChangedByName = userName,
                        ChangedAt = now,
                        IpAddress = ipAddress
                    });
                }
                else
                {
                    entry.Entity.UpdatedAt = now;
                    if (userId.HasValue)
                    {
                        entry.Entity.UpdatedByUserId = userId;
                        entry.Entity.UpdatedByName = userName;
                    }

                    var skipFields = new HashSet<string>(softDeleteFields)
                        { "UpdatedAt", "UpdatedByUserId", "UpdatedByName" };

                    var entityNameForUpdate = entry.Entity.GetType().Name;
                    foreach (var prop in entry.Properties
                        .Where(p => p.IsModified && !skipFields.Contains(p.Metadata.Name)))
                    {
                        var oldVal = prop.OriginalValue?.ToString();
                        var newVal = prop.CurrentValue?.ToString();
                        if (oldVal == newVal) continue;

                        var propName = prop.Metadata.Name;
                        auditEntries.Add(new AuditLog
                        {
                            EntityName = entityNameForUpdate,
                            EntityId = entry.Entity.Id,
                            FieldName = GetFieldLabel(propName),
                            OldValue = oldVal,
                            NewValue = newVal,
                            Action = "Updated",
                            Description = BuildDescription("Updated", entityNameForUpdate, propName, oldVal, newVal),
                            ChangedByUserId = userId ?? 0,
                            ChangedByName = userName,
                            ChangedAt = now,
                            IpAddress = ipAddress
                        });
                    }
                }
            }
            else if (entry.State == EntityState.Deleted)
            {
                var entityNameForHardDelete = entry.Entity.GetType().Name;
                auditEntries.Add(new AuditLog
                {
                    EntityName = entityNameForHardDelete,
                    EntityId = entry.Entity.Id,
                    FieldName = "_record",
                    OldValue = "existed",
                    NewValue = null,
                    Action = "Deleted",
                    Description = BuildDescription("Deleted", entityNameForHardDelete, "_record", null, null),
                    ChangedByUserId = userId ?? 0,
                    ChangedByName = userName,
                    ChangedAt = now,
                    IpAddress = ipAddress
                });
            }
        }

        var addedSnapshots = ChangeTracker.Entries<AuditableEntity>()
            .Where(e => e.State == EntityState.Added)
            .Select(e => (entry: e, log: auditEntries.FirstOrDefault(l => l.Action == "Created" && l.EntityName == e.Entity.GetType().Name && l.EntityId == 0)))
            .Where(x => x.log != null)
            .ToList();

        var result = await base.SaveChangesAsync(cancellationToken);

        foreach (var (entry, log) in addedSnapshots)
            if (log != null) log.EntityId = entry.Entity.Id;

        if (auditEntries.Count > 0)
        {
            if (_auditChannel != null)
                await _auditChannel.WriteAsync(auditEntries, cancellationToken);
            else
            {
                AuditLogs.AddRange(auditEntries);
                await base.SaveChangesAsync(cancellationToken);
            }
        }

        return result;
    }

    public Task<int> SaveChangesWithoutAuditAsync(CancellationToken cancellationToken = default)
        => base.SaveChangesAsync(cancellationToken);

    private void NormalizeDateTimeKinds()
    {
        foreach (var entry in ChangeTracker.Entries()
                     .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified))
        {
            foreach (var property in entry.Properties)
            {
                if (property.CurrentValue is DateTime dt && dt.Kind != DateTimeKind.Utc)
                    property.CurrentValue = NormalizeDateTime(dt);
            }
        }
    }

    private static DateTime NormalizeDateTime(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private async Task<string?> GetDisplayNameAsync(int userId)
    {
        try
        {
            var connStr = _configuration?.GetConnectionString("DefaultConnection");
            if (connStr == null) return null;
            using var conn = new NpgsqlConnection(connStr);
            return await conn.ExecuteScalarAsync<string?>(
                "SELECT display_name FROM users WHERE id = @Id", new { Id = userId });
        }
        catch { return null; }
    }

    private static string ToSnakeCase(string name) =>
        string.Concat(name.Select((c, i) =>
            i > 0 && char.IsUpper(c) ? "_" + c.ToString().ToLower() : c.ToString().ToLower()));

    // ─── Audit description helpers ─────────────────────────────────
    private static readonly Dictionary<string, string> _fieldLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["JobTitle"]           = "Job Title",
        ["ClientAddress"]      = "Client Address",
        ["ClientCountry"]      = "Country",
        ["InternationalTaxId"] = "International Tax ID",
        ["MsmeStatus"]         = "MSME Status",
        ["TdsSection"]         = "TDS Section",
        ["TdsRate"]            = "TDS Rate",
        ["EntityType"]         = "Entity Type",
        ["CompanyId"]          = "Company",
        ["UserId"]             = "User",
        ["OrgId"]              = "Organization",
        ["IsDeleted"]          = "Deleted",
        ["CreatedAt"]          = "Created At",
        ["UpdatedAt"]          = "Updated At",
        ["AssignedToUserId"]   = "Assigned To",
        ["AssignedToName"]     = "Assigned To",
        ["DueDate"]            = "Due Date",
        ["ResolvedAt"]         = "Resolved At",
        ["ClosedAt"]           = "Closed At",
        ["IsAiGenerated"]      = "AI Generated",
        ["AiSource"]           = "AI Source",
        ["AiConfidence"]       = "AI Confidence",
        ["AiRawInput"]         = "AI Input",
        ["TicketNumber"]       = "Ticket Number",
        ["ContactId"]          = "Contact",
        ["ProjectId"]          = "Project",
        ["LeadId"]             = "Lead",
        ["InvoiceId"]          = "Invoice",
        ["ReceiptUrl"]         = "Receipt",
        ["ProjectDepartment"]  = "Project / Department",
        ["EmployeeName"]       = "Employee",
        ["StartTime"]          = "Start Time",
        ["EndTime"]            = "End Time",
        ["HoursWorked"]        = "Hours Worked",
        ["BillableHours"]      = "Billable Hours",
        ["ExpiryDate"]         = "Expiry Date",
        ["SignedAt"]           = "Signed At",
        ["FileUrl"]            = "File",
        ["InvoiceNumber"]      = "Invoice Number",
        ["SubTotal"]           = "Sub Total",
        ["TaxAmount"]          = "Tax Amount",
        ["TotalAmount"]        = "Total Amount",
        ["ClientName"]         = "Client Name",
        ["ClientGstin"]        = "Client GSTIN",
        ["IsTotpEnabled"]      = "TOTP Enabled",
        ["TwoFactorRequired"]  = "2FA Required",
        ["TwoFactorMethod"]    = "2FA Method",
        ["IsFirstLogin"]       = "First Login",
        ["IsActive"]           = "Active",
        ["PasswordHash"]       = "Password",
        ["PermissionCode"]     = "Permission",
        ["ColId"]              = "Column ID",
        ["ProductStages"]      = "Product Stages",
        ["ServiceStages"]      = "Service Stages",
        ["DeliveryStages"]     = "Delivery Stages",
        ["FinanceStages"]      = "Finance Stages",
        ["LegalStages"]        = "Legal Stages",
        ["ProductLabel"]       = "Product Label",
        ["ServiceLabel"]       = "Service Label",
        ["TrialEndsAt"]        = "Trial Ends At",
        ["SuspendedAt"]        = "Suspended At",
        ["UserLimit"]          = "User Limit",
        ["MatchScore"]         = "Match Score",
        ["MatchLabel"]         = "Match Label",
        ["MatchPercentage"]    = "Match Percentage",
    };

    private static string GetFieldLabel(string propName)
    {
        if (_fieldLabels.TryGetValue(propName, out var label)) return label;
        // Split PascalCase: "JobTitle" → "Job Title", "GSTIN" stays "GSTIN"
        return Regex.Replace(propName, @"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ");
    }

    private static string BuildDescription(string action, string entityName, string fieldName, string? oldValue, string? newValue)
    {
        var entity = Regex.Replace(entityName, @"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ");

        if (fieldName == "_record")
        {
            return action switch
            {
                "Created" => $"{entity} was created",
                "Deleted" => $"{entity} was deleted",
                _         => $"{entity} was {action.ToLower()}"
            };
        }

        var label = GetFieldLabel(fieldName);

        if (action == "Updated")
        {
            if (!string.IsNullOrEmpty(oldValue) && !string.IsNullOrEmpty(newValue))
                return $"{label} was changed";
            if (!string.IsNullOrEmpty(newValue))
                return $"{label} was set";
            if (!string.IsNullOrEmpty(oldValue))
                return $"{label} was cleared";
            return $"{label} was updated";
        }

        return $"{label} was {action.ToLower()}";
    }
}
