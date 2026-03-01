using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJobTitleRoleMappings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobTitleRoleMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    JobTitlePattern = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    ExactMatch = table.Column<bool>(type: "INTEGER", nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ScopeDetermination = table.Column<int>(type: "INTEGER", nullable: false),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobTitleRoleMappings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobTitleRoleMappings_IsActive",
                table: "JobTitleRoleMappings",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_JobTitleRoleMappings_JobTitlePattern",
                table: "JobTitleRoleMappings",
                column: "JobTitlePattern");

            migrationBuilder.CreateIndex(
                name: "IX_JobTitleRoleMappings_Priority",
                table: "JobTitleRoleMappings",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_JobTitleRoleMappings_Role",
                table: "JobTitleRoleMappings",
                column: "Role");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobTitleRoleMappings");
        }
    }
}
