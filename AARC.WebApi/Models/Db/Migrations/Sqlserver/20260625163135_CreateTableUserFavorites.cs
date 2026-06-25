using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AARC.WebApi.Models.Db.Migrations.Sqlserver
{
    /// <inheritdoc />
    public partial class CreateTableUserFavorites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserHistories_TargetUserId_OperatorUserId",
                table: "UserHistories");

            migrationBuilder.DropIndex(
                name: "IX_UserFiles_OwnerUserId_Size_Priority",
                table: "UserFiles");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolders_OwnerUserId_ParentFolderId",
                table: "SaveFolders");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolderRelations_SaveId_FolderId",
                table: "SaveFolderRelations");

            migrationBuilder.DropColumn(
                name: "MasterUserId",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "ExternalIssuer",
                table: "Users",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalSubjectId",
                table: "Users",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Type",
                table: "UserFiles",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.CreateTable(
                name: "UserFavorites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Group = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: true),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    ObjectId = table.Column<int>(type: "int", nullable: false),
                    OwnerUserId = table.Column<int>(type: "int", nullable: false),
                    LastActive = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavorites", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Name",
                table: "Users",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_UserHistories_OperatorUserId",
                table: "UserHistories",
                column: "OperatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserHistories_TargetUserId",
                table: "UserHistories",
                column: "TargetUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFiles_OwnerUserId_Priority",
                table: "UserFiles",
                columns: new[] { "OwnerUserId", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolders_OwnerUserId",
                table: "SaveFolders",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolders_ParentFolderId",
                table: "SaveFolders",
                column: "ParentFolderId");

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolderRelations_FolderId",
                table: "SaveFolderRelations",
                column: "FolderId");

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolderRelations_SaveId",
                table: "SaveFolderRelations",
                column: "SaveId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_OwnerUserId_Type_Group",
                table: "UserFavorites",
                columns: new[] { "OwnerUserId", "Type", "Group" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_Users_Name",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_UserHistories_OperatorUserId",
                table: "UserHistories");

            migrationBuilder.DropIndex(
                name: "IX_UserHistories_TargetUserId",
                table: "UserHistories");

            migrationBuilder.DropIndex(
                name: "IX_UserFiles_OwnerUserId_Priority",
                table: "UserFiles");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolders_OwnerUserId",
                table: "SaveFolders");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolders_ParentFolderId",
                table: "SaveFolders");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolderRelations_FolderId",
                table: "SaveFolderRelations");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolderRelations_SaveId",
                table: "SaveFolderRelations");

            migrationBuilder.DropColumn(
                name: "ExternalIssuer",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ExternalSubjectId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "UserFiles");

            migrationBuilder.AddColumn<int>(
                name: "MasterUserId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_UserHistories_TargetUserId_OperatorUserId",
                table: "UserHistories",
                columns: new[] { "TargetUserId", "OperatorUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserFiles_OwnerUserId_Size_Priority",
                table: "UserFiles",
                columns: new[] { "OwnerUserId", "Size", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolders_OwnerUserId_ParentFolderId",
                table: "SaveFolders",
                columns: new[] { "OwnerUserId", "ParentFolderId" });

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolderRelations_SaveId_FolderId",
                table: "SaveFolderRelations",
                columns: new[] { "SaveId", "FolderId" });
        }
    }
}
