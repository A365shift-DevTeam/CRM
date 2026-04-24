using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgAndProjectStages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "org_id",
                table: "users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "delivery_stage",
                table: "projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "finance_stage",
                table: "projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "legal_stage",
                table: "projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "organizations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organizations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "org_sales_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    org_id = table.Column<int>(type: "integer", nullable: false),
                    product_stages = table.Column<string>(type: "jsonb", nullable: false),
                    service_stages = table.Column<string>(type: "jsonb", nullable: false),
                    delivery_stages = table.Column<string>(type: "jsonb", nullable: false),
                    finance_stages = table.Column<string>(type: "jsonb", nullable: false),
                    legal_stages = table.Column<string>(type: "jsonb", nullable: false),
                    product_label = table.Column<string>(type: "text", nullable: false),
                    service_label = table.Column<string>(type: "text", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_org_sales_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_org_sales_settings_organizations_org_id",
                        column: x => x.org_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_users_org_id",
                table: "users",
                column: "org_id");

            migrationBuilder.CreateIndex(
                name: "IX_org_sales_settings_org_id",
                table: "org_sales_settings",
                column: "org_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_organizations_slug",
                table: "organizations",
                column: "slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_users_organizations_org_id",
                table: "users",
                column: "org_id",
                principalTable: "organizations",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_organizations_org_id",
                table: "users");

            migrationBuilder.DropTable(
                name: "org_sales_settings");

            migrationBuilder.DropTable(
                name: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_users_org_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "org_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "delivery_stage",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "finance_stage",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "legal_stage",
                table: "projects");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 1,
                column: "created_at",
                value: new DateTime(2026, 4, 22, 5, 2, 36, 98, DateTimeKind.Utc).AddTicks(1151));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 2,
                column: "created_at",
                value: new DateTime(2026, 4, 22, 5, 2, 36, 98, DateTimeKind.Utc).AddTicks(2344));

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: 3,
                column: "created_at",
                value: new DateTime(2026, 4, 22, 5, 2, 36, 98, DateTimeKind.Utc).AddTicks(2348));
        }
    }
}
