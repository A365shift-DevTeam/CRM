using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompaniesAndLeads : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "invoice_id",
                table: "incomes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "source",
                table: "incomes",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "companies",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    industry = table.Column<string>(type: "text", nullable: true),
                    size = table.Column<string>(type: "text", nullable: true),
                    website = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    gstin = table.Column<string>(type: "text", nullable: true),
                    tags = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_companies", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "leads",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    contact_id = table.Column<int>(type: "integer", nullable: true),
                    contact_name = table.Column<string>(type: "text", nullable: false),
                    company = table.Column<string>(type: "text", nullable: true),
                    source = table.Column<string>(type: "text", nullable: false),
                    score = table.Column<string>(type: "text", nullable: false),
                    stage = table.Column<string>(type: "text", nullable: false),
                    assigned_to = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    expected_value = table.Column<decimal>(type: "numeric", nullable: true),
                    expected_close_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leads", x => x.id);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_companies_name",
                table: "companies",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_companies_user_id",
                table: "companies",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_leads_stage",
                table: "leads",
                column: "stage");

            migrationBuilder.CreateIndex(
                name: "IX_leads_user_id",
                table: "leads",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "companies");

            migrationBuilder.DropTable(
                name: "leads");

            migrationBuilder.DropColumn(
                name: "invoice_id",
                table: "incomes");

            migrationBuilder.DropColumn(
                name: "source",
                table: "incomes");

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
    }
}
