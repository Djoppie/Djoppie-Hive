using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service voor het synchroniseren van gegevens vanuit Microsoft Graph.
/// </summary>
public interface ISyncService
{
    /// <summary>
    /// Voert een volledige synchronisatie uit vanuit Microsoft Graph.
    /// </summary>
    /// <param name="gestartDoor">Gebruiker die de synchronisatie heeft gestart</param>
    /// <param name="cancellationToken">Annuleringstoken</param>
    /// <returns>Resultaat van de synchronisatie</returns>
    Task<SyncResultaatDto> VoerSyncUitAsync(string gestartDoor, CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt de status op van de huidige of laatste synchronisatie.
    /// </summary>
    Task<SyncStatusDto> GetSyncStatusAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt de synchronisatiegeschiedenis op.
    /// </summary>
    /// <param name="aantal">Aantal logboekitems om op te halen</param>
    Task<IEnumerable<SyncLogboekDto>> GetSyncGeschiedenisAsync(int aantal = 10, CancellationToken cancellationToken = default);
}
