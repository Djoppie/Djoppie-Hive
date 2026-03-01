namespace DjoppieHive.Core.Enums;

/// <summary>
/// Types van audit acties die worden gelogd.
/// </summary>
public enum AuditAction
{
    /// <summary>
    /// Nieuw record aangemaakt.
    /// </summary>
    Create,

    /// <summary>
    /// Bestaand record bijgewerkt.
    /// </summary>
    Update,

    /// <summary>
    /// Record verwijderd.
    /// </summary>
    Delete,

    /// <summary>
    /// Record bekeken/opgevraagd.
    /// </summary>
    View,

    /// <summary>
    /// Gebruiker ingelogd.
    /// </summary>
    Login,

    /// <summary>
    /// Gebruiker uitgelogd.
    /// </summary>
    Logout,

    /// <summary>
    /// Data geëxporteerd (GDPR).
    /// </summary>
    Export,

    /// <summary>
    /// Synchronisatie gestart/voltooid.
    /// </summary>
    Sync,

    /// <summary>
    /// Email of uitnodiging verstuurd.
    /// </summary>
    Send,

    /// <summary>
    /// Toegang geweigerd.
    /// </summary>
    AccessDenied
}

/// <summary>
/// Types van entiteiten die geaudit kunnen worden.
/// </summary>
public enum AuditEntityType
{
    Employee,
    DistributionGroup,
    EmployeeGroupMembership,
    UserRole,
    Event,
    EventParticipant,
    ValidatieVerzoek,
    SyncLogboek,
    System,
    OnboardingProcess,
    OnboardingTask,
    OnboardingTemplate
}
