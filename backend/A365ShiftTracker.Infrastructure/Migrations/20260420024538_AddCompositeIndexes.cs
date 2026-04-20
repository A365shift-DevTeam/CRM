using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompositeIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_notifications_is_read\"");

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

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id_is_read",
                table: "notifications",
                columns: new[] { "user_id", "is_read" });

            migrationBuilder.CreateIndex(
                name: "IX_incomes_user_id_date",
                table: "incomes",
                columns: new[] { "user_id", "date" });

            migrationBuilder.CreateIndex(
                name: "IX_expenses_user_id_date",
                table: "expenses",
                columns: new[] { "user_id", "date" });

            migrationBuilder.CreateIndex(
                name: "IX_contacts_user_id_created_at",
                table: "contacts",
                columns: new[] { "user_id", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_notifications_user_id_is_read",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "IX_incomes_user_id_date",
                table: "incomes");

            migrationBuilder.DropIndex(
                name: "IX_expenses_user_id_date",
                table: "expenses");

            migrationBuilder.DropIndex(
                name: "IX_contacts_user_id_created_at",
                table: "contacts");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 17, 9, 25, 15, 144, DateTimeKind.Utc).AddTicks(9834));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 17, 9, 25, 15, 144, DateTimeKind.Utc).AddTicks(9850));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 17, 9, 25, 15, 144, DateTimeKind.Utc).AddTicks(9859));

            migrationBuilder.CreateIndex(
                name: "IX_notifications_is_read",
                table: "notifications",
                column: "is_read");
        }
    }
}
