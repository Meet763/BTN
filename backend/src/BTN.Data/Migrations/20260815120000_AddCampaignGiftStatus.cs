using System;
using BTN.Data.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations;

[DbContext(typeof(BtnDbContext))]
[Migration("20260815120000_AddCampaignGiftStatus")]
public partial class AddCampaignGiftStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "gift_status",
            table: "campaign_submissions",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<DateTime>(
            name: "status_updated_at",
            table: "campaign_submissions",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "ix_campaign_submissions_gift_status",
            table: "campaign_submissions",
            column: "gift_status");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_campaign_submissions_gift_status",
            table: "campaign_submissions");

        migrationBuilder.DropColumn(name: "gift_status", table: "campaign_submissions");
        migrationBuilder.DropColumn(name: "status_updated_at", table: "campaign_submissions");
    }
}
