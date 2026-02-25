using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service voor het beheren van validatieverzoeken.
/// </summary>
public interface IValidatieVerzoekService
{
    /// <summary>
    /// Haalt alle openstaande validatieverzoeken op.
    /// </summary>
    /// <param name="groepId">Optioneel filter op groep</param>
    /// <param name="cancellationToken">Annuleringstoken</param>
    Task<IEnumerable<ValidatieVerzoekDto>> GetOpenstaandeVerzoekenAsync(
        Guid? groepId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt een specifiek validatieverzoek op.
    /// </summary>
    Task<ValidatieVerzoekDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Handelt een validatieverzoek af.
    /// </summary>
    /// <param name="id">ID van het verzoek</param>
    /// <param name="afhandeling">Gekozen afhandelingsactie</param>
    /// <param name="afgehandeldDoor">Gebruiker die afhandelt</param>
    /// <param name="notities">Optionele notities</param>
    /// <param name="cancellationToken">Annuleringstoken</param>
    Task<bool> HandelAfAsync(
        Guid id,
        ValidatieAfhandeling afhandeling,
        string afgehandeldDoor,
        string? notities = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Haalt het aantal openstaande verzoeken op (voor badge weergave).
    /// </summary>
    Task<int> GetOpenstaandAantalAsync(Guid? groepId = null, CancellationToken cancellationToken = default);
}
