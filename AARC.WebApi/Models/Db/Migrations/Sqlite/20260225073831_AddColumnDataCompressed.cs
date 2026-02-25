using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AARC.WebApi.Models.Db.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class AddColumnDataCompressed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "DataCompressed",
                table: "Saves",
                type: "BLOB",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ForkedFromId",
                table: "Saves",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataCompressed",
                table: "Saves");

            migrationBuilder.DropColumn(
                name: "ForkedFromId",
                table: "Saves");
        }
    }
}
