namespace DjoppieHive.Core.DTOs;

/// <summary>
/// Dashboard statistieken DTO.
/// </summary>
public class DashboardStatisticsDto
{
    // Totalen
    public int TotaalMedewerkers { get; set; }
    public int ActiefPersoneel { get; set; }
    public int InactiefPersoneel { get; set; }
    public int Vrijwilligers { get; set; }
    public int Interimmers { get; set; }
    public int Externen { get; set; }
    public int Stagiairs { get; set; }

    // Data bronnen
    public int VanuitAzure { get; set; }
    public int HandmatigToegevoegd { get; set; }

    // Arbeidsregime
    public int Voltijds { get; set; }
    public int Deeltijds { get; set; }
    public int VrijwilligersRegime { get; set; }

    // Validatie
    public int OpenValidaties { get; set; }

    // Sync info
    public DateTime? LaatseSyncOp { get; set; }
    public string? LaatseSyncStatus { get; set; }
    public int TotaalSyncs { get; set; }

    // Distributiegroepen
    public int TotaalGroepen { get; set; }
    public int TotaalSectoren { get; set; }
    public int TotaalDiensten { get; set; }

    // Per sector breakdown
    public List<SectorStatistiekDto> PerSector { get; set; } = new();

    // Vrijwilliger VOG status
    public VogStatistiekenDto VogStatistieken { get; set; } = new();
}

/// <summary>
/// Statistieken per sector.
/// </summary>
public class SectorStatistiekDto
{
    public string SectorNaam { get; set; } = string.Empty;
    public int AantalMedewerkers { get; set; }
    public int AantalDiensten { get; set; }
}

/// <summary>
/// VOG (Verklaring Omtrent Gedrag) statistieken voor vrijwilligers.
/// </summary>
public class VogStatistiekenDto
{
    public int TotaalVrijwilligers { get; set; }
    public int MetGeldigeVog { get; set; }
    public int VogVerlooptBinnenkort { get; set; } // Binnen 3 maanden
    public int VogVerlopen { get; set; }
    public int ZonderVog { get; set; }
}
