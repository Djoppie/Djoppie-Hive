namespace DjoppieHive.Core.Enums;

/// <summary>
/// Geeft de bron van gegevens aan voor medewerkers en groepslidmaatschappen.
/// </summary>
public enum GegevensBron
{
    /// <summary>
    /// Gegevens gesynchroniseerd vanuit Microsoft Entra ID via Graph API.
    /// </summary>
    AzureAD = 0,

    /// <summary>
    /// Gegevens handmatig ingevoerd in Djoppie-Hive.
    /// </summary>
    Handmatig = 1
}
