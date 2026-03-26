using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace A365ShiftTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetAndNewFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "activity_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    details = table.Column<string>(type: "text", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_activity_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contact_columns",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    col_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    visible = table.Column<bool>(type: "boolean", nullable: false),
                    required = table.Column<bool>(type: "boolean", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    config = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_columns", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    job_title = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    company = table.Column<string>(type: "text", nullable: true),
                    location = table.Column<string>(type: "text", nullable: true),
                    client_address = table.Column<string>(type: "text", nullable: true),
                    client_country = table.Column<string>(type: "text", nullable: true),
                    gstin = table.Column<string>(type: "text", nullable: true),
                    pan = table.Column<string>(type: "text", nullable: true),
                    cin = table.Column<string>(type: "text", nullable: true),
                    international_tax_id = table.Column<string>(type: "text", nullable: true),
                    msme_status = table.Column<string>(type: "text", nullable: true),
                    tds_section = table.Column<string>(type: "text", nullable: true),
                    tds_rate = table.Column<decimal>(type: "numeric", nullable: true),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    rating = table.Column<decimal>(type: "numeric", nullable: true),
                    reviews = table.Column<string>(type: "text", nullable: true),
                    years = table.Column<int>(type: "integer", nullable: true),
                    margin = table.Column<decimal>(type: "numeric", nullable: true),
                    avatar = table.Column<string>(type: "text", nullable: true),
                    match_score = table.Column<decimal>(type: "numeric", nullable: true),
                    match_label = table.Column<string>(type: "text", nullable: true),
                    match_percentage = table.Column<decimal>(type: "numeric", nullable: true),
                    services = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    score = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contacts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "documents",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: false),
                    file_name = table.Column<string>(type: "text", nullable: false),
                    file_url = table.Column<string>(type: "text", nullable: false),
                    file_type = table.Column<string>(type: "text", nullable: true),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_documents", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "email_templates",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    subject = table.Column<string>(type: "text", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    variables = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "expenses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    category = table.Column<string>(type: "text", nullable: true),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    employee_name = table.Column<string>(type: "text", nullable: true),
                    project_department = table.Column<string>(type: "text", nullable: true),
                    receipt_url = table.Column<string>(type: "text", nullable: true),
                    details = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expenses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "incomes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    category = table.Column<string>(type: "text", nullable: true),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    employee_name = table.Column<string>(type: "text", nullable: true),
                    project_department = table.Column<string>(type: "text", nullable: true),
                    receipt_url = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_incomes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "notes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: true),
                    entity_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    module = table.Column<string>(type: "text", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "project_finances",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    project_id = table.Column<string>(type: "text", nullable: true),
                    client_name = table.Column<string>(type: "text", nullable: true),
                    client_address = table.Column<string>(type: "text", nullable: true),
                    client_gstin = table.Column<string>(type: "text", nullable: true),
                    delivery = table.Column<string>(type: "text", nullable: true),
                    deal_value = table.Column<decimal>(type: "numeric", nullable: true),
                    currency = table.Column<string>(type: "text", nullable: false),
                    location = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_finances", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "projects",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    custom_id = table.Column<string>(type: "text", nullable: true),
                    title = table.Column<string>(type: "text", nullable: false),
                    client_name = table.Column<string>(type: "text", nullable: true),
                    active_stage = table.Column<int>(type: "integer", nullable: false),
                    delay = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "text", nullable: true),
                    history = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_projects", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "saved_filters",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    module = table.Column<string>(type: "text", nullable: false),
                    filter_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saved_filters", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tags",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    color = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tags", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tasks",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    priority = table.Column<string>(type: "text", nullable: false),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    values = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasks", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "timesheet_columns",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    col_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    required = table.Column<bool>(type: "boolean", nullable: false),
                    visible = table.Column<bool>(type: "boolean", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    config = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_timesheet_columns", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "timesheet_entries",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    task = table.Column<string>(type: "text", nullable: true),
                    start_datetime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    end_datetime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    person = table.Column<string>(type: "text", nullable: true),
                    customer = table.Column<string>(type: "text", nullable: true),
                    site = table.Column<string>(type: "text", nullable: true),
                    attachments = table.Column<string>(type: "text", nullable: true),
                    values = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_timesheet_entries", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    reset_token = table.Column<string>(type: "text", nullable: true),
                    reset_token_expiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vendor_emails",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vendor_id = table.Column<int>(type: "integer", nullable: true),
                    subject = table.Column<string>(type: "text", nullable: true),
                    body = table.Column<string>(type: "text", nullable: true),
                    recipients = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendor_emails", x => x.id);
                    table.ForeignKey(
                        name: "FK_vendor_emails_contacts_vendor_id",
                        column: x => x.vendor_id,
                        principalTable: "contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "vendor_responses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vendor_id = table.Column<int>(type: "integer", nullable: false),
                    response = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendor_responses", x => x.id);
                    table.ForeignKey(
                        name: "FK_vendor_responses_contacts_vendor_id",
                        column: x => x.vendor_id,
                        principalTable: "contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "charges",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_finance_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    tax_type = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    percentage = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_charges", x => x.id);
                    table.ForeignKey(
                        name: "FK_charges_project_finances_project_finance_id",
                        column: x => x.project_finance_id,
                        principalTable: "project_finances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "milestones",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_finance_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    percentage = table.Column<decimal>(type: "numeric", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    invoice_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    paid_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_custom_name = table.Column<bool>(type: "boolean", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_milestones", x => x.id);
                    table.ForeignKey(
                        name: "FK_milestones_project_finances_project_finance_id",
                        column: x => x.project_finance_id,
                        principalTable: "project_finances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stakeholders",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_finance_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    percentage = table.Column<decimal>(type: "numeric", nullable: true),
                    payout_tax = table.Column<decimal>(type: "numeric", nullable: true),
                    payout_status = table.Column<string>(type: "text", nullable: false),
                    paid_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stakeholders", x => x.id);
                    table.ForeignKey(
                        name: "FK_stakeholders_project_finances_project_finance_id",
                        column: x => x.project_finance_id,
                        principalTable: "project_finances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<int>(type: "integer", nullable: false),
                    permission_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_role_permissions_permissions_permission_id",
                        column: x => x.permission_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_role_permissions_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "entity_tags",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tag_id = table.Column<int>(type: "integer", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entity_tags", x => x.id);
                    table.ForeignKey(
                        name: "FK_entity_tags_tags_tag_id",
                        column: x => x.tag_id,
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    role_id = table.Column<int>(type: "integer", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_roles_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "id", "action", "code", "description", "module" },
                values: new object[,]
                {
                    { 1, "View", "dashboard.view", "View access to Dashboard", "Dashboard" },
                    { 2, "Create", "dashboard.create", "Create access to Dashboard", "Dashboard" },
                    { 3, "Edit", "dashboard.edit", "Edit access to Dashboard", "Dashboard" },
                    { 4, "Delete", "dashboard.delete", "Delete access to Dashboard", "Dashboard" },
                    { 5, "View", "sales.view", "View access to Sales", "Sales" },
                    { 6, "Create", "sales.create", "Create access to Sales", "Sales" },
                    { 7, "Edit", "sales.edit", "Edit access to Sales", "Sales" },
                    { 8, "Delete", "sales.delete", "Delete access to Sales", "Sales" },
                    { 9, "View", "contacts.view", "View access to Contacts", "Contacts" },
                    { 10, "Create", "contacts.create", "Create access to Contacts", "Contacts" },
                    { 11, "Edit", "contacts.edit", "Edit access to Contacts", "Contacts" },
                    { 12, "Delete", "contacts.delete", "Delete access to Contacts", "Contacts" },
                    { 13, "View", "timesheet.view", "View access to Timesheet", "Timesheet" },
                    { 14, "Create", "timesheet.create", "Create access to Timesheet", "Timesheet" },
                    { 15, "Edit", "timesheet.edit", "Edit access to Timesheet", "Timesheet" },
                    { 16, "Delete", "timesheet.delete", "Delete access to Timesheet", "Timesheet" },
                    { 17, "View", "finance.view", "View access to Finance", "Finance" },
                    { 18, "Create", "finance.create", "Create access to Finance", "Finance" },
                    { 19, "Edit", "finance.edit", "Edit access to Finance", "Finance" },
                    { 20, "Delete", "finance.delete", "Delete access to Finance", "Finance" },
                    { 21, "View", "todolist.view", "View access to TodoList", "TodoList" },
                    { 22, "Create", "todolist.create", "Create access to TodoList", "TodoList" },
                    { 23, "Edit", "todolist.edit", "Edit access to TodoList", "TodoList" },
                    { 24, "Delete", "todolist.delete", "Delete access to TodoList", "TodoList" },
                    { 25, "View", "invoice.view", "View access to Invoice", "Invoice" },
                    { 26, "Create", "invoice.create", "Create access to Invoice", "Invoice" },
                    { 27, "Edit", "invoice.edit", "Edit access to Invoice", "Invoice" },
                    { 28, "Delete", "invoice.delete", "Delete access to Invoice", "Invoice" },
                    { 29, "View", "aiagents.view", "View access to AIAgents", "AIAgents" },
                    { 30, "Create", "aiagents.create", "Create access to AIAgents", "AIAgents" },
                    { 31, "Edit", "aiagents.edit", "Edit access to AIAgents", "AIAgents" },
                    { 32, "Delete", "aiagents.delete", "Delete access to AIAgents", "AIAgents" },
                    { 33, "View", "admin.view", "View access to Admin", "Admin" },
                    { 34, "Create", "admin.create", "Create access to Admin", "Admin" },
                    { 35, "Edit", "admin.edit", "Edit access to Admin", "Admin" },
                    { 36, "Delete", "admin.delete", "Delete access to Admin", "Admin" },
                    { 37, "View", "activitylog.view", "View access to ActivityLog", "ActivityLog" },
                    { 38, "Create", "activitylog.create", "Create access to ActivityLog", "ActivityLog" },
                    { 39, "Edit", "activitylog.edit", "Edit access to ActivityLog", "ActivityLog" },
                    { 40, "Delete", "activitylog.delete", "Delete access to ActivityLog", "ActivityLog" },
                    { 41, "View", "notifications.view", "View access to Notifications", "Notifications" },
                    { 42, "Create", "notifications.create", "Create access to Notifications", "Notifications" },
                    { 43, "Edit", "notifications.edit", "Edit access to Notifications", "Notifications" },
                    { 44, "Delete", "notifications.delete", "Delete access to Notifications", "Notifications" },
                    { 45, "View", "calendar.view", "View access to Calendar", "Calendar" },
                    { 46, "Create", "calendar.create", "Create access to Calendar", "Calendar" },
                    { 47, "Edit", "calendar.edit", "Edit access to Calendar", "Calendar" },
                    { 48, "Delete", "calendar.delete", "Delete access to Calendar", "Calendar" },
                    { 49, "View", "notes.view", "View access to Notes", "Notes" },
                    { 50, "Create", "notes.create", "Create access to Notes", "Notes" },
                    { 51, "Edit", "notes.edit", "Edit access to Notes", "Notes" },
                    { 52, "Delete", "notes.delete", "Delete access to Notes", "Notes" },
                    { 53, "View", "tags.view", "View access to Tags", "Tags" },
                    { 54, "Create", "tags.create", "Create access to Tags", "Tags" },
                    { 55, "Edit", "tags.edit", "Edit access to Tags", "Tags" },
                    { 56, "Delete", "tags.delete", "Delete access to Tags", "Tags" },
                    { 57, "View", "emailtemplates.view", "View access to EmailTemplates", "EmailTemplates" },
                    { 58, "Create", "emailtemplates.create", "Create access to EmailTemplates", "EmailTemplates" },
                    { 59, "Edit", "emailtemplates.edit", "Edit access to EmailTemplates", "EmailTemplates" },
                    { 60, "Delete", "emailtemplates.delete", "Delete access to EmailTemplates", "EmailTemplates" },
                    { 61, "View", "documents.view", "View access to Documents", "Documents" },
                    { 62, "Create", "documents.create", "Create access to Documents", "Documents" },
                    { 63, "Edit", "documents.edit", "Edit access to Documents", "Documents" },
                    { 64, "Delete", "documents.delete", "Delete access to Documents", "Documents" },
                    { 65, "View", "reports.view", "View access to Reports", "Reports" },
                    { 66, "Create", "reports.create", "Create access to Reports", "Reports" },
                    { 67, "Edit", "reports.edit", "Edit access to Reports", "Reports" },
                    { 68, "Delete", "reports.delete", "Delete access to Reports", "Reports" }
                });

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "created_at", "description", "is_system", "name" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 3, 26, 10, 15, 31, 655, DateTimeKind.Utc).AddTicks(5567), "Full access to all features", true, "Admin" },
                    { 2, new DateTime(2026, 3, 26, 10, 15, 31, 655, DateTimeKind.Utc).AddTicks(5573), "Can manage teams and view reports", true, "Manager" },
                    { 3, new DateTime(2026, 3, 26, 10, 15, 31, 655, DateTimeKind.Utc).AddTicks(5575), "Standard user with limited access", true, "User" }
                });

            migrationBuilder.InsertData(
                table: "role_permissions",
                columns: new[] { "id", "permission_id", "role_id" },
                values: new object[,]
                {
                    { 1, 1, 1 },
                    { 2, 2, 1 },
                    { 3, 3, 1 },
                    { 4, 4, 1 },
                    { 5, 5, 1 },
                    { 6, 6, 1 },
                    { 7, 7, 1 },
                    { 8, 8, 1 },
                    { 9, 9, 1 },
                    { 10, 10, 1 },
                    { 11, 11, 1 },
                    { 12, 12, 1 },
                    { 13, 13, 1 },
                    { 14, 14, 1 },
                    { 15, 15, 1 },
                    { 16, 16, 1 },
                    { 17, 17, 1 },
                    { 18, 18, 1 },
                    { 19, 19, 1 },
                    { 20, 20, 1 },
                    { 21, 21, 1 },
                    { 22, 22, 1 },
                    { 23, 23, 1 },
                    { 24, 24, 1 },
                    { 25, 25, 1 },
                    { 26, 26, 1 },
                    { 27, 27, 1 },
                    { 28, 28, 1 },
                    { 29, 29, 1 },
                    { 30, 30, 1 },
                    { 31, 31, 1 },
                    { 32, 32, 1 },
                    { 33, 33, 1 },
                    { 34, 34, 1 },
                    { 35, 35, 1 },
                    { 36, 36, 1 },
                    { 37, 37, 1 },
                    { 38, 38, 1 },
                    { 39, 39, 1 },
                    { 40, 40, 1 },
                    { 41, 41, 1 },
                    { 42, 42, 1 },
                    { 43, 43, 1 },
                    { 44, 44, 1 },
                    { 45, 45, 1 },
                    { 46, 46, 1 },
                    { 47, 47, 1 },
                    { 48, 48, 1 },
                    { 49, 49, 1 },
                    { 50, 50, 1 },
                    { 51, 51, 1 },
                    { 52, 52, 1 },
                    { 53, 53, 1 },
                    { 54, 54, 1 },
                    { 55, 55, 1 },
                    { 56, 56, 1 },
                    { 57, 57, 1 },
                    { 58, 58, 1 },
                    { 59, 59, 1 },
                    { 60, 60, 1 },
                    { 61, 61, 1 },
                    { 62, 62, 1 },
                    { 63, 63, 1 },
                    { 64, 64, 1 },
                    { 65, 65, 1 },
                    { 66, 66, 1 },
                    { 67, 67, 1 },
                    { 68, 68, 1 },
                    { 69, 1, 3 },
                    { 70, 5, 3 },
                    { 71, 9, 3 },
                    { 72, 13, 3 },
                    { 73, 17, 3 },
                    { 74, 21, 3 },
                    { 75, 25, 3 },
                    { 76, 29, 3 },
                    { 77, 37, 3 },
                    { 78, 41, 3 },
                    { 79, 45, 3 },
                    { 80, 49, 3 },
                    { 81, 53, 3 },
                    { 82, 57, 3 },
                    { 83, 61, 3 },
                    { 84, 65, 3 },
                    { 85, 22, 3 },
                    { 86, 23, 3 },
                    { 87, 14, 3 },
                    { 88, 15, 3 },
                    { 89, 1, 2 },
                    { 90, 2, 2 },
                    { 91, 3, 2 },
                    { 92, 4, 2 },
                    { 93, 5, 2 },
                    { 94, 6, 2 },
                    { 95, 7, 2 },
                    { 96, 8, 2 },
                    { 97, 9, 2 },
                    { 98, 10, 2 },
                    { 99, 11, 2 },
                    { 100, 12, 2 },
                    { 101, 13, 2 },
                    { 102, 14, 2 },
                    { 103, 15, 2 },
                    { 104, 16, 2 },
                    { 105, 17, 2 },
                    { 106, 18, 2 },
                    { 107, 19, 2 },
                    { 108, 20, 2 },
                    { 109, 21, 2 },
                    { 110, 22, 2 },
                    { 111, 23, 2 },
                    { 112, 24, 2 },
                    { 113, 25, 2 },
                    { 114, 26, 2 },
                    { 115, 27, 2 },
                    { 116, 28, 2 },
                    { 117, 29, 2 },
                    { 118, 30, 2 },
                    { 119, 31, 2 },
                    { 120, 32, 2 },
                    { 121, 37, 2 },
                    { 122, 38, 2 },
                    { 123, 39, 2 },
                    { 124, 40, 2 },
                    { 125, 41, 2 },
                    { 126, 42, 2 },
                    { 127, 43, 2 },
                    { 128, 44, 2 },
                    { 129, 45, 2 },
                    { 130, 46, 2 },
                    { 131, 47, 2 },
                    { 132, 48, 2 },
                    { 133, 49, 2 },
                    { 134, 50, 2 },
                    { 135, 51, 2 },
                    { 136, 52, 2 },
                    { 137, 53, 2 },
                    { 138, 54, 2 },
                    { 139, 55, 2 },
                    { 140, 56, 2 },
                    { 141, 57, 2 },
                    { 142, 58, 2 },
                    { 143, 59, 2 },
                    { 144, 60, 2 },
                    { 145, 61, 2 },
                    { 146, 62, 2 },
                    { 147, 63, 2 },
                    { 148, 64, 2 },
                    { 149, 65, 2 },
                    { 150, 66, 2 },
                    { 151, 67, 2 },
                    { 152, 68, 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_entity_type_entity_id",
                table: "activity_logs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_user_id",
                table: "activity_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_charges_project_finance_id",
                table: "charges",
                column: "project_finance_id");

            migrationBuilder.CreateIndex(
                name: "IX_contact_columns_col_id",
                table: "contact_columns",
                column: "col_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_contacts_company",
                table: "contacts",
                column: "company");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_entity_type",
                table: "contacts",
                column: "entity_type");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_status",
                table: "contacts",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_user_id",
                table: "contacts",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_documents_entity_type_entity_id",
                table: "documents",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_documents_user_id",
                table: "documents",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_email_templates_user_id",
                table: "email_templates",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_entity_tags_tag_id_entity_type_entity_id",
                table: "entity_tags",
                columns: new[] { "tag_id", "entity_type", "entity_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_expenses_user_id",
                table: "expenses",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_incomes_user_id",
                table: "incomes",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_milestones_project_finance_id",
                table: "milestones",
                column: "project_finance_id");

            migrationBuilder.CreateIndex(
                name: "IX_notes_entity_type_entity_id",
                table: "notes",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_notes_user_id",
                table: "notes",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_is_read",
                table: "notifications",
                column: "is_read");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id",
                table: "notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_permissions_code",
                table: "permissions",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_finances_user_id",
                table: "project_finances",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_projects_user_id",
                table: "projects",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_permission_id",
                table: "role_permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_role_id_permission_id",
                table: "role_permissions",
                columns: new[] { "role_id", "permission_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_name",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saved_filters_user_id",
                table: "saved_filters",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_stakeholders_project_finance_id",
                table: "stakeholders",
                column: "project_finance_id");

            migrationBuilder.CreateIndex(
                name: "IX_tags_user_id",
                table: "tags",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_user_id",
                table: "tasks",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_timesheet_columns_col_id",
                table: "timesheet_columns",
                column: "col_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_timesheet_entries_user_id",
                table: "timesheet_entries",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_role_id",
                table: "user_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_user_id_role_id",
                table: "user_roles",
                columns: new[] { "user_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vendor_emails_vendor_id",
                table: "vendor_emails",
                column: "vendor_id");

            migrationBuilder.CreateIndex(
                name: "IX_vendor_responses_vendor_id",
                table: "vendor_responses",
                column: "vendor_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "activity_logs");

            migrationBuilder.DropTable(
                name: "charges");

            migrationBuilder.DropTable(
                name: "contact_columns");

            migrationBuilder.DropTable(
                name: "documents");

            migrationBuilder.DropTable(
                name: "email_templates");

            migrationBuilder.DropTable(
                name: "entity_tags");

            migrationBuilder.DropTable(
                name: "expenses");

            migrationBuilder.DropTable(
                name: "incomes");

            migrationBuilder.DropTable(
                name: "milestones");

            migrationBuilder.DropTable(
                name: "notes");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "projects");

            migrationBuilder.DropTable(
                name: "role_permissions");

            migrationBuilder.DropTable(
                name: "saved_filters");

            migrationBuilder.DropTable(
                name: "stakeholders");

            migrationBuilder.DropTable(
                name: "tasks");

            migrationBuilder.DropTable(
                name: "timesheet_columns");

            migrationBuilder.DropTable(
                name: "timesheet_entries");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "vendor_emails");

            migrationBuilder.DropTable(
                name: "vendor_responses");

            migrationBuilder.DropTable(
                name: "tags");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "project_finances");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "contacts");
        }
    }
}
