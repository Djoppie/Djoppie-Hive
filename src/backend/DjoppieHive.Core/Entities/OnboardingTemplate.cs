using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Template for creating onboarding/offboarding processes with predefined tasks.
/// Can be associated with specific employee types, departments, or services.
/// </summary>
public class OnboardingTemplate
{
    public Guid Id { get; set; }

    /// <summary>
    /// Name of the template.
    /// </summary>
    public string Naam { get; set; } = string.Empty;

    /// <summary>
    /// Type of process this template is for.
    /// </summary>
    public OnboardingProcessType ProcessType { get; set; }

    /// <summary>
    /// Description of when to use this template.
    /// </summary>
    public string? Beschrijving { get; set; }

    /// <summary>
    /// Optionally restrict this template to a specific employee type.
    /// </summary>
    public EmployeeType? VoorEmployeeType { get; set; }

    /// <summary>
    /// Optionally restrict this template to a specific department name.
    /// </summary>
    public string? VoorDepartment { get; set; }

    /// <summary>
    /// Optionally restrict this template to a specific dienst (service).
    /// </summary>
    public Guid? VoorDienstId { get; set; }

    /// <summary>
    /// Optionally restrict this template to a specific sector.
    /// </summary>
    public Guid? VoorSectorId { get; set; }

    /// <summary>
    /// JSON array defining the tasks to create from this template.
    /// Structure: [{ titel, taskType, beschrijving, volgorde, isVerplicht, verwachteDuurDagen, afhankelijkVan }]
    /// </summary>
    public string TaskenDefinitie { get; set; } = "[]";

    /// <summary>
    /// Default duration in days for processes created from this template.
    /// </summary>
    public int StandaardDuurDagen { get; set; } = 14;

    /// <summary>
    /// Whether this template is active and can be used.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether this is the default template for its process type.
    /// Only one template per ProcessType can be default.
    /// </summary>
    public bool IsDefault { get; set; } = false;

    /// <summary>
    /// Version number for tracking template changes.
    /// </summary>
    public int Versie { get; set; } = 1;

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties

    /// <summary>
    /// The dienst (service) this template is restricted to (if any).
    /// </summary>
    public DistributionGroup? VoorDienst { get; set; }

    /// <summary>
    /// Processes created from this template.
    /// </summary>
    public ICollection<OnboardingProcess> Processes { get; set; } = [];
}
