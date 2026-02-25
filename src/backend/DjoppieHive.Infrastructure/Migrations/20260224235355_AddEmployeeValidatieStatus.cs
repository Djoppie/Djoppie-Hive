using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeValidatieStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GevalideerdDoor",
                table: "Employees",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidatieDatum",
                table: "Employees",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ValidatieStatus",
                table: "Employees",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GevalideerdDoor",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ValidatieDatum",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ValidatieStatus",
                table: "Employees");
        }
    }
}
