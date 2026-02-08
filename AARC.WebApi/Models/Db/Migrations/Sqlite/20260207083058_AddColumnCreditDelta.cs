using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AARC.Models.Db.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class AddColumnCreditDelta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Deleted",
                table: "UserHistories");

            migrationBuilder.DropColumn(
                name: "Deleted",
                table: "SaveFolderRelations");

            migrationBuilder.DropColumn(
                name: "LastActive",
                table: "SaveFolderRelations");

            migrationBuilder.RenameColumn(
                name: "UserTypeOld",
                table: "UserHistories",
                newName: "UserCreditDelta");

            migrationBuilder.RenameColumn(
                name: "LastActive",
                table: "UserHistories",
                newName: "Time");

            migrationBuilder.AddColumn<string>(
                name: "Comment",
                table: "UserHistories",
                type: "TEXT",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserHistories_TargetUserId_OperatorUserId",
                table: "UserHistories",
                columns: new[] { "TargetUserId", "OperatorUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolders_OwnerUserId_ParentFolderId",
                table: "SaveFolders",
                columns: new[] { "OwnerUserId", "ParentFolderId" });

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolderRelations_SaveId_FolderId",
                table: "SaveFolderRelations",
                columns: new[] { "SaveId", "FolderId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserHistories_TargetUserId_OperatorUserId",
                table: "UserHistories");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolders_OwnerUserId_ParentFolderId",
                table: "SaveFolders");

            migrationBuilder.DropIndex(
                name: "IX_SaveFolderRelations_SaveId_FolderId",
                table: "SaveFolderRelations");

            migrationBuilder.DropColumn(
                name: "Comment",
                table: "UserHistories");

            migrationBuilder.RenameColumn(
                name: "UserCreditDelta",
                table: "UserHistories",
                newName: "UserTypeOld");

            migrationBuilder.RenameColumn(
                name: "Time",
                table: "UserHistories",
                newName: "LastActive");

            migrationBuilder.AddColumn<bool>(
                name: "Deleted",
                table: "UserHistories",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Deleted",
                table: "SaveFolderRelations",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActive",
                table: "SaveFolderRelations",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
