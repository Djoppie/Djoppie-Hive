using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Representeert een validatieverzoek voor teamcoach/sector manager beoordeling.
/// Wordt aangemaakt wanneer sync wijzigingen detecteert die menselijke validatie vereisen.
/// </summary>
public class ValidatieVerzoek
{
    public Guid Id { get; set; }

    /// <summary>
    /// Type gedetecteerde wijziging.
    /// </summary>
    public ValidatieVerzoekType Type { get; set; }

    /// <summary>
    /// Leesbare beschrijving van wat gevalideerd moet worden.
    /// Voorbeeld: "Jan Janssen verwijderd uit MG-Burgerzaken"
    /// </summary>
    public string Beschrijving { get; set; } = string.Empty;

    // Wat gevalideerd moet worden

    /// <summary>
    /// Medewerker betrokken bij de wijziging (indien van toepassing).
    /// </summary>
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    /// <summary>
    /// Distributiegroep betrokken bij de wijziging (indien van toepassing).
    /// </summary>
    public Guid? DistributionGroupId { get; set; }
    public DistributionGroup? DistributionGroup { get; set; }

    /// <summary>
    /// JSON snapshot van de vorige toestand (voor audit trail).
    /// </summary>
    public string? VorigeWaarde { get; set; }

    /// <summary>
    /// JSON snapshot van de nieuwe toestand (indien van toepassing).
    /// </summary>
    public string? NieuweWaarde { get; set; }

    // Toewijzing & workflow

    /// <summary>
    /// Rol verantwoordelijk voor validatie: "teamcoach" of "sectormanager"
    /// </summary>
    public string? ToegwezenAanRol { get; set; }

    /// <summary>
    /// Welke groep's teamcoach/manager dit moet afhandelen.
    /// </summary>
    public Guid? ToegwezenAanGroepId { get; set; }

    /// <summary>
    /// Huidige status van het validatieverzoek.
    /// </summary>
    public ValidatieVerzoekStatus Status { get; set; } = ValidatieVerzoekStatus.InAfwachting;

    // Afhandeling

    /// <summary>
    /// Gebruiker die het verzoek heeft afgehandeld (e-mail of ID).
    /// </summary>
    public string? AfgehandeldDoor { get; set; }

    /// <summary>
    /// Wanneer het verzoek is afgehandeld.
    /// </summary>
    public DateTime? AfgehandeldOp { get; set; }

    /// <summary>
    /// Notities van de afhandelaar met toelichting op de beslissing.
    /// </summary>
    public string? AfhandelingNotities { get; set; }

    /// <summary>
    /// De genomen afhandelingsactie.
    /// </summary>
    public ValidatieAfhandeling? Afhandeling { get; set; }

    // Tijdstempels

    /// <summary>
    /// Wanneer dit validatieverzoek is aangemaakt.
    /// </summary>
    public DateTime AangemaaktOp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// De synchronisatieoperatie die dit verzoek heeft aangemaakt.
    /// </summary>
    public Guid? SyncLogboekId { get; set; }
    public SyncLogboek? SyncLogboek { get; set; }
}
