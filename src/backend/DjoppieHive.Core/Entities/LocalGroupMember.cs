namespace DjoppieHive.Core.Entities;

/// <summary>
/// Join-entiteit voor LocalGroup en Employee.
/// Koppelt medewerkers aan lokale groepen.
/// </summary>
public class LocalGroupMember
{
    /// <summary>
    /// ID van de lokale groep.
    /// </summary>
    public Guid LocalGroupId { get; set; }

    /// <summary>
    /// Navigatie property naar de lokale groep.
    /// </summary>
    public LocalGroup LocalGroup { get; set; } = null!;

    /// <summary>
    /// ID van de medewerker.
    /// </summary>
    public Guid EmployeeId { get; set; }

    /// <summary>
    /// Navigatie property naar de medewerker.
    /// </summary>
    public Employee Employee { get; set; } = null!;

    /// <summary>
    /// Datum/tijd wanneer het lid is toegevoegd aan de groep.
    /// </summary>
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gebruiker die het lid heeft toegevoegd.
    /// </summary>
    public string? AddedBy { get; set; }
}
