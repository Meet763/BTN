using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTN.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixWalletRowVersionConcurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "row_version",
                table: "wallets",
                type: "bytea",
                nullable: false,
                defaultValueSql: "'\\x00000000000000000000000000000000'",
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "row_version",
                table: "wallets",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldDefaultValueSql: "'\\x00000000000000000000000000000000'");
        }
    }
}
