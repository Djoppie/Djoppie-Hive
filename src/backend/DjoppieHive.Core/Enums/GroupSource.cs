namespace DjoppieHive.Core.Enums;

/// <summary>
/// Bron van een groep in het Hybrid Groups systeem.
/// </summary>
public enum GroupSource
{
    /// <summary>
    /// Exchange/Microsoft 365 groep uit Microsoft Graph (read-only).
    /// </summary>
    Exchange = 0,

    /// <summary>
    /// Dynamische groep met filter-gebaseerde leden die automatisch worden berekend.
    /// </summary>
    Dynamic = 1,

    /// <summary>
    /// Lokale groep handmatig beheerd in Hive.
    /// </summary>
    Local = 2
}
