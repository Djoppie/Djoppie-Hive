using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeHRFieldsAndVolunteerDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ArbeidsRegime",
                table: "Employees",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "DienstId",
                table: "Employees",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EindDatum",
                table: "Employees",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmployeeType",
                table: "Employees",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Employees",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDatum",
                table: "Employees",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefoonnummer",
                table: "Employees",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VrijwilligerDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Beschikbaarheid = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Specialisaties = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    NoodContactNaam = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NoodContactTelefoon = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    VogDatum = table.Column<DateTime>(type: "TEXT", nullable: true),
                    VogGeldigTot = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Opmerkingen = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VrijwilligerDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VrijwilligerDetails_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_ArbeidsRegime",
                table: "Employees",
                column: "ArbeidsRegime");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_DienstId",
                table: "Employees",
                column: "DienstId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_EmployeeType",
                table: "Employees",
                column: "EmployeeType");

            migrationBuilder.CreateIndex(
                name: "IX_VrijwilligerDetails_EmployeeId",
                table: "VrijwilligerDetails",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_DistributionGroups_DienstId",
                table: "Employees",
                column: "DienstId",
                principalTable: "DistributionGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_DistributionGroups_DienstId",
                table: "Employees");

            migrationBuilder.DropTable(
                name: "VrijwilligerDetails");

            migrationBuilder.DropIndex(
                name: "IX_Employees_ArbeidsRegime",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_DienstId",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_EmployeeType",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ArbeidsRegime",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "DienstId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EindDatum",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmployeeType",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "StartDatum",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Telefoonnummer",
                table: "Employees");
        }
    }
}
