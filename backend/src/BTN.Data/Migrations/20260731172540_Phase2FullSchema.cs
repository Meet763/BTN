using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations
{
    /// <inheritdoc />
    public partial class Phase2FullSchema : Migration
    {
        private static readonly Guid DefaultPhoneMethodId = Guid.Parse("11111111-1111-1111-1111-111111111101");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "verification_methods",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table => { table.PrimaryKey("pk_verification_methods", x => x.id); });

            migrationBuilder.Sql($"""
                INSERT INTO verification_methods (id, code, display_name, is_active, sort_order) VALUES
                ('{DefaultPhoneMethodId}', 'PhoneCall', 'Phone Call', true, 1),
                ('11111111-1111-1111-1111-111111111102', 'ManualEntry', 'Manual Entry', true, 2),
                ('11111111-1111-1111-1111-111111111103', 'WhatsApp', 'WhatsApp', true, 3),
                ('11111111-1111-1111-1111-111111111104', 'Email', 'Email', true, 4),
                ('11111111-1111-1111-1111-111111111105', 'Meeting', 'Meeting', true, 5);
                """);

            migrationBuilder.CreateTable(
                name: "employees",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    employee_code = table.Column<string>(type: "text", nullable: true),
                    department = table.Column<string>(type: "text", nullable: true),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_employees", x => x.id);
                    table.ForeignKey(
                        name: "fk_employees_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "customers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_name = table.Column<string>(type: "text", nullable: true),
                    gstin = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customers", x => x.id);
                    table.ForeignKey(
                        name: "fk_customers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddColumn<int>(
                name: "workflow_status",
                table: "leads",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "sale_status",
                table: "leads",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "assigned_employee_id",
                table: "leads",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(name: "inquiry_type", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "inquiry_details", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "customer_requirements", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<decimal>(name: "budget_amount", table: "leads", type: "numeric", nullable: true);
            migrationBuilder.AddColumn<string>(name: "budget_currency", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "timeline", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "contact_outcome", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "follow_up_at", table: "leads", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<string>(name: "remarks", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "internal_notes", table: "leads", type: "text", nullable: true);
            migrationBuilder.AddColumn<decimal>(name: "list_price", table: "leads", type: "numeric", nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_leads_assigned_employee_id",
                table: "leads",
                column: "assigned_employee_id");

            migrationBuilder.AddForeignKey(
                name: "fk_leads_employees_assigned_employee_id",
                table: "leads",
                column: "assigned_employee_id",
                principalTable: "employees",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.DropIndex(
                name: "ix_lead_verifications_lead_id",
                table: "lead_verifications");

            migrationBuilder.AddColumn<Guid>(
                name: "employee_id",
                table: "lead_verifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "verification_method_id",
                table: "lead_verifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(name: "inquiry_type", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "product_or_service", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "inquiry_details", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "customer_requirements", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<decimal>(name: "budget_amount", table: "lead_verifications", type: "numeric", nullable: true);
            migrationBuilder.AddColumn<string>(name: "timeline", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "contact_outcome", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "follow_up_at", table: "lead_verifications", type: "timestamp with time zone", nullable: true);
            migrationBuilder.AddColumn<string>(name: "remarks", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "additional_notes", table: "lead_verifications", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "form_snapshot_json", table: "lead_verifications", type: "jsonb", nullable: true);

            migrationBuilder.Sql($"""
                INSERT INTO employees (id, user_id, is_active, created_at, joined_at)
                SELECT gen_random_uuid(), lv.verified_by, true, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                FROM lead_verifications lv
                LEFT JOIN employees e ON e.user_id = lv.verified_by
                WHERE e.id IS NULL
                GROUP BY lv.verified_by;

                UPDATE lead_verifications
                SET verification_method_id = '{DefaultPhoneMethodId}',
                    employee_id = (SELECT e.id FROM employees e WHERE e.user_id = lead_verifications.verified_by LIMIT 1)
                WHERE verification_method_id IS NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "employee_id",
                table: "lead_verifications",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "verification_method_id",
                table: "lead_verifications",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_lead_verifications_employee_id",
                table: "lead_verifications",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_lead_verifications_verification_method_id",
                table: "lead_verifications",
                column: "verification_method_id");

            migrationBuilder.CreateIndex(
                name: "ix_lead_verifications_lead_id",
                table: "lead_verifications",
                column: "lead_id");

            migrationBuilder.AddForeignKey(
                name: "fk_lead_verifications_employees_employee_id",
                table: "lead_verifications",
                column: "employee_id",
                principalTable: "employees",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_lead_verifications_verification_methods_verification_method_id",
                table: "lead_verifications",
                column: "verification_method_id",
                principalTable: "verification_methods",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.CreateTable(
                name: "lead_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: false),
                    employee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    unassigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lead_assignments", x => x.id);
                    table.ForeignKey(name: "fk_lead_assignments_employees_employee_id", column: x => x.employee_id, principalTable: "employees", principalColumn: "id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(name: "fk_lead_assignments_leads_lead_id", column: x => x.lead_id, principalTable: "leads", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(name: "fk_lead_assignments_users_assigned_by_user_id", column: x => x.assigned_by_user_id, principalTable: "users", principalColumn: "id", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "lead_status_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_status = table.Column<string>(type: "text", nullable: false),
                    to_status = table.Column<string>(type: "text", nullable: false),
                    changed_by = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lead_status_history", x => x.id);
                    table.ForeignKey(name: "fk_lead_status_history_leads_lead_id", column: x => x.lead_id, principalTable: "leads", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(name: "fk_lead_status_history_users_changed_by", column: x => x.changed_by, principalTable: "users", principalColumn: "id", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "wallets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    balance_minor = table.Column<long>(type: "bigint", nullable: false),
                    currency = table.Column<string>(type: "text", nullable: false),
                    row_version = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wallets", x => x.id);
                    table.ForeignKey(name: "fk_wallets_customers_customer_id", column: x => x.customer_id, principalTable: "customers", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payment_orders",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount_minor = table.Column<long>(type: "bigint", nullable: false),
                    currency = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    provider_order_id = table.Column<string>(type: "text", nullable: true),
                    provider_payload_json = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_payment_orders", x => x.id);
                    table.ForeignKey(name: "fk_payment_orders_customers_customer_id", column: x => x.customer_id, principalTable: "customers", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_organizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    legal_name = table.Column<string>(type: "text", nullable: false),
                    address = table.Column<string>(type: "text", nullable: true),
                    logo_url = table.Column<string>(type: "text", nullable: true),
                    invoice_prefix = table.Column<string>(type: "text", nullable: false),
                    next_invoice_number = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_organizations", x => x.id);
                    table.ForeignKey(name: "fk_billing_organizations_customers_customer_id", column: x => x.customer_id, principalTable: "customers", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "wallet_transactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    wallet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    amount_minor = table.Column<long>(type: "bigint", nullable: false),
                    balance_after = table.Column<long>(type: "bigint", nullable: false),
                    reference_type = table.Column<string>(type: "text", nullable: true),
                    reference_id = table.Column<Guid>(type: "uuid", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    idempotency_key = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wallet_transactions", x => x.id);
                    table.ForeignKey(name: "fk_wallet_transactions_wallets_wallet_id", column: x => x.wallet_id, principalTable: "wallets", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_customers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_customers", x => x.id);
                    table.ForeignKey(name: "fk_billing_customers_billing_organizations_billing_organization_id", column: x => x.billing_organization_id, principalTable: "billing_organizations", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_products",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    unit_price = table.Column<decimal>(type: "numeric", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_products", x => x.id);
                    table.ForeignKey(name: "fk_billing_products_billing_organizations_billing_organization_id", column: x => x.billing_organization_id, principalTable: "billing_organizations", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "purchases",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: false),
                    price_minor = table.Column<long>(type: "bigint", nullable: false),
                    wallet_transaction_id = table.Column<Guid>(type: "uuid", nullable: true),
                    purchased_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_purchases", x => x.id);
                    table.ForeignKey(name: "fk_purchases_customers_customer_id", column: x => x.customer_id, principalTable: "customers", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(name: "fk_purchases_leads_lead_id", column: x => x.lead_id, principalTable: "leads", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(name: "fk_purchases_wallet_transactions_wallet_transaction_id", column: x => x.wallet_transaction_id, principalTable: "wallet_transactions", principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "billing_quotations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quotation_number = table.Column<string>(type: "text", nullable: false),
                    issued_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    valid_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    total_amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_quotations", x => x.id);
                    table.ForeignKey(name: "fk_billing_quotations_billing_customers_billing_customer_id", column: x => x.billing_customer_id, principalTable: "billing_customers", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(name: "fk_billing_quotations_billing_organizations_billing_organization_id", column: x => x.billing_organization_id, principalTable: "billing_organizations", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_invoices",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_number = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    issued_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    due_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    total_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    amount_paid = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_invoices", x => x.id);
                    table.ForeignKey(name: "fk_billing_invoices_billing_customers_billing_customer_id", column: x => x.billing_customer_id, principalTable: "billing_customers", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(name: "fk_billing_invoices_billing_organizations_billing_organization_id", column: x => x.billing_organization_id, principalTable: "billing_organizations", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_quotation_lines",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_quotation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric", nullable: false),
                    line_total = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_quotation_lines", x => x.id);
                    table.ForeignKey(name: "fk_billing_quotation_lines_billing_quotations_billing_quotation_id", column: x => x.billing_quotation_id, principalTable: "billing_quotations", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_invoice_lines",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_invoice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric", nullable: false),
                    line_total = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_invoice_lines", x => x.id);
                    table.ForeignKey(name: "fk_billing_invoice_lines_billing_invoices_billing_invoice_id", column: x => x.billing_invoice_id, principalTable: "billing_invoices", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_invoice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    method = table.Column<string>(type: "text", nullable: true),
                    reference = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_billing_payments", x => x.id);
                    table.ForeignKey(name: "fk_billing_payments_billing_invoices_billing_invoice_id", column: x => x.billing_invoice_id, principalTable: "billing_invoices", principalColumn: "id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "ix_employees_user_id", table: "employees", column: "user_id", unique: true);
            migrationBuilder.CreateIndex(name: "ix_customers_user_id", table: "customers", column: "user_id", unique: true);
            migrationBuilder.CreateIndex(name: "ix_wallets_customer_id", table: "wallets", column: "customer_id", unique: true);
            migrationBuilder.CreateIndex(name: "ix_purchases_lead_id", table: "purchases", column: "lead_id", unique: true);
            migrationBuilder.CreateIndex(
                name: "ix_wallet_transactions_idempotency_key",
                table: "wallet_transactions",
                column: "idempotency_key",
                unique: true,
                filter: "idempotency_key IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback not fully automated for production upgrades.
        }
    }
}
