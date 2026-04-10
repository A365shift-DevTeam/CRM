using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "type",
                table: "leads",
                type: "text",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "type",
                table: "leads");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 10, 9, 25, 20, 513, DateTimeKind.Utc).AddTicks(1569));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 10, 9, 25, 20, 513, DateTimeKind.Utc).AddTicks(1578));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 10, 9, 25, 20, 513, DateTimeKind.Utc).AddTicks(1581));
        }
    }
}
