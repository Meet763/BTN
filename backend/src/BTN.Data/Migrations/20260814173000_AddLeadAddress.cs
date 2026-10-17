using BTN.Data.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations;

[DbContext(typeof(BtnDbContext))]
[Migration("20260814173000_AddLeadAddress")]
public partial class AddLeadAddress : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "address",
            table: "leads",
            type: "text",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "address", table: "leads");
    }
}
