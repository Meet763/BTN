using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "assigned_head_employee_id",
                table: "leads",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "org_unit_id",
                table: "leads",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "job_title",
                table: "employees",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "org_unit_id",
                table: "employees",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "reports_to_employee_id",
                table: "employees",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "org_units",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    parent_org_unit_id = table.Column<Guid>(type: "uuid", nullable: true),
                    head_employee_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_org_units", x => x.id);
                    table.ForeignKey(
                        name: "fk_org_units_employees_head_employee_id",
                        column: x => x.head_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_org_units_org_units_parent_org_unit_id",
                        column: x => x.parent_org_unit_id,
                        principalTable: "org_units",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_leads_assigned_head_employee_id",
                table: "leads",
                column: "assigned_head_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_org_unit_id",
                table: "leads",
                column: "org_unit_id");

            migrationBuilder.CreateIndex(
                name: "ix_employees_org_unit_id",
                table: "employees",
                column: "org_unit_id");

            migrationBuilder.CreateIndex(
                name: "ix_employees_reports_to_employee_id",
                table: "employees",
                column: "reports_to_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_org_units_code",
                table: "org_units",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_org_units_head_employee_id",
                table: "org_units",
                column: "head_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_org_units_parent_org_unit_id",
                table: "org_units",
                column: "parent_org_unit_id");

            migrationBuilder.AddForeignKey(
                name: "fk_employees_employees_reports_to_employee_id",
                table: "employees",
                column: "reports_to_employee_id",
                principalTable: "employees",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_employees_org_units_org_unit_id",
                table: "employees",
                column: "org_unit_id",
                principalTable: "org_units",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_leads_employees_assigned_head_employee_id",
                table: "leads",
                column: "assigned_head_employee_id",
                principalTable: "employees",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_leads_org_units_org_unit_id",
                table: "leads",
                column: "org_unit_id",
                principalTable: "org_units",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_employees_employees_reports_to_employee_id",
                table: "employees");

            migrationBuilder.DropForeignKey(
                name: "fk_employees_org_units_org_unit_id",
                table: "employees");

            migrationBuilder.DropForeignKey(
                name: "fk_leads_employees_assigned_head_employee_id",
                table: "leads");

            migrationBuilder.DropForeignKey(
                name: "fk_leads_org_units_org_unit_id",
                table: "leads");

            migrationBuilder.DropTable(
                name: "org_units");

            migrationBuilder.DropIndex(
                name: "ix_leads_assigned_head_employee_id",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "ix_leads_org_unit_id",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "ix_employees_org_unit_id",
                table: "employees");

            migrationBuilder.DropIndex(
                name: "ix_employees_reports_to_employee_id",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "assigned_head_employee_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "org_unit_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "job_title",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "org_unit_id",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "reports_to_employee_id",
                table: "employees");
        }
    }
}
