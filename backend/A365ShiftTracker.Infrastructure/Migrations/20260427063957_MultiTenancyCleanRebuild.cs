using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MultiTenancyCleanRebuild : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF EXISTS for all drops — safe whether or not objects exist in the DB
            migrationBuilder.Sql("DROP TABLE IF EXISTS role_permissions CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS user_roles CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS roles CASCADE;");

            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_timesheet_columns_col_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_task_columns_col_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_contact_columns_col_id\";");

            // Drop plan columns from users if they exist
            migrationBuilder.Sql("ALTER TABLE users DROP COLUMN IF EXISTS plan;");
            migrationBuilder.Sql("ALTER TABLE users DROP COLUMN IF EXISTS plan_expires_at;");
            migrationBuilder.Sql("ALTER TABLE users DROP COLUMN IF EXISTS plan_purchased_at;");

            migrationBuilder.Sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT false;");
            migrationBuilder.Sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS role character varying(20) NOT NULL DEFAULT 'EMPLOYEE'::character varying;");

            // Add org_id and new columns using IF NOT EXISTS — safe on rerun
            migrationBuilder.Sql("ALTER TABLE timesheet_entries   ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE timesheet_columns   ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE tasks               ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE task_columns        ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE saved_filters       ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE notifications       ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE incomes             ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE expenses            ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE email_templates     ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE contact_columns     ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("ALTER TABLE activity_logs       ADD COLUMN IF NOT EXISTS org_id integer NOT NULL DEFAULT 0;");

            migrationBuilder.Sql("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'TRIAL';");
            migrationBuilder.Sql("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;");
            migrationBuilder.Sql("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS org_role_permissions (
                    id SERIAL PRIMARY KEY,
                    org_id integer NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                    role text NOT NULL,
                    permission_code text NOT NULL,
                    CONSTRAINT uq_org_role_perm UNIQUE (org_id, role, permission_code)
                );");

            // Seed SUPER_ADMIN user — skip if already exists
            migrationBuilder.Sql(@"
                INSERT INTO users (id, created_at, display_name, email, is_active, is_first_login,
                    is_totp_enabled, last_login_at, org_id, otp_code, otp_expiry, password_hash,
                    reset_token, reset_token_expiry, role, totp_secret, two_factor_method, two_factor_required)
                VALUES (1, '2026-01-01 00:00:00Z', 'Super Admin', 'superadmin@platform.com',
                    true, false, false, null, null, null, null,
                    '$2a$11$A6WDAzHrcOZteKMZQk9Ch.2lyNSKmJi0IFC61MgVb9612wtgGbmN2',
                    null, null, 'SUPER_ADMIN', null, 'email', false)
                ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', is_first_login = false;");

            // Create indexes using IF NOT EXISTS (PostgreSQL 9.5+)
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_timesheet_entries_org_id\" ON timesheet_entries (org_id);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_timesheet_columns_org_id_col_id\" ON timesheet_columns (org_id, col_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_tickets_org_id\" ON tickets (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_tasks_org_id\" ON tasks (org_id);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_task_columns_org_id_col_id\" ON task_columns (org_id, col_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_tags_org_id\" ON tags (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_saved_filters_org_id\" ON saved_filters (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_notifications_org_id\" ON notifications (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_notes_org_id\" ON notes (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_legal_agreements_org_id\" ON legal_agreements (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_invoices_org_id\" ON invoices (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_incomes_org_id\" ON incomes (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_expenses_org_id\" ON expenses (org_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_email_templates_org_id\" ON email_templates (org_id);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_contact_columns_org_id_col_id\" ON contact_columns (org_id, col_id);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_activity_logs_org_id\" ON activity_logs (org_id);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_org_role_permissions_org_id_role_permission_code\" ON org_role_permissions (org_id, role, permission_code);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "org_role_permissions");

            migrationBuilder.DropIndex(
                name: "IX_timesheet_entries_org_id",
                table: "timesheet_entries");

            migrationBuilder.DropIndex(
                name: "IX_timesheet_columns_org_id_col_id",
                table: "timesheet_columns");

            migrationBuilder.DropIndex(
                name: "IX_tickets_org_id",
                table: "tickets");

            migrationBuilder.DropIndex(
                name: "IX_tasks_org_id",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_task_columns_org_id_col_id",
                table: "task_columns");

            migrationBuilder.DropIndex(
                name: "IX_tags_org_id",
                table: "tags");

            migrationBuilder.DropIndex(
                name: "IX_saved_filters_org_id",
                table: "saved_filters");

            migrationBuilder.DropIndex(
                name: "IX_notifications_org_id",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "IX_notes_org_id",
                table: "notes");

            migrationBuilder.DropIndex(
                name: "IX_legal_agreements_org_id",
                table: "legal_agreements");

            migrationBuilder.DropIndex(
                name: "IX_invoices_org_id",
                table: "invoices");

            migrationBuilder.DropIndex(
                name: "IX_incomes_org_id",
                table: "incomes");

            migrationBuilder.DropIndex(
                name: "IX_expenses_org_id",
                table: "expenses");

            migrationBuilder.DropIndex(
                name: "IX_email_templates_org_id",
                table: "email_templates");

            migrationBuilder.DropIndex(
                name: "IX_contact_columns_org_id_col_id",
                table: "contact_columns");

            migrationBuilder.DropIndex(
                name: "IX_activity_logs_org_id",
                table: "activity_logs");

            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "id",
                keyValue: 1);

            migrationBuilder.DropColumn(
                name: "is_first_login",
                table: "users");

            migrationBuilder.DropColumn(
                name: "role",
                table: "users");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "status",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "suspended_at",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "trial_ends_at",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "activity_logs");

            migrationBuilder.AddColumn<string>(
                name: "plan",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Free");

            migrationBuilder.AddColumn<DateTime>(
                name: "plan_expires_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "plan_purchased_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    permission_id = table.Column<int>(type: "integer", nullable: false),
                    role_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_role_permissions_permissions_permission_id",
                        column: x => x.permission_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_role_permissions_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_roles_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "created_at", "description", "is_system", "name" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 4, 24, 10, 47, 17, 981, DateTimeKind.Utc).AddTicks(230), "Full access to all features", true, "Admin" },
                    { 2, new DateTime(2026, 4, 24, 10, 47, 17, 981, DateTimeKind.Utc).AddTicks(1104), "Can manage teams and view reports", true, "Manager" },
                    { 3, new DateTime(2026, 4, 24, 10, 47, 17, 981, DateTimeKind.Utc).AddTicks(1107), "Standard user with limited access", true, "User" }
                });

            migrationBuilder.InsertData(
                table: "role_permissions",
                columns: new[] { "id", "permission_id", "role_id" },
                values: new object[,]
                {
                    { 1, 1, 1 },
                    { 2, 2, 1 },
                    { 3, 3, 1 },
                    { 4, 4, 1 },
                    { 5, 5, 1 },
                    { 6, 6, 1 },
                    { 7, 7, 1 },
                    { 8, 8, 1 },
                    { 9, 9, 1 },
                    { 10, 10, 1 },
                    { 11, 11, 1 },
                    { 12, 12, 1 },
                    { 13, 13, 1 },
                    { 14, 14, 1 },
                    { 15, 15, 1 },
                    { 16, 16, 1 },
                    { 17, 17, 1 },
                    { 18, 18, 1 },
                    { 19, 19, 1 },
                    { 20, 20, 1 },
                    { 21, 21, 1 },
                    { 22, 22, 1 },
                    { 23, 23, 1 },
                    { 24, 24, 1 },
                    { 25, 25, 1 },
                    { 26, 26, 1 },
                    { 27, 27, 1 },
                    { 28, 28, 1 },
                    { 29, 29, 1 },
                    { 30, 30, 1 },
                    { 31, 31, 1 },
                    { 32, 32, 1 },
                    { 33, 33, 1 },
                    { 34, 34, 1 },
                    { 35, 35, 1 },
                    { 36, 36, 1 },
                    { 37, 37, 1 },
                    { 38, 38, 1 },
                    { 39, 39, 1 },
                    { 40, 40, 1 },
                    { 41, 41, 1 },
                    { 42, 42, 1 },
                    { 43, 43, 1 },
                    { 44, 44, 1 },
                    { 45, 45, 1 },
                    { 46, 46, 1 },
                    { 47, 47, 1 },
                    { 48, 48, 1 },
                    { 49, 49, 1 },
                    { 50, 50, 1 },
                    { 51, 51, 1 },
                    { 52, 52, 1 },
                    { 53, 53, 1 },
                    { 54, 54, 1 },
                    { 55, 55, 1 },
                    { 56, 56, 1 },
                    { 57, 57, 1 },
                    { 58, 58, 1 },
                    { 59, 59, 1 },
                    { 60, 60, 1 },
                    { 61, 61, 1 },
                    { 62, 62, 1 },
                    { 63, 63, 1 },
                    { 64, 64, 1 },
                    { 65, 65, 1 },
                    { 66, 66, 1 },
                    { 67, 67, 1 },
                    { 68, 68, 1 },
                    { 69, 1, 3 },
                    { 70, 5, 3 },
                    { 71, 9, 3 },
                    { 72, 13, 3 },
                    { 73, 17, 3 },
                    { 74, 21, 3 },
                    { 75, 25, 3 },
                    { 76, 29, 3 },
                    { 77, 37, 3 },
                    { 78, 41, 3 },
                    { 79, 45, 3 },
                    { 80, 49, 3 },
                    { 81, 53, 3 },
                    { 82, 57, 3 },
                    { 83, 61, 3 },
                    { 84, 65, 3 },
                    { 85, 22, 3 },
                    { 86, 23, 3 },
                    { 87, 14, 3 },
                    { 88, 15, 3 },
                    { 89, 1, 2 },
                    { 90, 2, 2 },
                    { 91, 3, 2 },
                    { 92, 4, 2 },
                    { 93, 5, 2 },
                    { 94, 6, 2 },
                    { 95, 7, 2 },
                    { 96, 8, 2 },
                    { 97, 9, 2 },
                    { 98, 10, 2 },
                    { 99, 11, 2 },
                    { 100, 12, 2 },
                    { 101, 13, 2 },
                    { 102, 14, 2 },
                    { 103, 15, 2 },
                    { 104, 16, 2 },
                    { 105, 17, 2 },
                    { 106, 18, 2 },
                    { 107, 19, 2 },
                    { 108, 20, 2 },
                    { 109, 21, 2 },
                    { 110, 22, 2 },
                    { 111, 23, 2 },
                    { 112, 24, 2 },
                    { 113, 25, 2 },
                    { 114, 26, 2 },
                    { 115, 27, 2 },
                    { 116, 28, 2 },
                    { 117, 29, 2 },
                    { 118, 30, 2 },
                    { 119, 31, 2 },
                    { 120, 32, 2 },
                    { 121, 37, 2 },
                    { 122, 38, 2 },
                    { 123, 39, 2 },
                    { 124, 40, 2 },
                    { 125, 41, 2 },
                    { 126, 42, 2 },
                    { 127, 43, 2 },
                    { 128, 44, 2 },
                    { 129, 45, 2 },
                    { 130, 46, 2 },
                    { 131, 47, 2 },
                    { 132, 48, 2 },
                    { 133, 49, 2 },
                    { 134, 50, 2 },
                    { 135, 51, 2 },
                    { 136, 52, 2 },
                    { 137, 53, 2 },
                    { 138, 54, 2 },
                    { 139, 55, 2 },
                    { 140, 56, 2 },
                    { 141, 57, 2 },
                    { 142, 58, 2 },
                    { 143, 59, 2 },
                    { 144, 60, 2 },
                    { 145, 61, 2 },
                    { 146, 62, 2 },
                    { 147, 63, 2 },
                    { 148, 64, 2 },
                    { 149, 65, 2 },
                    { 150, 66, 2 },
                    { 151, 67, 2 },
                    { 152, 68, 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_timesheet_columns_col_id",
                table: "timesheet_columns",
                column: "col_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_task_columns_col_id",
                table: "task_columns",
                column: "col_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_contact_columns_col_id",
                table: "contact_columns",
                column: "col_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_permission_id",
                table: "role_permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_role_id_permission_id",
                table: "role_permissions",
                columns: new[] { "role_id", "permission_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_name",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_role_id",
                table: "user_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_user_id_role_id",
                table: "user_roles",
                columns: new[] { "user_id", "role_id" },
                unique: true);
        }
    }
}
