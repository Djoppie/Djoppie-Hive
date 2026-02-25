using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Stub implementation of ISyncService when Graph API is not configured.
/// Returns appropriate responses indicating sync is not available.
/// </summary>
public class StubSyncService : ISyncService
{
    public Task<SyncResultaatDto> VoerSyncUitAsync(string gestartDoor, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return Task.FromResult(new SyncResultaatDto(
            SyncLogboekId: Guid.Empty,
            GeStartOp: now,
            VoltooidOp: now,
            Status: "Mislukt",
            GroepenVerwerkt: 0,
            MedewerkersToegevoegd: 0,
            MedewerkersBijgewerkt: 0,
            MedewerkersVerwijderd: 0,
            LidmaatschappenToegevoegd: 0,
            LidmaatschappenVerwijderd: 0,
            ValidatieVerzoekenAangemaakt: 0,
            Foutmelding: "Graph API is niet geconfigureerd. Synchronisatie is niet beschikbaar."
        ));
    }

    public Task<SyncStatusDto> GetSyncStatusAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new SyncStatusDto(
            IsSyncBezig: false,
            LaatsteSyncOp: null,
            LaatsteSyncStatus: "Graph API niet geconfigureerd",
            HuidigeSyncId: null
        ));
    }

    public Task<IEnumerable<SyncLogboekDto>> GetSyncGeschiedenisAsync(int aantal = 10, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<SyncLogboekDto>());
    }

    public Task<SyncPreviewDto> GetSyncPreviewAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new SyncPreviewDto(
            Gebruikers: Enumerable.Empty<ADUserPreviewDto>(),
            Groepen: Enumerable.Empty<ADGroupPreviewDto>(),
            Statistieken: new SyncPreviewStatisticsDto(
                TotaalGebruikers: 0,
                ActieveGebruikers: 0,
                InactieveGebruikers: 0,
                NieuweGebruikers: 0,
                BestaandeGebruikers: 0,
                TotaalGroepen: 0,
                NieuweGroepen: 0,
                BestaandeGroepen: 0
            ),
            OpgehaaldOp: DateTime.UtcNow
        ));
    }
}
