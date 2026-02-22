namespace DjoppieHive.Core.Enums;

/// <summary>
/// Status van een synchronisatieoperatie.
/// </summary>
public enum SyncStatus
{
    /// <summary>
    /// Synchronisatie is momenteel bezig.
    /// </summary>
    Bezig = 0,

    /// <summary>
    /// Synchronisatie succesvol voltooid.
    /// </summary>
    Voltooid = 1,

    /// <summary>
    /// Synchronisatie mislukt met fouten.
    /// </summary>
    Mislukt = 2,

    /// <summary>
    /// Synchronisatie voltooid maar met enkele fouten.
    /// </summary>
    GedeeltelijkVoltooid = 3
}
