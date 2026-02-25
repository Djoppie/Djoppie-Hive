using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Representeert een audit log entry voor GDPR compliance en traceerbaarheid.
/// Houdt alle belangrijke acties bij die worden uitgevoerd in het systeem.
/// </summary>
public class AuditLog
{
    /// <summary>
    /// Unieke identifier voor deze audit log entry.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Entra Object ID van de gebruiker die de actie uitvoerde.
    /// Null voor systeemacties.
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// E-mailadres van de gebruiker die de actie uitvoerde.
    /// </summary>
    public string? UserEmail { get; set; }

    /// <summary>
    /// Weergavenaam van de gebruiker.
    /// </summary>
    public string? UserDisplayName { get; set; }

    /// <summary>
    /// Type actie dat werd uitgevoerd.
    /// </summary>
    public AuditAction Action { get; set; }

    /// <summary>
    /// Type entiteit waarop de actie werd uitgevoerd.
    /// </summary>
    public AuditEntityType EntityType { get; set; }

    /// <summary>
    /// ID van de specifieke entiteit (indien van toepassing).
    /// </summary>
    public Guid? EntityId { get; set; }

    /// <summary>
    /// Leesbare naam/beschrijving van de entiteit.
    /// </summary>
    public string? EntityDescription { get; set; }

    /// <summary>
    /// Vorige waarden van gewijzigde eigenschappen (JSON).
    /// Alleen bij Update en Delete acties.
    /// </summary>
    public string? OldValues { get; set; }

    /// <summary>
    /// Nieuwe waarden van gewijzigde eigenschappen (JSON).
    /// Alleen bij Create en Update acties.
    /// </summary>
    public string? NewValues { get; set; }

    /// <summary>
    /// Tijdstip waarop de actie plaatsvond (UTC).
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// IP-adres van de client.
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User-Agent header van de client.
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Optionele aanvullende details of context.
    /// </summary>
    public string? AdditionalInfo { get; set; }

    /// <summary>
    /// Correlatie ID voor het groeperen van gerelateerde acties.
    /// </summary>
    public string? CorrelationId { get; set; }
}
