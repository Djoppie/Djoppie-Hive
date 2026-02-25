using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHybridGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DynamicGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    FilterCriteria = table.Column<string>(type: "TEXT", nullable: false),
                    CachedMemberCount = table.Column<int>(type: "INTEGER", nullable: false),
                    LastEvaluatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsSystemGroup = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DynamicGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LocalGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocalGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LocalGroupMembers",
                columns: table => new
                {
                    LocalGroupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AddedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocalGroupMembers", x => new { x.LocalGroupId, x.EmployeeId });
                    table.ForeignKey(
                        name: "FK_LocalGroupMembers_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LocalGroupMembers_LocalGroups_LocalGroupId",
                        column: x => x.LocalGroupId,
                        principalTable: "LocalGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DynamicGroups_DisplayName",
                table: "DynamicGroups",
                column: "DisplayName");

            migrationBuilder.CreateIndex(
                name: "IX_DynamicGroups_IsSystemGroup",
                table: "DynamicGroups",
                column: "IsSystemGroup");

            migrationBuilder.CreateIndex(
                name: "IX_LocalGroupMembers_EmployeeId",
                table: "LocalGroupMembers",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_LocalGroups_DisplayName",
                table: "LocalGroups",
                column: "DisplayName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DynamicGroups");

            migrationBuilder.DropTable(
                name: "LocalGroupMembers");

            migrationBuilder.DropTable(
                name: "LocalGroups");
        }
    }
}
