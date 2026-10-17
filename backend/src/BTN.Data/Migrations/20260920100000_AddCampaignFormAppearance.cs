using System;
using BTN.Data.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations;

[DbContext(typeof(BtnDbContext))]
[Migration("20260920100000_AddCampaignFormAppearance")]
public partial class AddCampaignFormAppearance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "campaign_form_appearances",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                theme_key = table.Column<string>(type: "text", nullable: false),
                background_color = table.Column<string>(type: "text", nullable: false),
                accent_color = table.Column<string>(type: "text", nullable: false),
                cta_color = table.Column<string>(type: "text", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_campaign_form_appearances", x => x.id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "campaign_form_appearances");
    }
}
