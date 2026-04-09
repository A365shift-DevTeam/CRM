using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectStages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "stages",
                table: "projects",
                type: "jsonb",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 9, 5, 16, 23, 748, DateTimeKind.Utc).AddTicks(2974));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 9, 5, 16, 23, 748, DateTimeKind.Utc).AddTicks(2982));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 9, 5, 16, 23, 748, DateTimeKind.Utc).AddTicks(2986));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "stages",
                table: "projects");

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
    }
}
