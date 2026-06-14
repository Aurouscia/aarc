using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AARC.WebApi.Models.Db.Migrations.Sqlserver
{
    /// <inheritdoc />
    public partial class CreateTableSaveComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MasterUserId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "SaveComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SaveId = table.Column<int>(type: "int", nullable: false),
                    OwnerUserId = table.Column<int>(type: "int", nullable: false),
                    Created = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    LastActive = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Deleted = table.Column<bool>(type: "bit", nullable: false),
                    Deprecated = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaveComments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SaveComments_OwnerUserId",
                table: "SaveComments",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SaveComments_SaveId",
                table: "SaveComments",
                column: "SaveId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SaveComments");

            migrationBuilder.DropColumn(
                name: "MasterUserId",
                table: "Users");
        }
    }
}
