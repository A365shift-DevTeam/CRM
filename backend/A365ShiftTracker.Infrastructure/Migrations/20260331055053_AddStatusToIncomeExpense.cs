using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusToIncomeExpense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "incomes",
                type: "text",
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "expenses",
                type: "text",
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 3, 31, 5, 50, 52, 841, DateTimeKind.Utc).AddTicks(1956));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 3, 31, 5, 50, 52, 841, DateTimeKind.Utc).AddTicks(1963));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 3, 31, 5, 50, 52, 841, DateTimeKind.Utc).AddTicks(1966));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "status",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "status",
                table: "expenses");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 3, 30, 10, 42, 8, 848, DateTimeKind.Utc).AddTicks(9206));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 3, 30, 10, 42, 8, 848, DateTimeKind.Utc).AddTicks(9223));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 3, 30, 10, 42, 8, 848, DateTimeKind.Utc).AddTicks(9225));
        }
    }
}
