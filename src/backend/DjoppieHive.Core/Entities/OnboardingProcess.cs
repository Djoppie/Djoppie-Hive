using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Represents an onboarding or offboarding process for an employee.
/// Tracks the overall workflow, status, and progress.
/// </summary>
public class OnboardingProcess
{
    public Guid Id { get; set; }

    /// <summary>
    /// Type of process: Onboarding (new employee) or Offboarding (departing employee).
    /// </summary>
    public OnboardingProcessType Type { get; set; }

    /// <summary>
    /// Current status of the process.
    /// </summary>
    public OnboardingProcessStatus Status { get; set; } = OnboardingProcessStatus.Nieuw;

    /// <summary>
    /// Reference to the employee this process is for.
    /// </summary>
    public Guid EmployeeId { get; set; }

    /// <summary>
    /// Title/name of this onboarding process.
    /// </summary>
    public string Titel { get; set; } = string.Empty;

    /// <summary>
    /// Optional description or notes for this process.
    /// </summary>
    public string? Beschrijving { get; set; }

    /// <summary>
    /// Planned start date of the process (e.g., employee's first day).
    /// </summary>
    public DateTime GeplandeStartdatum { get; set; }

    /// <summary>
    /// Target completion date for the process.
    /// </summary>
    public DateTime GewensteEinddatum { get; set; }

    /// <summary>
    /// Actual completion date (when status becomes Voltooid).
    /// </summary>
    public DateTime? DatumVoltooid { get; set; }

    /// <summary>
    /// Date when the process was cancelled (if applicable).
    /// </summary>
    public DateTime? DatumGeannuleerd { get; set; }

    /// <summary>
    /// ID of the person responsible for this process.
    /// </summary>
    public Guid? VerantwoordelijkeId { get; set; }

    /// <summary>
    /// Email of the responsible person.
    /// </summary>
    public string? VerantwoordelijkeEmail { get; set; }

    /// <summary>
    /// Display name of the responsible person.
    /// </summary>
    public string? VerantwoordelijkeNaam { get; set; }

    /// <summary>
    /// Progress percentage (0-100), calculated from completed tasks.
    /// </summary>
    public int VoortgangPercentage { get; set; } = 0;

    /// <summary>
    /// Number of completed tasks.
    /// </summary>
    public int AantalVoltooideTaken { get; set; } = 0;

    /// <summary>
    /// Total number of tasks in this process.
    /// </summary>
    public int TotaalAantalTaken { get; set; } = 0;

    /// <summary>
    /// Optional reference to the template used to create this process.
    /// </summary>
    public Guid? TemplateId { get; set; }

    /// <summary>
    /// Priority level (1 = highest, 5 = lowest).
    /// </summary>
    public int Prioriteit { get; set; } = 3;

    /// <summary>
    /// Whether this process is active (soft delete flag).
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties

    /// <summary>
    /// The employee this process is for.
    /// </summary>
    public Employee? Employee { get; set; }

    /// <summary>
    /// The template used to create this process (if any).
    /// </summary>
    public OnboardingTemplate? Template { get; set; }

    /// <summary>
    /// Collection of tasks associated with this process.
    /// </summary>
    public ICollection<OnboardingTask> Tasks { get; set; } = [];
}
