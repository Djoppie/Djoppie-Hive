using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncEnValidatieEntiteiten : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DistributionGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    EntraObjectId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    GroupType = table.Column<string>(type: "TEXT", nullable: true),
                    MemberCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastSyncedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    BovenliggendeGroepId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Niveau = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DistributionGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DistributionGroups_DistributionGroups_BovenliggendeGroepId",
                        column: x => x.BovenliggendeGroepId,
                        principalTable: "DistributionGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    EntraObjectId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    GivenName = table.Column<string>(type: "TEXT", nullable: true),
                    Surname = table.Column<string>(type: "TEXT", nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    JobTitle = table.Column<string>(type: "TEXT", nullable: true),
                    Department = table.Column<string>(type: "TEXT", nullable: true),
                    OfficeLocation = table.Column<string>(type: "TEXT", nullable: true),
                    MobilePhone = table.Column<string>(type: "TEXT", nullable: true),
                    BusinessPhones = table.Column<string>(type: "TEXT", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastSyncedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Bron = table.Column<int>(type: "INTEGER", nullable: false),
                    IsHandmatigToegevoegd = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SyncLogboeken",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    GeStartOp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    VoltooidOp = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    GestartDoor = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    GroepenVerwerkt = table.Column<int>(type: "INTEGER", nullable: false),
                    MedewerkersToegevoegd = table.Column<int>(type: "INTEGER", nullable: false),
                    MedewerkersBijgewerkt = table.Column<int>(type: "INTEGER", nullable: false),
                    MedewerkersVerwijderd = table.Column<int>(type: "INTEGER", nullable: false),
                    LidmaatschappenToegevoegd = table.Column<int>(type: "INTEGER", nullable: false),
                    LidmaatschappenVerwijderd = table.Column<int>(type: "INTEGER", nullable: false),
                    ValidatieVerzoekenAangemaakt = table.Column<int>(type: "INTEGER", nullable: false),
                    Foutmelding = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    FoutDetails = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncLogboeken", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeGroupMemberships",
                columns: table => new
                {
                    EmployeeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DistributionGroupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ToegevoegdOp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Bron = table.Column<int>(type: "INTEGER", nullable: false),
                    VerwijderdOp = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsActief = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeGroupMemberships", x => new { x.EmployeeId, x.DistributionGroupId });
                    table.ForeignKey(
                        name: "FK_EmployeeGroupMemberships_DistributionGroups_DistributionGroupId",
                        column: x => x.DistributionGroupId,
                        principalTable: "DistributionGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmployeeGroupMemberships_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ValidatieVerzoeken",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Beschrijving = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    EmployeeId = table.Column<Guid>(type: "TEXT", nullable: true),
                    DistributionGroupId = table.Column<Guid>(type: "TEXT", nullable: true),
                    VorigeWaarde = table.Column<string>(type: "TEXT", nullable: true),
                    NieuweWaarde = table.Column<string>(type: "TEXT", nullable: true),
                    ToegwezenAanRol = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    ToegwezenAanGroepId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    AfgehandeldDoor = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    AfgehandeldOp = table.Column<DateTime>(type: "TEXT", nullable: true),
                    AfhandelingNotities = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Afhandeling = table.Column<int>(type: "INTEGER", nullable: true),
                    AangemaaktOp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SyncLogboekId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ValidatieVerzoeken", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ValidatieVerzoeken_DistributionGroups_DistributionGroupId",
                        column: x => x.DistributionGroupId,
                        principalTable: "DistributionGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ValidatieVerzoeken_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ValidatieVerzoeken_SyncLogboeken_SyncLogboekId",
                        column: x => x.SyncLogboekId,
                        principalTable: "SyncLogboeken",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DistributionGroups_BovenliggendeGroepId",
                table: "DistributionGroups",
                column: "BovenliggendeGroepId");

            migrationBuilder.CreateIndex(
                name: "IX_DistributionGroups_DisplayName",
                table: "DistributionGroups",
                column: "DisplayName");

            migrationBuilder.CreateIndex(
                name: "IX_DistributionGroups_EntraObjectId",
                table: "DistributionGroups",
                column: "EntraObjectId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DistributionGroups_Niveau",
                table: "DistributionGroups",
                column: "Niveau");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeGroupMemberships_Bron",
                table: "EmployeeGroupMemberships",
                column: "Bron");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeGroupMemberships_DistributionGroupId",
                table: "EmployeeGroupMemberships",
                column: "DistributionGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeGroupMemberships_IsActief",
                table: "EmployeeGroupMemberships",
                column: "IsActief");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_Bron",
                table: "Employees",
                column: "Bron");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_Email",
                table: "Employees",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_EntraObjectId",
                table: "Employees",
                column: "EntraObjectId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SyncLogboeken_GeStartOp",
                table: "SyncLogboeken",
                column: "GeStartOp");

            migrationBuilder.CreateIndex(
                name: "IX_SyncLogboeken_Status",
                table: "SyncLogboeken",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ValidatieVerzoeken_AangemaaktOp",
                table: "ValidatieVerzoeken",
                column: "AangemaaktOp");

            migrationBuilder.CreateIndex(
                name: "IX_ValidatieVerzoeken_DistributionGroupId",
                table: "ValidatieVerzoeken",
                column: "DistributionGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ValidatieVerzoeken_EmployeeId",
                table: "ValidatieVerzoeken",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ValidatieVerzoeken_Status",
                table: "ValidatieVerzoeken",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ValidatieVerzoeken_SyncLogboekId",
                table: "ValidatieVerzoeken",
                column: "SyncLogboekId");

            migrationBuilder.CreateIndex(
                name: "IX_ValidatieVerzoeken_Type",
                table: "ValidatieVerzoeken",
                column: "Type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeeGroupMemberships");

            migrationBuilder.DropTable(
                name: "ValidatieVerzoeken");

            migrationBuilder.DropTable(
                name: "DistributionGroups");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "SyncLogboeken");
        }
    }
}
