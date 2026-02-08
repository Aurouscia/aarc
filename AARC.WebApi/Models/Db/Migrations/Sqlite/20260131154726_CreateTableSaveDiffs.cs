using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AARC.WebApi.Database.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class CreateTableSaveDiffs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SaveDiffs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SaveId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Data = table.Column<byte[]>(type: "BLOB", nullable: false),
                    Length = table.Column<int>(type: "INTEGER", nullable: false),
                    AddedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    RemovedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ModifiedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    Time = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaveDiffs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserFiles_OwnerUserId_Size_Priority",
                table: "UserFiles",
                columns: new[] { "OwnerUserId", "Size", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_Saves_OwnerUserId",
                table: "Saves",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuthGrants_OnId",
                table: "AuthGrants",
                column: "OnId");

            migrationBuilder.CreateIndex(
                name: "IX_SaveDiffs_SaveId_UserId",
                table: "SaveDiffs",
                columns: new[] { "SaveId", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SaveDiffs");

            migrationBuilder.DropIndex(
                name: "IX_UserFiles_OwnerUserId_Size_Priority",
                table: "UserFiles");

            migrationBuilder.DropIndex(
                name: "IX_Saves_OwnerUserId",
                table: "Saves");

            migrationBuilder.DropIndex(
                name: "IX_AuthGrants_OnId",
                table: "AuthGrants");
        }
    }
}
