using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgIdAndPlanFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "tags",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "notes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "legal_agreements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "leads",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "invoices",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "documents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "contacts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "companies",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 24, 10, 47, 17, 981, DateTimeKind.Utc).AddTicks(230));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 24, 10, 47, 17, 981, DateTimeKind.Utc).AddTicks(1104));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 24, 10, 47, 17, 981, DateTimeKind.Utc).AddTicks(1107));

            migrationBuilder.CreateIndex(
                name: "IX_projects_org_id",
                table: "projects",
                column: "org_id");

            migrationBuilder.CreateIndex(
                name: "IX_leads_org_id",
                table: "leads",
                column: "org_id");

            migrationBuilder.CreateIndex(
                name: "IX_documents_org_id",
                table: "documents",
                column: "org_id");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_org_id",
                table: "contacts",
                column: "org_id");

            migrationBuilder.CreateIndex(
                name: "IX_companies_org_id",
                table: "companies",
                column: "org_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_projects_org_id",
                table: "projects");

            migrationBuilder.DropIndex(
                name: "IX_leads_org_id",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "IX_documents_org_id",
                table: "documents");

            migrationBuilder.DropIndex(
                name: "IX_contacts_org_id",
                table: "contacts");

            migrationBuilder.DropIndex(
                name: "IX_companies_org_id",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "plan",
                table: "users");

            migrationBuilder.DropColumn(
                name: "plan_expires_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "plan_purchased_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "notes");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "legal_agreements");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "companies");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 24, 6, 45, 44, 193, DateTimeKind.Utc).AddTicks(7041));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 24, 6, 45, 44, 193, DateTimeKind.Utc).AddTicks(8250));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 24, 6, 45, 44, 193, DateTimeKind.Utc).AddTicks(8254));
        }
    }
}
