using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTwoFactorAuthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_totp_enabled",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "otp_code",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "otp_expiry",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "totp_secret",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "two_factor_method",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "two_factor_required",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_totp_enabled",
                table: "users");

            migrationBuilder.DropColumn(
                name: "otp_code",
                table: "users");

            migrationBuilder.DropColumn(
                name: "otp_expiry",
                table: "users");

            migrationBuilder.DropColumn(
                name: "totp_secret",
                table: "users");

            migrationBuilder.DropColumn(
                name: "two_factor_method",
                table: "users");

            migrationBuilder.DropColumn(
                name: "two_factor_required",
                table: "users");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 16, 6, 58, 11, 941, DateTimeKind.Utc).AddTicks(9249));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 16, 6, 58, 11, 941, DateTimeKind.Utc).AddTicks(9258));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 16, 6, 58, 11, 941, DateTimeKind.Utc).AddTicks(9261));
        }
    }
}
