namespace DjoppieHive.Core.Entities;

/// <summary>
/// Koppeltabel voor deelnemers aan een evenement.
/// </summary>
public class EventParticipant
{
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;

    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    // Tracking
    public DateTime ToegevoegdOp { get; set; } = DateTime.UtcNow;
    public bool EmailVerstuurd { get; set; }
    public DateTime? EmailVerstuurdOp { get; set; }
}
