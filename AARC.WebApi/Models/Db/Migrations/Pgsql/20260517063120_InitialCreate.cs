using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AARC.WebApi.Models.Db.Migrations.Pgsql
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuthGrants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    On = table.Column<byte>(type: "smallint", nullable: false),
                    OnId = table.Column<int>(type: "integer", nullable: false),
                    To = table.Column<byte>(type: "smallint", nullable: false),
                    ToId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<byte>(type: "smallint", nullable: false),
                    Flag = table.Column<bool>(type: "boolean", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<byte>(type: "smallint", nullable: false),
                    LastActive = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthGrants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SaveDiffs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SaveId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Data = table.Column<byte[]>(type: "bytea", nullable: false),
                    Length = table.Column<int>(type: "integer", nullable: false),
                    AddedCount = table.Column<int>(type: "integer", nullable: false),
                    RemovedCount = table.Column<int>(type: "integer", nullable: false),
                    ModifiedCount = table.Column<int>(type: "integer", nullable: false),
                    Time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaveDiffs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SaveFolderRelations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SaveId = table.Column<int>(type: "integer", nullable: false),
                    FolderId = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<byte>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaveFolderRelations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SaveFolders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: false),
                    ParentFolderId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Intro = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Priority = table.Column<byte>(type: "smallint", nullable: false),
                    LastActive = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaveFolders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Saves",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: false),
                    CcLicense = table.Column<byte>(type: "smallint", nullable: false),
                    Intro = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Data = table.Column<string>(type: "text", maxLength: 2147483647, nullable: true),
                    DataCompressed = table.Column<byte[]>(type: "bytea", nullable: true),
                    StaCount = table.Column<int>(type: "integer", nullable: false),
                    LineCount = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<byte>(type: "smallint", nullable: false),
                    HeartbeatAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HeartbeatUserId = table.Column<int>(type: "integer", nullable: false),
                    ForkedFromId = table.Column<int>(type: "integer", nullable: false),
                    LastActive = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Metadata0 = table.Column<string>(type: "text", maxLength: 2147483647, nullable: true),
                    Metadata1 = table.Column<string>(type: "text", maxLength: 2147483647, nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Saves", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DisplayName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StoreName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: false),
                    Intro = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Size = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<byte>(type: "smallint", nullable: false),
                    LastActive = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TargetUserId = table.Column<int>(type: "integer", nullable: false),
                    OperatorUserId = table.Column<int>(type: "integer", nullable: false),
                    UserHistoryType = table.Column<byte>(type: "smallint", nullable: false),
                    UserTypeNew = table.Column<byte>(type: "smallint", nullable: false),
                    UserCreditDelta = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Password = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Email = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Type = table.Column<byte>(type: "smallint", nullable: false),
                    AvatarUserFileId = table.Column<int>(type: "integer", nullable: false),
                    Intro = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CcLicense = table.Column<byte>(type: "smallint", nullable: false),
                    PasswordResetQuestion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    PasswordResetAnswer = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    SelectedFolderId = table.Column<int>(type: "integer", nullable: false),
                    LastActive = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuthGrants_OnId",
                table: "AuthGrants",
                column: "OnId");

            migrationBuilder.CreateIndex(
                name: "IX_SaveDiffs_SaveId_UserId",
                table: "SaveDiffs",
                columns: new[] { "SaveId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolderRelations_SaveId_FolderId",
                table: "SaveFolderRelations",
                columns: new[] { "SaveId", "FolderId" });

            migrationBuilder.CreateIndex(
                name: "IX_SaveFolders_OwnerUserId_ParentFolderId",
                table: "SaveFolders",
                columns: new[] { "OwnerUserId", "ParentFolderId" });

            migrationBuilder.CreateIndex(
                name: "IX_Saves_OwnerUserId",
                table: "Saves",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFiles_OwnerUserId_Size_Priority",
                table: "UserFiles",
                columns: new[] { "OwnerUserId", "Size", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_UserHistories_TargetUserId_OperatorUserId",
                table: "UserHistories",
                columns: new[] { "TargetUserId", "OperatorUserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuthGrants");

            migrationBuilder.DropTable(
                name: "SaveDiffs");

            migrationBuilder.DropTable(
                name: "SaveFolderRelations");

            migrationBuilder.DropTable(
                name: "SaveFolders");

            migrationBuilder.DropTable(
                name: "Saves");

            migrationBuilder.DropTable(
                name: "UserFiles");

            migrationBuilder.DropTable(
                name: "UserHistories");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
