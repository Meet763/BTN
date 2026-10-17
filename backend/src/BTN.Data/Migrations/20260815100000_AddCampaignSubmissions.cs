using System;
using BTN.Data.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations;

[DbContext(typeof(BtnDbContext))]
[Migration("20260815100000_AddCampaignSubmissions")]
public partial class AddCampaignSubmissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "campaign_submissions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                full_name = table.Column<string>(type: "text", nullable: false),
                phone = table.Column<string>(type: "text", nullable: false),
                email = table.Column<string>(type: "text", nullable: false),
                address = table.Column<string>(type: "text", nullable: false),
                city = table.Column<string>(type: "text", nullable: false),
                state = table.Column<string>(type: "text", nullable: false),
                pincode = table.Column<string>(type: "text", nullable: false),
                product_interest = table.Column<string>(type: "text", nullable: true),
                platform = table.Column<string>(type: "text", nullable: false),
                campaign = table.Column<string>(type: "text", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_campaign_submissions", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_campaign_submissions_platform",
            table: "campaign_submissions",
            column: "platform");

        migrationBuilder.CreateIndex(
            name: "ix_campaign_submissions_created_at",
            table: "campaign_submissions",
            column: "created_at");

        migrationBuilder.CreateIndex(
            name: "ix_campaign_submissions_phone",
            table: "campaign_submissions",
            column: "phone");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "campaign_submissions");
    }
}
