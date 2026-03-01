using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Represents an individual task within an onboarding or offboarding process.
/// </summary>
public class OnboardingTask
{
    public Guid Id { get; set; }

    /// <summary>
    /// Reference to the parent onboarding process.
    /// </summary>
    public Guid OnboardingProcessId { get; set; }

    /// <summary>
    /// Type of task (determines default behavior and categorization).
    /// </summary>
    public OnboardingTaskType TaskType { get; set; }

    /// <summary>
    /// Title/name of the task.
    /// </summary>
    public string Titel { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description or instructions for the task.
    /// </summary>
    public string? Beschrijving { get; set; }

    /// <summary>
    /// Current status of the task.
    /// </summary>
    public OnboardingTaskStatus Status { get; set; } = OnboardingTaskStatus.NietGestart;

    /// <summary>
    /// Order/sequence number for task execution (lower = earlier).
    /// </summary>
    public int Volgorde { get; set; } = 0;

    /// <summary>
    /// Whether this task must be completed for the process to finish.
    /// </summary>
    public bool IsVerplicht { get; set; } = true;

    /// <summary>
    /// Expected duration in days to complete this task.
    /// </summary>
    public int VerwachteDuurDagen { get; set; } = 1;

    /// <summary>
    /// Deadline for completing this task (optional).
    /// </summary>
    public DateTime? Deadline { get; set; }

    /// <summary>
    /// ID of the person assigned to complete this task.
    /// </summary>
    public Guid? ToegewezenAanId { get; set; }

    /// <summary>
    /// Email of the assigned person.
    /// </summary>
    public string? ToegewezenAanEmail { get; set; }

    /// <summary>
    /// Display name of the assigned person.
    /// </summary>
    public string? ToegewezenAanNaam { get; set; }

    /// <summary>
    /// Department responsible for this task (HR, ICT, Preventie, Management, Medewerker).
    /// Used for cross-department workflow routing.
    /// </summary>
    public OnboardingAfdeling? ToegewezenAanAfdeling { get; set; }

    /// <summary>
    /// When the task was started.
    /// </summary>
    public DateTime? GestartOp { get; set; }

    /// <summary>
    /// When the task was completed.
    /// </summary>
    public DateTime? VoltooidOp { get; set; }

    /// <summary>
    /// Who completed the task (email or name).
    /// </summary>
    public string? VoltooidDoor { get; set; }

    /// <summary>
    /// Notes or comments upon task completion.
    /// </summary>
    public string? VoltooiingNotities { get; set; }

    /// <summary>
    /// Reference to another task that must be completed first (dependency).
    /// </summary>
    public Guid? AfhankelijkVanTaakId { get; set; }

    /// <summary>
    /// Additional metadata stored as JSON (e.g., form data, configuration).
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// Whether this task is active (soft delete flag).
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties

    /// <summary>
    /// The parent onboarding process.
    /// </summary>
    public OnboardingProcess? OnboardingProcess { get; set; }

    /// <summary>
    /// The task that this task depends on (if any).
    /// </summary>
    public OnboardingTask? AfhankelijkVanTaak { get; set; }

    /// <summary>
    /// Tasks that depend on this task.
    /// </summary>
    public ICollection<OnboardingTask> AfhankelijkeTaken { get; set; } = [];
}
