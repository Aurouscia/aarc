using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AARC.Models.Db.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class CreateTableAuthGrants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AvatarFileId",
                table: "Users",
                newName: "SelectedFolderId");

            migrationBuilder.RenameColumn(
                name: "Scope",
                table: "UserFiles",
                newName: "Priority");

            migrationBuilder.AddColumn<int>(
                name: "AvatarUserFileId",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<byte>(
                name: "CcLicense",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Users",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetAnswer",
                table: "Users",
                type: "TEXT",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetQuestion",
                table: "Users",
                type: "TEXT",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "CcLicense",
                table: "Saves",
                type: "INTEGER",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<DateTime>(
                name: "HeartbeatAt",
                table: "Saves",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "HeartbeatUserId",
                table: "Saves",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Metadata0",
                table: "Saves",
                type: "TEXT",
                maxLength: 2147483647,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Metadata1",
                table: "Saves",
                type: "TEXT",
                maxLength: 2147483647,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuthGrants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    On = table.Column<byte>(type: "INTEGER", nullable: false),
                    OnId = table.Column<int>(type: "INTEGER", nullable: false),
                    To = table.Column<byte>(type: "INTEGER", nullable: false),
                    ToId = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<byte>(type: "INTEGER", nullable: false),
                    Flag = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Priority = table.Column<byte>(type: "INTEGER", nullable: false),
                    LastActive = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthGrants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SaveFolderRelations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SaveId = table.Column<int>(type: "INTEGER", nullable: false),
                    FolderId = table.Column<int>(type: "INTEGER", nullable: false),
                    Priority = table.Column<byte>(type: "INTEGER", nullable: false),
                    LastActive = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaveFolderRelations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SaveFolders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OwnerUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ParentFolderId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Intro = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Priority = table.Column<byte>(type: "INTEGER", nullable: false),
                    LastActive = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaveFolders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TargetUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    OperatorUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserHistoryType = table.Column<byte>(type: "INTEGER", nullable: false),
                    UserTypeOld = table.Column<byte>(type: "INTEGER", nullable: false),
                    UserTypeNew = table.Column<byte>(type: "INTEGER", nullable: false),
                    LastActive = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Deleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserHistories", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuthGrants");

            migrationBuilder.DropTable(
                name: "SaveFolderRelations");

            migrationBuilder.DropTable(
                name: "SaveFolders");

            migrationBuilder.DropTable(
                name: "UserHistories");

            migrationBuilder.DropColumn(
                name: "AvatarUserFileId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CcLicense",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordResetAnswer",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordResetQuestion",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CcLicense",
                table: "Saves");

            migrationBuilder.DropColumn(
                name: "HeartbeatAt",
                table: "Saves");

            migrationBuilder.DropColumn(
                name: "HeartbeatUserId",
                table: "Saves");

            migrationBuilder.DropColumn(
                name: "Metadata0",
                table: "Saves");

            migrationBuilder.DropColumn(
                name: "Metadata1",
                table: "Saves");

            migrationBuilder.RenameColumn(
                name: "SelectedFolderId",
                table: "Users",
                newName: "AvatarFileId");

            migrationBuilder.RenameColumn(
                name: "Priority",
                table: "UserFiles",
                newName: "Scope");
        }
    }
}
