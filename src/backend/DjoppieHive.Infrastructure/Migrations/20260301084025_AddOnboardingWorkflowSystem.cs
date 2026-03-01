using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingWorkflowSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OnboardingTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Naam = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    ProcessType = table.Column<int>(type: "INTEGER", nullable: false),
                    Beschrijving = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    VoorEmployeeType = table.Column<int>(type: "INTEGER", nullable: true),
                    VoorDepartment = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    VoorDienstId = table.Column<Guid>(type: "TEXT", nullable: true),
                    VoorSectorId = table.Column<Guid>(type: "TEXT", nullable: true),
                    TaskenDefinitie = table.Column<string>(type: "TEXT", nullable: false),
                    StandaardDuurDagen = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    Versie = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OnboardingTemplates_DistributionGroups_VoorDienstId",
                        column: x => x.VoorDienstId,
                        principalTable: "DistributionGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "OnboardingProcesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Titel = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Beschrijving = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    GeplandeStartdatum = table.Column<DateTime>(type: "TEXT", nullable: false),
                    GewensteEinddatum = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DatumVoltooid = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DatumGeannuleerd = table.Column<DateTime>(type: "TEXT", nullable: true),
                    VerantwoordelijkeId = table.Column<Guid>(type: "TEXT", nullable: true),
                    VerantwoordelijkeEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    VerantwoordelijkeNaam = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    VoortgangPercentage = table.Column<int>(type: "INTEGER", nullable: false),
                    AantalVoltooideTaken = table.Column<int>(type: "INTEGER", nullable: false),
                    TotaalAantalTaken = table.Column<int>(type: "INTEGER", nullable: false),
                    TemplateId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Prioriteit = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingProcesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OnboardingProcesses_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OnboardingProcesses_OnboardingTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "OnboardingTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "OnboardingTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OnboardingProcessId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaskType = table.Column<int>(type: "INTEGER", nullable: false),
                    Titel = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Beschrijving = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Volgorde = table.Column<int>(type: "INTEGER", nullable: false),
                    IsVerplicht = table.Column<bool>(type: "INTEGER", nullable: false),
                    VerwachteDuurDagen = table.Column<int>(type: "INTEGER", nullable: false),
                    Deadline = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ToegewezenAanId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ToegewezenAanEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ToegewezenAanNaam = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    GestartOp = table.Column<DateTime>(type: "TEXT", nullable: true),
                    VoltooidOp = table.Column<DateTime>(type: "TEXT", nullable: true),
                    VoltooidDoor = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    VoltooiingNotities = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    AfhankelijkVanTaakId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Metadata = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OnboardingTasks_OnboardingProcesses_OnboardingProcessId",
                        column: x => x.OnboardingProcessId,
                        principalTable: "OnboardingProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OnboardingTasks_OnboardingTasks_AfhankelijkVanTaakId",
                        column: x => x.AfhankelijkVanTaakId,
                        principalTable: "OnboardingTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_CreatedAt",
                table: "OnboardingProcesses",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_EmployeeId",
                table: "OnboardingProcesses",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_GeplandeStartdatum",
                table: "OnboardingProcesses",
                column: "GeplandeStartdatum");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_IsActive",
                table: "OnboardingProcesses",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_Status",
                table: "OnboardingProcesses",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_TemplateId",
                table: "OnboardingProcesses",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_Type",
                table: "OnboardingProcesses",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_VerantwoordelijkeId",
                table: "OnboardingProcesses",
                column: "VerantwoordelijkeId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_AfhankelijkVanTaakId",
                table: "OnboardingTasks",
                column: "AfhankelijkVanTaakId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_Deadline",
                table: "OnboardingTasks",
                column: "Deadline");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_IsActive",
                table: "OnboardingTasks",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_OnboardingProcessId",
                table: "OnboardingTasks",
                column: "OnboardingProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_Status",
                table: "OnboardingTasks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_TaskType",
                table: "OnboardingTasks",
                column: "TaskType");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_ToegewezenAanId",
                table: "OnboardingTasks",
                column: "ToegewezenAanId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_Volgorde",
                table: "OnboardingTasks",
                column: "Volgorde");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTemplates_IsActive",
                table: "OnboardingTemplates",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTemplates_IsDefault",
                table: "OnboardingTemplates",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTemplates_ProcessType",
                table: "OnboardingTemplates",
                column: "ProcessType");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTemplates_VoorDienstId",
                table: "OnboardingTemplates",
                column: "VoorDienstId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTemplates_VoorEmployeeType",
                table: "OnboardingTemplates",
                column: "VoorEmployeeType");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTemplates_VoorSectorId",
                table: "OnboardingTemplates",
                column: "VoorSectorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OnboardingTasks");

            migrationBuilder.DropTable(
                name: "OnboardingProcesses");

            migrationBuilder.DropTable(
                name: "OnboardingTemplates");
        }
    }
}
