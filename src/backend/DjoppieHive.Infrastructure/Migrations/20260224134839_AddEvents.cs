using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Titel = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Beschrijving = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    Datum = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    FilterCriteria = table.Column<string>(type: "TEXT", nullable: true),
                    DistributieGroepId = table.Column<Guid>(type: "TEXT", nullable: true),
                    AangemaaktDoor = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    AangemaaktOp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    VerstuurdOp = table.Column<DateTime>(type: "TEXT", nullable: true),
                    VerstuurdDoor = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    GeannuleerdOp = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_DistributionGroups_DistributieGroepId",
                        column: x => x.DistributieGroepId,
                        principalTable: "DistributionGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EventParticipants",
                columns: table => new
                {
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ToegevoegdOp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EmailVerstuurd = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailVerstuurdOp = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventParticipants", x => new { x.EventId, x.EmployeeId });
                    table.ForeignKey(
                        name: "FK_EventParticipants_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventParticipants_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipants_EmailVerstuurd",
                table: "EventParticipants",
                column: "EmailVerstuurd");

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipants_EmployeeId",
                table: "EventParticipants",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_AangemaaktOp",
                table: "Events",
                column: "AangemaaktOp");

            migrationBuilder.CreateIndex(
                name: "IX_Events_Datum",
                table: "Events",
                column: "Datum");

            migrationBuilder.CreateIndex(
                name: "IX_Events_DistributieGroepId",
                table: "Events",
                column: "DistributieGroepId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_Status",
                table: "Events",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Events_Type",
                table: "Events",
                column: "Type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventParticipants");

            migrationBuilder.DropTable(
                name: "Events");
        }
    }
}
