using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieHive.Infrastructure.Migrations
{
    /// <summary>
    /// Seed de standaard onboarding en offboarding templates volgens het gemeente Diepenbeek bedrijfsproces.
    /// </summary>
    public partial class SeedDefaultOnboardingTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ==========================================
            // STANDAARD ONBOARDING TEMPLATE
            // ==========================================
            // Workflow: HR -> Management -> ICT -> Preventie -> Medewerker
            // Task types: DataValidatie=18, EmailAccountAanmaken=11, WachtwoordGenereren=12, M365Licentie=1,
            //             LaptopToewijzen=2, IntunePrimaryUser=14, MfaSetup=13, CompanyPortalApps=15,
            //             ToegangsRechten=3, BadgeRegistratie=16, SyntegroRegistratie=17, Werkplek=5
            // Afdelingen: HR=0, ICT=1, Preventie=2, Management=3, Medewerker=4
            var onboardingTasken = "[{\"Titel\":\"Medewerkergegevens valideren\",\"TaskType\":18,\"Beschrijving\":\"Validatie van medewerkergegevens door sectormanager of teamcoach. Controleer persoonlijke gegevens, contractdetails, dienst/sector toewijzing.\",\"Volgorde\":1,\"IsVerplicht\":true,\"VerwachteDuurDagen\":2,\"AfhankelijkVanVolgorde\":null,\"ToegewezenAanAfdeling\":3},{\"Titel\":\"Email account aanmaken (@diepenbeek.be)\",\"TaskType\":11,\"Beschrijving\":\"Aanmaken van het @diepenbeek.be emailadres in Microsoft Entra ID. Volg de naamconventie: voornaam.achternaam@diepenbeek.be\",\"Volgorde\":2,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":1,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"Initieel wachtwoord genereren\",\"TaskType\":12,\"Beschrijving\":\"Genereer een veilig initieel wachtwoord en communiceer dit naar de medewerker. Stel in dat wachtwoord bij eerste login gewijzigd moet worden.\",\"Volgorde\":3,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":2,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"Microsoft 365 licentie toewijzen\",\"TaskType\":1,\"Beschrijving\":\"Wijs de juiste Microsoft 365 licentie toe (E3 of F3) op basis van functie. Controleer beschikbaarheid en activeer de licentie.\",\"Volgorde\":4,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":2,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"Laptop toewijzen\",\"TaskType\":2,\"Beschrijving\":\"Wijs een geschikte laptop toe uit de inventaris. Registreer serienummer en toewijzing in het asset management systeem.\",\"Volgorde\":5,\"IsVerplicht\":true,\"VerwachteDuurDagen\":2,\"AfhankelijkVanVolgorde\":4,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"Intune registratie (Primary User)\",\"TaskType\":14,\"Beschrijving\":\"Registreer de medewerker als primary user op het toegewezen apparaat in Microsoft Intune. Dit gebeurt automatisch bij eerste login.\",\"Volgorde\":6,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":5,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"MFA configureren\",\"TaskType\":13,\"Beschrijving\":\"De medewerker moet Multi-Factor Authenticatie (MFA) instellen via Microsoft Authenticator app. Dit is verplicht voor toegang tot het netwerk.\",\"Volgorde\":7,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":3,\"ToegewezenAanAfdeling\":4},{\"Titel\":\"Company Portal apps installeren\",\"TaskType\":15,\"Beschrijving\":\"Installeer benodigde applicaties via het Microsoft Company Portal. Standaard apps worden automatisch gepusht, extra apps kunnen handmatig worden geinstalleerd.\",\"Volgorde\":8,\"IsVerplicht\":false,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":6,\"ToegewezenAanAfdeling\":4},{\"Titel\":\"Toegangsrechten configureren\",\"TaskType\":3,\"Beschrijving\":\"Configureer de juiste toegangsrechten in Active Directory groepen, SharePoint sites en andere applicaties op basis van functie en dienst.\",\"Volgorde\":9,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":4,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"Badge registratie (gebouwtoegang)\",\"TaskType\":16,\"Beschrijving\":\"Registreer de medewerker voor een toegangsbadge bij de dienst Preventie. Dit geeft toegang tot de werkplek en gemeentegebouwen.\",\"Volgorde\":10,\"IsVerplicht\":true,\"VerwachteDuurDagen\":3,\"AfhankelijkVanVolgorde\":1,\"ToegewezenAanAfdeling\":2},{\"Titel\":\"Syntegro registratie (tijdklok/verlof)\",\"TaskType\":17,\"Beschrijving\":\"Registreer de medewerker in Syntegro voor tijdsregistratie en verlofbeheer. Stel de juiste werkrooster en verlofrechten in.\",\"Volgorde\":11,\"IsVerplicht\":true,\"VerwachteDuurDagen\":2,\"AfhankelijkVanVolgorde\":1,\"ToegewezenAanAfdeling\":0},{\"Titel\":\"Werkplek inrichten\",\"TaskType\":5,\"Beschrijving\":\"Zorg dat de fysieke werkplek gereed is: bureau, stoel, scherm, toetsenbord, muis, en andere benodigde materialen.\",\"Volgorde\":12,\"IsVerplicht\":false,\"VerwachteDuurDagen\":3,\"AfhankelijkVanVolgorde\":1,\"ToegewezenAanAfdeling\":0}]";

            migrationBuilder.Sql($@"
                INSERT INTO OnboardingTemplates (
                    Id, Naam, ProcessType, Beschrijving, VoorEmployeeType, VoorDepartment,
                    VoorDienstId, VoorSectorId, TaskenDefinitie, StandaardDuurDagen,
                    IsActive, IsDefault, Versie, CreatedAt, CreatedBy
                )
                VALUES (
                    '10000000-0000-0000-0001-000000000001',
                    'Standaard Onboarding - Gemeente Diepenbeek',
                    0,
                    'Volledig onboarding proces voor nieuwe medewerkers van de gemeente Diepenbeek. Omvat validatie, ICT setup (account, licentie, laptop), badge registratie en Syntegro.',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    '{onboardingTasken.Replace("'", "''")}',
                    14,
                    1,
                    1,
                    1,
                    datetime('now'),
                    'System (Initial Seed)'
                );
            ");

            // ==========================================
            // STANDAARD OFFBOARDING TEMPLATE
            // ==========================================
            // Task types: ExitInterview=9, Overdracht=6, MateriaalInleveren=7, BadgeIntrekken=19,
            //             SyntegroVerwijderen=20, ToegangsRechten=3, M365Licentie=1, AccountDeactiveren=8
            var offboardingTasken = "[{\"Titel\":\"Exit interview plannen\",\"TaskType\":9,\"Beschrijving\":\"Plan een exit interview met de vertrekkende medewerker om feedback te verzamelen over de werkervaring.\",\"Volgorde\":1,\"IsVerplicht\":false,\"VerwachteDuurDagen\":5,\"AfhankelijkVanVolgorde\":null,\"ToegewezenAanAfdeling\":0},{\"Titel\":\"Kennisoverdracht\",\"TaskType\":6,\"Beschrijving\":\"Zorg voor kennisoverdracht van lopende projecten en verantwoordelijkheden naar collega's of opvolger.\",\"Volgorde\":2,\"IsVerplicht\":true,\"VerwachteDuurDagen\":10,\"AfhankelijkVanVolgorde\":null,\"ToegewezenAanAfdeling\":3},{\"Titel\":\"Materiaal inleveren\",\"TaskType\":7,\"Beschrijving\":\"Laptop, badge, sleutels en andere bedrijfsmiddelen moeten worden ingeleverd bij de verantwoordelijke dienst.\",\"Volgorde\":3,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":null,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"Badge intrekken\",\"TaskType\":19,\"Beschrijving\":\"Trek de toegangsbadge in en verwijder de medewerker uit het gebouwtoegang systeem.\",\"Volgorde\":4,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":3,\"ToegewezenAanAfdeling\":2},{\"Titel\":\"Syntegro verwijderen\",\"TaskType\":20,\"Beschrijving\":\"Verwijder de medewerker uit Syntegro en finaliseer openstaande verlofuren.\",\"Volgorde\":5,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":null,\"ToegewezenAanAfdeling\":0},{\"Titel\":\"Toegangsrechten intrekken\",\"TaskType\":3,\"Beschrijving\":\"Verwijder de medewerker uit alle AD groepen, SharePoint sites en applicatie-toegangen.\",\"Volgorde\":6,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":null,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"M365 licentie vrijgeven\",\"TaskType\":1,\"Beschrijving\":\"Verwijder de Microsoft 365 licentie van het account zodat deze beschikbaar komt voor andere medewerkers.\",\"Volgorde\":7,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":6,\"ToegewezenAanAfdeling\":1},{\"Titel\":\"Account deactiveren\",\"TaskType\":8,\"Beschrijving\":\"Deactiveer het Microsoft Entra ID account. Blokkeer login maar behoud het account 30 dagen voor archiveringsdoeleinden.\",\"Volgorde\":8,\"IsVerplicht\":true,\"VerwachteDuurDagen\":1,\"AfhankelijkVanVolgorde\":7,\"ToegewezenAanAfdeling\":1}]";

            migrationBuilder.Sql($@"
                INSERT INTO OnboardingTemplates (
                    Id, Naam, ProcessType, Beschrijving, VoorEmployeeType, VoorDepartment,
                    VoorDienstId, VoorSectorId, TaskenDefinitie, StandaardDuurDagen,
                    IsActive, IsDefault, Versie, CreatedAt, CreatedBy
                )
                VALUES (
                    '10000000-0000-0000-0001-000000000002',
                    'Standaard Offboarding - Gemeente Diepenbeek',
                    1,
                    'Volledig offboarding proces voor vertrekkende medewerkers. Omvat kennisoverdracht, materiaal inleveren, account deactivatie en toegang intrekken.',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    '{offboardingTasken.Replace("'", "''")}',
                    14,
                    1,
                    1,
                    1,
                    datetime('now'),
                    'System (Initial Seed)'
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM OnboardingTemplates WHERE Id IN (
                    '10000000-0000-0000-0001-000000000001',
                    '10000000-0000-0000-0001-000000000002'
                );
            ");
        }
    }
}
