using System;
using BTN.Data.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations;

[DbContext(typeof(BtnDbContext))]
[Migration("20261004180000_AddManagedForms")]
public partial class AddManagedForms : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "managed_forms",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "text", nullable: false),
                slug = table.Column<string>(type: "text", nullable: false),
                description = table.Column<string>(type: "text", nullable: true),
                intro_title = table.Column<string>(type: "text", nullable: false),
                intro_body = table.Column<string>(type: "text", nullable: false),
                submit_label = table.Column<string>(type: "text", nullable: false),
                is_published = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_managed_forms", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "managed_form_fields",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                form_id = table.Column<Guid>(type: "uuid", nullable: false),
                field_key = table.Column<string>(type: "text", nullable: false),
                field_type = table.Column<string>(type: "text", nullable: false),
                label = table.Column<string>(type: "text", nullable: false),
                hint = table.Column<string>(type: "text", nullable: true),
                placeholder = table.Column<string>(type: "text", nullable: true),
                is_required = table.Column<bool>(type: "boolean", nullable: false),
                sort_order = table.Column<int>(type: "integer", nullable: false),
                options_json = table.Column<string>(type: "text", nullable: true),
                validation_json = table.Column<string>(type: "text", nullable: true),
                settings_json = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_managed_form_fields", x => x.id);
                table.ForeignKey(
                    name: "fk_managed_form_fields_managed_forms_form_id",
                    column: x => x.form_id,
                    principalTable: "managed_forms",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "managed_form_submissions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                form_id = table.Column<Guid>(type: "uuid", nullable: false),
                answers_json = table.Column<string>(type: "jsonb", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_managed_form_submissions", x => x.id);
                table.ForeignKey(
                    name: "fk_managed_form_submissions_managed_forms_form_id",
                    column: x => x.form_id,
                    principalTable: "managed_forms",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(name: "ix_managed_forms_slug", table: "managed_forms", column: "slug", unique: true);
        migrationBuilder.CreateIndex(name: "ix_managed_form_fields_form_id_field_key", table: "managed_form_fields", columns: new[] { "form_id", "field_key" }, unique: true);
        migrationBuilder.CreateIndex(name: "ix_managed_form_fields_form_id_sort_order", table: "managed_form_fields", columns: new[] { "form_id", "sort_order" });
        migrationBuilder.CreateIndex(name: "ix_managed_form_submissions_form_id", table: "managed_form_submissions", column: "form_id");
        migrationBuilder.CreateIndex(name: "ix_managed_form_submissions_created_at", table: "managed_form_submissions", column: "created_at");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "managed_form_fields");
        migrationBuilder.DropTable(name: "managed_form_submissions");
        migrationBuilder.DropTable(name: "managed_forms");
    }
}
