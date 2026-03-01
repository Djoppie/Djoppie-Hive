using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <summary>
    /// Voegt ontbrekende indexes toe voor betere query performance.
    /// Gebaseerd op database analyse aanbevelingen.
    /// </summary>
    public partial class AddMissingIndexesForPerformance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ==========================================
            // EMPLOYEE INDEXES
            // ==========================================

            // Index op IsActive - bijna elke query filtert op actieve medewerkers
            migrationBuilder.CreateIndex(
                name: "IX_Employees_IsActive",
                table: "Employees",
                column: "IsActive");

            // Index op DisplayName - voor zoekfunctionaliteit
            migrationBuilder.CreateIndex(
                name: "IX_Employees_DisplayName",
                table: "Employees",
                column: "DisplayName");

            // Index op JobTitle - voor JobTitleRoleMapping matching
            migrationBuilder.CreateIndex(
                name: "IX_Employees_JobTitle",
                table: "Employees",
                column: "JobTitle");

            // Composite index voor medewerkers per dienst query
            migrationBuilder.CreateIndex(
                name: "IX_Employees_DienstId_IsActive",
                table: "Employees",
                columns: new[] { "DienstId", "IsActive" });

            // Index op ValidatieStatus - voor filtering validatie dashboard
            migrationBuilder.CreateIndex(
                name: "IX_Employees_ValidatieStatus",
                table: "Employees",
                column: "ValidatieStatus");

            // ==========================================
            // VALIDATIEVERZOEK INDEXES
            // ==========================================

            // Composite index voor openstaande verzoeken per groep
            migrationBuilder.CreateIndex(
                name: "IX_ValidatieVerzoeken_ToegwezenAanGroepId_Status",
                table: "ValidatieVerzoeken",
                columns: new[] { "ToegwezenAanGroepId", "Status" });

            // ==========================================
            // ONBOARDING TASK INDEXES
            // ==========================================

            // Index op ToegewezenAanAfdeling - voor filteren taken per afdeling
            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_ToegewezenAanAfdeling",
                table: "OnboardingTasks",
                column: "ToegewezenAanAfdeling");

            // Composite index voor takenlijst queries (process + status + volgorde)
            migrationBuilder.CreateIndex(
                name: "IX_OnboardingTasks_ProcessId_Status_Volgorde",
                table: "OnboardingTasks",
                columns: new[] { "OnboardingProcessId", "Status", "Volgorde" });

            // ==========================================
            // EMPLOYEE GROUP MEMBERSHIP INDEXES
            // ==========================================

            // Covering index voor groepsleden met status
            migrationBuilder.CreateIndex(
                name: "IX_EmployeeGroupMemberships_GroupId_IsActief",
                table: "EmployeeGroupMemberships",
                columns: new[] { "DistributionGroupId", "IsActief" });

            // ==========================================
            // ONBOARDING PROCESS INDEXES
            // ==========================================

            // Composite index voor process filtering (type + status)
            migrationBuilder.CreateIndex(
                name: "IX_OnboardingProcesses_Type_Status",
                table: "OnboardingProcesses",
                columns: new[] { "Type", "Status" });

            // Note: IX_OnboardingProcesses_EmployeeId already exists (created by FK)
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Employee indexes
            migrationBuilder.DropIndex("IX_Employees_IsActive", "Employees");
            migrationBuilder.DropIndex("IX_Employees_DisplayName", "Employees");
            migrationBuilder.DropIndex("IX_Employees_JobTitle", "Employees");
            migrationBuilder.DropIndex("IX_Employees_DienstId_IsActive", "Employees");
            migrationBuilder.DropIndex("IX_Employees_ValidatieStatus", "Employees");

            // ValidatieVerzoek indexes
            migrationBuilder.DropIndex("IX_ValidatieVerzoeken_ToegwezenAanGroepId_Status", "ValidatieVerzoeken");

            // OnboardingTask indexes
            migrationBuilder.DropIndex("IX_OnboardingTasks_ToegewezenAanAfdeling", "OnboardingTasks");
            migrationBuilder.DropIndex("IX_OnboardingTasks_ProcessId_Status_Volgorde", "OnboardingTasks");

            // EmployeeGroupMembership indexes
            migrationBuilder.DropIndex("IX_EmployeeGroupMemberships_GroupId_IsActief", "EmployeeGroupMemberships");

            // OnboardingProcess indexes
            migrationBuilder.DropIndex("IX_OnboardingProcesses_Type_Status", "OnboardingProcesses");
        }
    }
}
