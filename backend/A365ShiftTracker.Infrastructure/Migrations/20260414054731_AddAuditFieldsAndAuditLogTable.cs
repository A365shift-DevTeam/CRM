using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFieldsAndAuditLogTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "timesheet_entries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "timesheet_entries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "timesheet_entries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "timesheet_entries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "timesheet_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "timesheet_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "timesheet_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "timesheet_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "task_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "task_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "task_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "task_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "tags",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "tags",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "tags",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "tags",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "stakeholders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "stakeholders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "stakeholders",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "stakeholders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "stakeholders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "saved_filters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "saved_filters",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "saved_filters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "saved_filters",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "projects",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "projects",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "project_finances",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "project_finances",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "project_finances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "project_finances",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "project_finances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "notes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "notes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "milestones",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "milestones",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "milestones",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "milestones",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "milestones",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "leads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "leads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "leads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "leads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "incomes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "incomes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "incomes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "incomes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "expenses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "expenses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "expenses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "expenses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "email_templates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "email_templates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "email_templates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "email_templates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "documents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "documents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "contacts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "contacts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "contact_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "contact_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "contact_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "contact_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "companies",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "companies",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "charges",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "charges",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "charges",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "charges",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "charges",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_name",
                table: "activity_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "activity_logs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by_name",
                table: "activity_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "activity_logs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    entity_name = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: false),
                    field_name = table.Column<string>(type: "text", nullable: false),
                    old_value = table.Column<string>(type: "text", nullable: true),
                    new_value = table.Column<string>(type: "text", nullable: true),
                    action = table.Column<string>(type: "text", nullable: false),
                    changed_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    changed_by_name = table.Column<string>(type: "text", nullable: false),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ip_address = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 14, 5, 47, 31, 229, DateTimeKind.Utc).AddTicks(983));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 14, 5, 47, 31, 229, DateTimeKind.Utc).AddTicks(990));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 14, 5, 47, 31, 229, DateTimeKind.Utc).AddTicks(992));

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_changed_at",
                table: "audit_logs",
                column: "changed_at");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_changed_by_user_id",
                table: "audit_logs",
                column: "changed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_entity_name_entity_id",
                table: "audit_logs",
                columns: new[] { "entity_name", "entity_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "created_by_name",
                table: "activity_logs");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "activity_logs");

            migrationBuilder.DropColumn(
                name: "updated_by_name",
                table: "activity_logs");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "activity_logs");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 10, 10, 37, 58, 697, DateTimeKind.Utc).AddTicks(2375));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 10, 10, 37, 58, 697, DateTimeKind.Utc).AddTicks(2381));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 10, 10, 37, 58, 697, DateTimeKind.Utc).AddTicks(2383));
        }
    }
}
