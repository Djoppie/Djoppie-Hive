namespace DjoppieHive.Core.Enums;

/// <summary>
/// Geeft het hiërarchieniveau van een distributiegroep aan.
/// </summary>
public enum GroepNiveau
{
    /// <summary>
    /// Sector-niveau groep (MG-SECTOR-*). Bovenliggend van dienstgroepen.
    /// Beheerd door Sector Manager.
    /// </summary>
    Sector = 0,

    /// <summary>
    /// Dienst-niveau groep (MG-*). Onderliggend van een sectorgroep.
    /// Beheerd door Teamcoach.
    /// </summary>
    Dienst = 1
}
