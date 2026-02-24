using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service voor het synchroniseren van MG- distributiegroepen en medewerkers
/// vanuit Microsoft Graph naar de lokale database.
/// </summary>
public class SyncService : ISyncService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SyncService> _logger;
    private const string MgGroupPrefix = "MG-";
    private const string SectorPrefix = "MG-SECTOR-";

    public SyncService(
        GraphServiceClient graphClient,
        ApplicationDbContext context,
        ILogger<SyncService> logger)
    {
        _graphClient = graphClient;
        _context = context;
        _logger = logger;
    }

    public async Task<SyncResultaatDto> VoerSyncUitAsync(
        string gestartDoor,
        CancellationToken cancellationToken = default)
    {
        // Controleer of er al een sync bezig is
        var bezigSync = await _context.SyncLogboeken
            .Where(s => s.Status == SyncStatus.Bezig)
            .FirstOrDefaultAsync(cancellationToken);

        if (bezigSync != null)
        {
            throw new InvalidOperationException(
                $"Er is al een synchronisatie bezig (gestart op {bezigSync.GeStartOp:dd-MM-yyyy HH:mm} door {bezigSync.GestartDoor})");
        }

        // Maak nieuw logboek aan
        var syncLogboek = new SyncLogboek
        {
            Id = Guid.NewGuid(),
            GeStartOp = DateTime.UtcNow,
            GestartDoor = gestartDoor,
            Status = SyncStatus.Bezig
        };

        _context.SyncLogboeken.Add(syncLogboek);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Synchronisatie gestart door {GestartDoor}", gestartDoor);

        try
        {
            // Haal alle MG- groepen op uit Graph
            var graphGroups = await HaalMgGroepenOpAsync(cancellationToken);
            _logger.LogInformation("Opgehaald: {Aantal} MG- groepen uit Graph API", graphGroups.Count);

            // Bouw mapping van dienst EntraObjectId → sector info via Graph nested groups
            var dienstNaarSectorMap = new Dictionary<string, string>();

            // Eerste pass: Verwerk sectoren (MG-SECTOR-*) en bepaal nested groups
            var sectoren = graphGroups.Where(g =>
                g.DisplayName?.StartsWith(SectorPrefix, StringComparison.OrdinalIgnoreCase) == true).ToList();

            foreach (var sector in sectoren)
            {
                await VerwerkGroepAsync(sector, null, GroepNiveau.Sector, syncLogboek, cancellationToken);

                // Haal nested groups (diensten) op die lid zijn van deze sector
                var nestedGroups = await HaalNestedGroupsOpAsync(sector.Id!, cancellationToken);
                foreach (var nestedGroup in nestedGroups)
                {
                    dienstNaarSectorMap[nestedGroup.Id!] = sector.Id!;
                    _logger.LogDebug("Dienst {Dienst} is lid van sector {Sector}",
                        nestedGroup.DisplayName, sector.DisplayName);
                }
            }

            _logger.LogInformation("Mapping gebouwd: {Aantal} diensten gekoppeld aan sectoren", dienstNaarSectorMap.Count);

            // Tweede pass: Verwerk diensten (andere MG- groepen)
            var diensten = graphGroups.Where(g =>
                g.DisplayName?.StartsWith(MgGroupPrefix, StringComparison.OrdinalIgnoreCase) == true &&
                !g.DisplayName.StartsWith(SectorPrefix, StringComparison.OrdinalIgnoreCase)).ToList();

            foreach (var dienst in diensten)
            {
                // Zoek bovenliggende sector via de Graph-based mapping
                DistributionGroup? bovenliggendeGroep = null;
                if (dienstNaarSectorMap.TryGetValue(dienst.Id!, out var sectorEntraId))
                {
                    bovenliggendeGroep = await _context.DistributionGroups
                        .FirstOrDefaultAsync(g => g.EntraObjectId == sectorEntraId, cancellationToken);
                }

                await VerwerkGroepAsync(dienst, bovenliggendeGroep?.Id, GroepNiveau.Dienst, syncLogboek, cancellationToken);
            }

            // Detecteer verwijderde lidmaatschappen en maak validatieverzoeken
            await DetecteerVerwijderingenAsync(syncLogboek, cancellationToken);

            // Markeer sync als voltooid
            syncLogboek.Status = SyncStatus.Voltooid;
            syncLogboek.VoltooidOp = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Synchronisatie voltooid. Groepen: {Groepen}, Medewerkers toegevoegd: {Toegevoegd}, " +
                "bijgewerkt: {Bijgewerkt}, Validatieverzoeken: {Validaties}",
                syncLogboek.GroepenVerwerkt,
                syncLogboek.MedewerkersToegevoegd,
                syncLogboek.MedewerkersBijgewerkt,
                syncLogboek.ValidatieVerzoekenAangemaakt);

            return MaakResultaatDto(syncLogboek);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Synchronisatie mislukt");

            syncLogboek.Status = SyncStatus.Mislukt;
            syncLogboek.VoltooidOp = DateTime.UtcNow;
            syncLogboek.Foutmelding = ex.Message;
            syncLogboek.FoutDetails = ex.ToString();
            await _context.SaveChangesAsync(cancellationToken);

            throw;
        }
    }

    public async Task<SyncStatusDto> GetSyncStatusAsync(CancellationToken cancellationToken = default)
    {
        var bezigSync = await _context.SyncLogboeken
            .Where(s => s.Status == SyncStatus.Bezig)
            .FirstOrDefaultAsync(cancellationToken);

        if (bezigSync != null)
        {
            return new SyncStatusDto(
                IsSyncBezig: true,
                LaatsteSyncOp: bezigSync.GeStartOp,
                LaatsteSyncStatus: "Bezig",
                HuidigeSyncId: bezigSync.Id);
        }

        var laatsteSync = await _context.SyncLogboeken
            .OrderByDescending(s => s.GeStartOp)
            .FirstOrDefaultAsync(cancellationToken);

        return new SyncStatusDto(
            IsSyncBezig: false,
            LaatsteSyncOp: laatsteSync?.VoltooidOp ?? laatsteSync?.GeStartOp,
            LaatsteSyncStatus: laatsteSync?.Status.ToString(),
            HuidigeSyncId: null);
    }

    public async Task<IEnumerable<SyncLogboekDto>> GetSyncGeschiedenisAsync(
        int aantal = 10,
        CancellationToken cancellationToken = default)
    {
        var logboeken = await _context.SyncLogboeken
            .OrderByDescending(s => s.GeStartOp)
            .Take(aantal)
            .ToListAsync(cancellationToken);

        return logboeken.Select(s => new SyncLogboekDto(
            s.Id,
            s.GeStartOp,
            s.VoltooidOp,
            s.Status.ToString(),
            s.GestartDoor,
            s.GroepenVerwerkt,
            s.MedewerkersToegevoegd,
            s.MedewerkersBijgewerkt,
            s.MedewerkersVerwijderd,
            s.ValidatieVerzoekenAangemaakt));
    }

    private async Task<List<Group>> HaalMgGroepenOpAsync(CancellationToken cancellationToken)
    {
        var result = new List<Group>();

        var response = await _graphClient.Groups
            .GetAsync(config =>
            {
                config.QueryParameters.Filter = $"startsWith(displayName, '{MgGroupPrefix}')";
                config.QueryParameters.Select = ["id", "displayName", "description", "mail"];
            }, cancellationToken);

        if (response?.Value != null)
        {
            result.AddRange(response.Value);

            // Haal volgende pagina's op indien aanwezig
            var pageIterator = PageIterator<Group, GroupCollectionResponse>.CreatePageIterator(
                _graphClient,
                response,
                (group) =>
                {
                    result.Add(group);
                    return true;
                });

            await pageIterator.IterateAsync(cancellationToken);
        }

        return result;
    }

    private async Task VerwerkGroepAsync(
        Group graphGroup,
        Guid? bovenliggendeGroepId,
        GroepNiveau niveau,
        SyncLogboek syncLogboek,
        CancellationToken cancellationToken)
    {
        // Zoek of upsert de distributiegroep
        var bestaandeGroep = await _context.DistributionGroups
            .FirstOrDefaultAsync(g => g.EntraObjectId == graphGroup.Id!, cancellationToken);

        DistributionGroup groep;

        if (bestaandeGroep == null)
        {
            groep = new DistributionGroup
            {
                Id = Guid.NewGuid(),
                EntraObjectId = graphGroup.Id!,
                DisplayName = graphGroup.DisplayName ?? string.Empty,
                Description = graphGroup.Description,
                Email = graphGroup.Mail ?? string.Empty,
                Niveau = niveau,
                BovenliggendeGroepId = bovenliggendeGroepId,
                CreatedAt = DateTime.UtcNow,
                LastSyncedAt = DateTime.UtcNow
            };
            _context.DistributionGroups.Add(groep);
        }
        else
        {
            groep = bestaandeGroep;
            groep.DisplayName = graphGroup.DisplayName ?? string.Empty;
            groep.Description = graphGroup.Description;
            groep.Email = graphGroup.Mail ?? string.Empty;
            groep.Niveau = niveau;
            groep.BovenliggendeGroepId = bovenliggendeGroepId;
            groep.UpdatedAt = DateTime.UtcNow;
            groep.LastSyncedAt = DateTime.UtcNow;
        }

        syncLogboek.GroepenVerwerkt++;
        await _context.SaveChangesAsync(cancellationToken);

        // Haal leden op en verwerk
        await VerwerkGroepLedenAsync(graphGroup.Id!, groep, syncLogboek, cancellationToken);
    }

    private async Task VerwerkGroepLedenAsync(
        string graphGroupId,
        DistributionGroup groep,
        SyncLogboek syncLogboek,
        CancellationToken cancellationToken)
    {
        // Haal alle leden op uit Graph
        var graphMembers = new List<User>();
        var response = await _graphClient.Groups[graphGroupId].Members
            .GetAsync(config =>
            {
                config.QueryParameters.Select = ["id", "displayName", "mail", "givenName", "surname", "jobTitle", "department"];
            }, cancellationToken);

        if (response?.Value != null)
        {
            graphMembers.AddRange(response.Value.OfType<User>());
        }

        // Haal bestaande actieve lidmaatschappen op
        var bestaandeLidmaatschappen = await _context.EmployeeGroupMemberships
            .Where(m => m.DistributionGroupId == groep.Id && m.IsActief)
            .Include(m => m.Employee)
            .ToListAsync(cancellationToken);

        var graphMemberIds = new HashSet<string>(graphMembers.Select(m => m.Id!));

        // Verwerk elk Graph lid
        foreach (var graphUser in graphMembers)
        {
            var employee = await ZoekOfMaakMedewerkerAsync(graphUser, syncLogboek, cancellationToken);

            // Stel DienstId in als dit een dienst is (niet een sector)
            if (groep.Niveau == GroepNiveau.Dienst && employee.DienstId != groep.Id)
            {
                employee.DienstId = groep.Id;
                _logger.LogDebug("DienstId ingesteld voor {Employee} naar {Dienst}",
                    employee.DisplayName, groep.DisplayName);
            }

            // Controleer of lidmaatschap al bestaat
            var bestaandLidmaatschap = bestaandeLidmaatschappen
                .FirstOrDefault(m => m.Employee.EntraObjectId == graphUser.Id);

            if (bestaandLidmaatschap == null)
            {
                // Nieuw lidmaatschap
                var nieuwLidmaatschap = new EmployeeGroupMembership
                {
                    EmployeeId = employee.Id,
                    DistributionGroupId = groep.Id,
                    Bron = GegevensBron.AzureAD,
                    ToegevoegdOp = DateTime.UtcNow,
                    IsActief = true
                };
                _context.EmployeeGroupMemberships.Add(nieuwLidmaatschap);
                syncLogboek.LidmaatschappenToegevoegd++;
            }
        }

        // Markeer lidmaatschappen die niet meer in Graph staan als verwijderd
        foreach (var lidmaatschap in bestaandeLidmaatschappen)
        {
            if (!graphMemberIds.Contains(lidmaatschap.Employee.EntraObjectId) &&
                lidmaatschap.Bron == GegevensBron.AzureAD)
            {
                lidmaatschap.IsActief = false;
                lidmaatschap.VerwijderdOp = DateTime.UtcNow;
                syncLogboek.LidmaatschappenVerwijderd++;

                // Maak validatieverzoek aan
                var validatieVerzoek = new ValidatieVerzoek
                {
                    Id = Guid.NewGuid(),
                    Type = ValidatieVerzoekType.LidVerwijderd,
                    Beschrijving = $"{lidmaatschap.Employee.DisplayName} verwijderd uit {groep.DisplayName}",
                    EmployeeId = lidmaatschap.EmployeeId,
                    DistributionGroupId = groep.Id,
                    VorigeWaarde = $"Lid van {groep.DisplayName}",
                    ToegwezenAanRol = "teamcoach",
                    ToegwezenAanGroepId = groep.Id,
                    Status = ValidatieVerzoekStatus.InAfwachting,
                    SyncLogboekId = syncLogboek.Id,
                    AangemaaktOp = DateTime.UtcNow
                };
                _context.ValidatieVerzoeken.Add(validatieVerzoek);
                syncLogboek.ValidatieVerzoekenAangemaakt++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Employee> ZoekOfMaakMedewerkerAsync(
        User graphUser,
        SyncLogboek syncLogboek,
        CancellationToken cancellationToken)
    {
        var bestaandeMedewerker = await _context.Employees
            .FirstOrDefaultAsync(e => e.EntraObjectId == graphUser.Id!, cancellationToken);

        if (bestaandeMedewerker != null)
        {
            // Update medewerkergegevens
            var wasGewijzigd = false;

            if (bestaandeMedewerker.DisplayName != (graphUser.DisplayName ?? string.Empty))
            {
                bestaandeMedewerker.DisplayName = graphUser.DisplayName ?? string.Empty;
                wasGewijzigd = true;
            }
            if (bestaandeMedewerker.Email != (graphUser.Mail ?? string.Empty))
            {
                bestaandeMedewerker.Email = graphUser.Mail ?? string.Empty;
                wasGewijzigd = true;
            }
            if (bestaandeMedewerker.GivenName != graphUser.GivenName)
            {
                bestaandeMedewerker.GivenName = graphUser.GivenName;
                wasGewijzigd = true;
            }
            if (bestaandeMedewerker.Surname != graphUser.Surname)
            {
                bestaandeMedewerker.Surname = graphUser.Surname;
                wasGewijzigd = true;
            }
            if (bestaandeMedewerker.JobTitle != graphUser.JobTitle)
            {
                bestaandeMedewerker.JobTitle = graphUser.JobTitle;
                wasGewijzigd = true;
            }
            if (bestaandeMedewerker.Department != graphUser.Department)
            {
                bestaandeMedewerker.Department = graphUser.Department;
                wasGewijzigd = true;
            }

            if (wasGewijzigd)
            {
                bestaandeMedewerker.UpdatedAt = DateTime.UtcNow;
                syncLogboek.MedewerkersBijgewerkt++;
            }

            bestaandeMedewerker.LastSyncedAt = DateTime.UtcNow;
            return bestaandeMedewerker;
        }

        // Nieuwe medewerker
        var nieuweMedewerker = new Employee
        {
            Id = Guid.NewGuid(),
            EntraObjectId = graphUser.Id!,
            DisplayName = graphUser.DisplayName ?? string.Empty,
            Email = graphUser.Mail ?? string.Empty,
            GivenName = graphUser.GivenName,
            Surname = graphUser.Surname,
            JobTitle = graphUser.JobTitle,
            Department = graphUser.Department,
            Bron = GegevensBron.AzureAD,
            IsHandmatigToegevoegd = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            LastSyncedAt = DateTime.UtcNow
        };

        _context.Employees.Add(nieuweMedewerker);
        syncLogboek.MedewerkersToegevoegd++;

        return nieuweMedewerker;
    }

    /// <summary>
    /// Haalt nested groups (diensten) op die lid zijn van een sector group.
    /// Dit bepaalt de daadwerkelijke hiërarchie in plaats van naamgeving.
    /// </summary>
    private async Task<List<Group>> HaalNestedGroupsOpAsync(
        string sectorGroupId,
        CancellationToken cancellationToken)
    {
        var result = new List<Group>();

        try
        {
            var response = await _graphClient.Groups[sectorGroupId].Members
                .GetAsync(config =>
                {
                    config.QueryParameters.Select = ["id", "displayName", "description", "mail"];
                }, cancellationToken);

            if (response?.Value != null)
            {
                // Filter alleen Group type members (nested groups/diensten)
                result.AddRange(response.Value.OfType<Group>());
            }

            _logger.LogDebug("Sector {SectorId} bevat {Aantal} nested groups", sectorGroupId, result.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Kon nested groups niet ophalen voor sector {SectorId}", sectorGroupId);
        }

        return result;
    }

    private async Task DetecteerVerwijderingenAsync(
        SyncLogboek syncLogboek,
        CancellationToken cancellationToken)
    {
        // Detecteer medewerkers die niet meer in enige groep zitten (optioneel)
        // Dit kan uitgebreid worden indien nodig

        await Task.CompletedTask; // Placeholder voor toekomstige logica
    }

    private static SyncResultaatDto MaakResultaatDto(SyncLogboek logboek)
    {
        return new SyncResultaatDto(
            logboek.Id,
            logboek.GeStartOp,
            logboek.VoltooidOp ?? DateTime.UtcNow,
            logboek.Status.ToString(),
            logboek.GroepenVerwerkt,
            logboek.MedewerkersToegevoegd,
            logboek.MedewerkersBijgewerkt,
            logboek.MedewerkersVerwijderd,
            logboek.LidmaatschappenToegevoegd,
            logboek.LidmaatschappenVerwijderd,
            logboek.ValidatieVerzoekenAangemaakt,
            logboek.Foutmelding);
    }
}
