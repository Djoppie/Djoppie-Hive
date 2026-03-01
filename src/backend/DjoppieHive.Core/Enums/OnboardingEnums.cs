namespace DjoppieHive.Core.Enums;

/// <summary>
/// Departments responsible for onboarding tasks.
/// </summary>
public enum OnboardingAfdeling
{
    /// <summary>
    /// Human Resources department - employee data, Syntegro registration.
    /// </summary>
    HR = 0,

    /// <summary>
    /// ICT department - accounts, licenses, hardware.
    /// </summary>
    ICT = 1,

    /// <summary>
    /// Prevention department - badge registration, building access.
    /// </summary>
    Preventie = 2,

    /// <summary>
    /// Management - validation, approvals.
    /// </summary>
    Management = 3,

    /// <summary>
    /// The employee themselves - MFA setup, training.
    /// </summary>
    Medewerker = 4
}

/// <summary>
/// Type of onboarding process: new employee onboarding or employee offboarding.
/// </summary>
public enum OnboardingProcessType
{
    /// <summary>
    /// Onboarding process for new employees joining the organization.
    /// </summary>
    Onboarding = 0,

    /// <summary>
    /// Offboarding process for employees leaving the organization.
    /// </summary>
    Offboarding = 1
}

/// <summary>
/// Status of an onboarding/offboarding process.
/// </summary>
public enum OnboardingProcessStatus
{
    /// <summary>
    /// Process is newly created and not yet started.
    /// </summary>
    Nieuw = 0,

    /// <summary>
    /// Process is actively being worked on.
    /// </summary>
    InProgress = 1,

    /// <summary>
    /// Process has been completed successfully.
    /// </summary>
    Voltooid = 2,

    /// <summary>
    /// Process has been cancelled.
    /// </summary>
    Geannuleerd = 3,

    /// <summary>
    /// Process is temporarily on hold.
    /// </summary>
    OnHold = 4
}

/// <summary>
/// Type of onboarding/offboarding task.
/// </summary>
public enum OnboardingTaskType
{
    /// <summary>
    /// Create user account in Active Directory / Entra ID.
    /// </summary>
    AccountAanmaken = 0,

    /// <summary>
    /// Assign Microsoft 365 license.
    /// </summary>
    M365Licentie = 1,

    /// <summary>
    /// Assign laptop/hardware to employee.
    /// </summary>
    LaptopToewijzen = 2,

    /// <summary>
    /// Configure access rights and permissions.
    /// </summary>
    ToegangsRechten = 3,

    /// <summary>
    /// Provide training or orientation.
    /// </summary>
    Training = 4,

    /// <summary>
    /// Prepare physical workspace.
    /// </summary>
    Werkplek = 5,

    /// <summary>
    /// Knowledge or responsibility transfer (offboarding).
    /// </summary>
    Overdracht = 6,

    /// <summary>
    /// Return equipment and materials (offboarding).
    /// </summary>
    MateriaalInleveren = 7,

    /// <summary>
    /// Deactivate user account (offboarding).
    /// </summary>
    AccountDeactiveren = 8,

    /// <summary>
    /// Conduct exit interview (offboarding).
    /// </summary>
    ExitInterview = 9,

    /// <summary>
    /// General/custom task type.
    /// </summary>
    Algemeen = 10,

    // === New task types for complete workflow ===

    /// <summary>
    /// Create email account (@diepenbeek.be) in Entra ID.
    /// Department: ICT
    /// </summary>
    EmailAccountAanmaken = 11,

    /// <summary>
    /// Generate and communicate initial password.
    /// Department: ICT
    /// </summary>
    WachtwoordGenereren = 12,

    /// <summary>
    /// Configure Multi-Factor Authentication (MFA).
    /// Department: ICT/Medewerker
    /// </summary>
    MfaSetup = 13,

    /// <summary>
    /// Register device as primary user in Intune.
    /// Department: ICT
    /// </summary>
    IntunePrimaryUser = 14,

    /// <summary>
    /// Install required apps via Company Portal.
    /// Department: Medewerker
    /// </summary>
    CompanyPortalApps = 15,

    /// <summary>
    /// Register badge for building access.
    /// Department: Preventie
    /// </summary>
    BadgeRegistratie = 16,

    /// <summary>
    /// Register employee in Syntegro (time tracking & leave).
    /// Department: HR
    /// </summary>
    SyntegroRegistratie = 17,

    /// <summary>
    /// Employee data validation by sector manager or team coach.
    /// Department: Management
    /// </summary>
    DataValidatie = 18,

    /// <summary>
    /// Revoke badge and building access.
    /// Department: Preventie (offboarding)
    /// </summary>
    BadgeIntrekken = 19,

    /// <summary>
    /// Remove employee from Syntegro.
    /// Department: HR (offboarding)
    /// </summary>
    SyntegroVerwijderen = 20
}

/// <summary>
/// Status of an individual onboarding/offboarding task.
/// </summary>
public enum OnboardingTaskStatus
{
    /// <summary>
    /// Task has not been started yet.
    /// </summary>
    NietGestart = 0,

    /// <summary>
    /// Task is currently being worked on.
    /// </summary>
    Bezig = 1,

    /// <summary>
    /// Task has been completed successfully.
    /// </summary>
    Voltooid = 2,

    /// <summary>
    /// Task is blocked by dependencies or other issues.
    /// </summary>
    Geblokkeerd = 3,

    /// <summary>
    /// Task has been skipped (not applicable).
    /// </summary>
    Overgeslagen = 4,

    /// <summary>
    /// Task execution failed.
    /// </summary>
    Mislukt = 5
}
