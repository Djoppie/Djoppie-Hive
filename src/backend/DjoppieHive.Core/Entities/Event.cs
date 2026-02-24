using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Representeert een evenement/uitnodiging voor personeelscommunicatie.
/// </summary>
public class Event
{
    public Guid Id { get; set; }
    public string Titel { get; set; } = string.Empty;
    public string Beschrijving { get; set; } = string.Empty;
    public DateTime Datum { get; set; }
    public EventType Type { get; set; } = EventType.Overig;
    public EventStatus Status { get; set; } = EventStatus.Concept;

    // Filter criteria voor ontvangers (opgeslagen als JSON)
    public string? FilterCriteria { get; set; }

    // Optionele distributiegroep als bron voor ontvangers
    public Guid? DistributieGroepId { get; set; }
    public DistributionGroup? DistributieGroep { get; set; }

    // Audit velden
    public string? AangemaaktDoor { get; set; }
    public DateTime AangemaaktOp { get; set; } = DateTime.UtcNow;
    public DateTime? VerstuurdOp { get; set; }
    public string? VerstuurdDoor { get; set; }
    public DateTime? GeannuleerdOp { get; set; }

    // Navigatie
    public ICollection<EventParticipant> Deelnemers { get; set; } = [];
}
