using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <summary>
    /// Seed de initiële ICT Super Admin gebruiker.
    /// </summary>
    public partial class SeedInitialAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Voeg Jo Wijnen toe als ICT Super Admin
            // EntraObjectId wordt automatisch bijgewerkt bij eerste login via UserContextService
            migrationBuilder.Sql(@"
                INSERT INTO UserRoles (Id, EntraObjectId, Email, DisplayName, Role, SectorId, DienstId, CreatedAt, CreatedBy, IsActive, UpdatedAt, UpdatedBy)
                VALUES (
                    '00000000-0000-0000-0000-000000000001',
                    'pending-first-login',
                    'jo.wijnen@diepenbeek.be',
                    'Jo Wijnen',
                    'ict_super_admin',
                    NULL,
                    NULL,
                    datetime('now'),
                    'System (Initial Seed)',
                    1,
                    NULL,
                    NULL
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM UserRoles WHERE Id = '00000000-0000-0000-0000-000000000001';
            ");
        }
    }
}
