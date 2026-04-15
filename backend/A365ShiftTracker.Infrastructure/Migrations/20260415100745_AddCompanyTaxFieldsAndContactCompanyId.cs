using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyTaxFieldsAndContactCompanyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "company_id",
                table: "contacts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cin",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "international_tax_id",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "msme_status",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "pan",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "tds_rate",
                table: "companies",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tds_section",
                table: "companies",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 15, 10, 7, 43, 558, DateTimeKind.Utc).AddTicks(4386));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 15, 10, 7, 43, 558, DateTimeKind.Utc).AddTicks(4395));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 15, 10, 7, 43, 558, DateTimeKind.Utc).AddTicks(4396));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "company_id",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "cin",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "international_tax_id",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "msme_status",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "pan",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "tds_rate",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "tds_section",
                table: "companies");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 14, 14, 20, 14, 623, DateTimeKind.Utc).AddTicks(6826));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 14, 14, 20, 14, 623, DateTimeKind.Utc).AddTicks(6835));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 14, 14, 20, 14, 623, DateTimeKind.Utc).AddTicks(6837));
        }
    }
}
