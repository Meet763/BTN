using System;
using BTN.Data.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations;

[DbContext(typeof(BtnDbContext))]
[Migration("20260823100000_AddCampaignJobInterest")]
public partial class AddCampaignJobInterest : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "job_interest",
            table: "campaign_submissions",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "job_role",
            table: "campaign_submissions",
            type: "text",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "ix_campaign_submissions_job_role",
            table: "campaign_submissions",
            column: "job_role");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_campaign_submissions_job_role",
            table: "campaign_submissions");

        migrationBuilder.DropColumn(name: "job_interest", table: "campaign_submissions");
        migrationBuilder.DropColumn(name: "job_role", table: "campaign_submissions");
    }
}
