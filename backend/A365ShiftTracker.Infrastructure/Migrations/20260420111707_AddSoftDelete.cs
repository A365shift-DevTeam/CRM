using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "timesheet_entries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "timesheet_entries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "timesheet_entries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "timesheet_entries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "timesheet_columns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "timesheet_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "timesheet_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "timesheet_columns",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "tickets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "tickets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "tickets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "tasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "task_columns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "task_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "task_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "task_columns",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "tags",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "tags",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "tags",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "tags",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "stakeholders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "stakeholders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "stakeholders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "stakeholders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "saved_filters",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "saved_filters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "saved_filters",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "saved_filters",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "projects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "projects",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "project_finances",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "project_finances",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "project_finances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "project_finances",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "notifications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "notifications",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "notes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "notes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "notes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "milestones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "milestones",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "milestones",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "milestones",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "legal_agreements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "legal_agreements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "legal_agreements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "legal_agreements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "leads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "leads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "leads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "leads",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "invoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "invoices",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "invoices",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "incomes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "incomes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "incomes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "incomes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "expenses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "expenses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "expenses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "expenses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "email_templates",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "email_templates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "email_templates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "email_templates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "documents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "documents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "contacts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "contacts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "contacts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "contact_columns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "contact_columns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "contact_columns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "contact_columns",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "companies",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "companies",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "charges",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "charges",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "charges",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "charges",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "activity_logs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by_name",
                table: "activity_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "deleted_by_user_id",
                table: "activity_logs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "activity_logs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 20, 11, 17, 3, 321, DateTimeKind.Utc).AddTicks(5424));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 20, 11, 17, 3, 321, DateTimeKind.Utc).AddTicks(6661));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 20, 11, 17, 3, 321, DateTimeKind.Utc).AddTicks(6666));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "timesheet_entries");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "timesheet_columns");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "task_columns");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "stakeholders");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "saved_filters");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "project_finances");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "milestones");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "legal_agreements");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "legal_agreements");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "legal_agreements");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "legal_agreements");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "email_templates");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "contact_columns");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "charges");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "activity_logs");

            migrationBuilder.DropColumn(
                name: "deleted_by_name",
                table: "activity_logs");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "activity_logs");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "activity_logs");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 20, 2, 45, 34, 657, DateTimeKind.Utc).AddTicks(5496));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 20, 2, 45, 34, 657, DateTimeKind.Utc).AddTicks(6355));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 20, 2, 45, 34, 657, DateTimeKind.Utc).AddTicks(6359));
        }
    }
}
