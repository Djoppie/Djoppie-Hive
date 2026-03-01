using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.DTOs;

#region Process DTOs

/// <summary>
/// Full DTO for an onboarding/offboarding process.
/// </summary>
public record OnboardingProcessDto(
    Guid Id,
    OnboardingProcessType Type,
    OnboardingProcessStatus Status,
    Guid EmployeeId,
    string EmployeeNaam,
    string? EmployeeEmail,
    string Titel,
    string? Beschrijving,
    DateTime GeplandeStartdatum,
    DateTime GewensteEinddatum,
    DateTime? DatumVoltooid,
    DateTime? DatumGeannuleerd,
    Guid? VerantwoordelijkeId,
    string? VerantwoordelijkeEmail,
    string? VerantwoordelijkeNaam,
    int VoortgangPercentage,
    int AantalVoltooideTaken,
    int TotaalAantalTaken,
    Guid? TemplateId,
    string? TemplateNaam,
    int Prioriteit,
    bool IsActive,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime? UpdatedAt,
    string? UpdatedBy,
    List<OnboardingTaskDto>? Tasks = null
);

/// <summary>
/// Summary DTO for process lists.
/// </summary>
public record OnboardingProcessSummaryDto(
    Guid Id,
    OnboardingProcessType Type,
    OnboardingProcessStatus Status,
    Guid EmployeeId,
    string EmployeeNaam,
    string Titel,
    DateTime GeplandeStartdatum,
    DateTime GewensteEinddatum,
    int VoortgangPercentage,
    int AantalVoltooideTaken,
    int TotaalAantalTaken,
    int Prioriteit,
    string? VerantwoordelijkeNaam
);

/// <summary>
/// DTO for creating a new onboarding process.
/// </summary>
public record CreateOnboardingProcessDto(
    OnboardingProcessType Type,
    Guid EmployeeId,
    string Titel,
    string? Beschrijving,
    DateTime GeplandeStartdatum,
    DateTime GewensteEinddatum,
    Guid? VerantwoordelijkeId,
    string? VerantwoordelijkeEmail,
    string? VerantwoordelijkeNaam,
    int Prioriteit = 3
);

/// <summary>
/// DTO for updating an existing process.
/// </summary>
public record UpdateOnboardingProcessDto(
    string? Titel,
    string? Beschrijving,
    DateTime? GeplandeStartdatum,
    DateTime? GewensteEinddatum,
    Guid? VerantwoordelijkeId,
    string? VerantwoordelijkeEmail,
    string? VerantwoordelijkeNaam,
    int? Prioriteit
);

/// <summary>
/// Filter options for querying processes.
/// </summary>
public record OnboardingProcessFilter(
    OnboardingProcessType? Type = null,
    OnboardingProcessStatus? Status = null,
    Guid? EmployeeId = null,
    Guid? VerantwoordelijkeId = null,
    DateTime? StartDatumVan = null,
    DateTime? StartDatumTot = null,
    bool? IsActive = true,
    string? SearchQuery = null
);

/// <summary>
/// DTO for changing process status.
/// </summary>
public record ChangeProcessStatusDto(
    OnboardingProcessStatus NieuweStatus,
    string? Opmerking = null
);

/// <summary>
/// DTO for creating a process from a template.
/// </summary>
public record CreateProcessFromTemplateDto(
    Guid TemplateId,
    Guid EmployeeId,
    DateTime GeplandeStartdatum,
    Guid? VerantwoordelijkeId = null,
    string? VerantwoordelijkeEmail = null,
    string? VerantwoordelijkeNaam = null,
    int? Prioriteit = null
);

#endregion

#region Task DTOs

/// <summary>
/// Full DTO for an onboarding task.
/// </summary>
public record OnboardingTaskDto(
    Guid Id,
    Guid OnboardingProcessId,
    OnboardingTaskType TaskType,
    string Titel,
    string? Beschrijving,
    OnboardingTaskStatus Status,
    int Volgorde,
    bool IsVerplicht,
    int VerwachteDuurDagen,
    DateTime? Deadline,
    Guid? ToegewezenAanId,
    string? ToegewezenAanEmail,
    string? ToegewezenAanNaam,
    OnboardingAfdeling? ToegewezenAanAfdeling,
    DateTime? GestartOp,
    DateTime? VoltooidOp,
    string? VoltooidDoor,
    string? VoltooiingNotities,
    Guid? AfhankelijkVanTaakId,
    string? AfhankelijkVanTaakTitel,
    string? Metadata,
    bool IsActive,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime? UpdatedAt,
    string? UpdatedBy,
    bool KanGestart = true
);

/// <summary>
/// Summary DTO for task lists.
/// </summary>
public record OnboardingTaskSummaryDto(
    Guid Id,
    Guid OnboardingProcessId,
    OnboardingTaskType TaskType,
    string Titel,
    OnboardingTaskStatus Status,
    int Volgorde,
    bool IsVerplicht,
    DateTime? Deadline,
    string? ToegewezenAanNaam,
    OnboardingAfdeling? ToegewezenAanAfdeling,
    bool KanGestart
);

/// <summary>
/// DTO for creating a new task.
/// </summary>
public record CreateOnboardingTaskDto(
    Guid OnboardingProcessId,
    OnboardingTaskType TaskType,
    string Titel,
    string? Beschrijving,
    int Volgorde,
    bool IsVerplicht = true,
    int VerwachteDuurDagen = 1,
    DateTime? Deadline = null,
    Guid? ToegewezenAanId = null,
    string? ToegewezenAanEmail = null,
    string? ToegewezenAanNaam = null,
    OnboardingAfdeling? ToegewezenAanAfdeling = null,
    Guid? AfhankelijkVanTaakId = null,
    string? Metadata = null
);

/// <summary>
/// DTO for updating an existing task.
/// </summary>
public record UpdateOnboardingTaskDto(
    string? Titel,
    string? Beschrijving,
    int? Volgorde,
    bool? IsVerplicht,
    int? VerwachteDuurDagen,
    DateTime? Deadline,
    Guid? ToegewezenAanId,
    string? ToegewezenAanEmail,
    string? ToegewezenAanNaam,
    OnboardingAfdeling? ToegewezenAanAfdeling,
    Guid? AfhankelijkVanTaakId,
    string? Metadata
);

/// <summary>
/// DTO for changing task status.
/// </summary>
public record ChangeTaskStatusDto(
    OnboardingTaskStatus NieuweStatus,
    string? VoltooiingNotities = null
);

/// <summary>
/// DTO for assigning a task to someone.
/// </summary>
public record AssignTaskDto(
    string Email,
    string? Naam = null,
    Guid? Id = null
);

#endregion

#region Template DTOs

/// <summary>
/// Full DTO for an onboarding template.
/// </summary>
public record OnboardingTemplateDto(
    Guid Id,
    string Naam,
    OnboardingProcessType ProcessType,
    string? Beschrijving,
    EmployeeType? VoorEmployeeType,
    string? VoorDepartment,
    Guid? VoorDienstId,
    string? VoorDienstNaam,
    Guid? VoorSectorId,
    string? VoorSectorNaam,
    List<TemplateTaskDefinitionDto> Taken,
    int StandaardDuurDagen,
    bool IsActive,
    bool IsDefault,
    int Versie,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime? UpdatedAt,
    string? UpdatedBy
);

/// <summary>
/// DTO for creating a new template.
/// </summary>
public record CreateOnboardingTemplateDto(
    string Naam,
    OnboardingProcessType ProcessType,
    string? Beschrijving,
    EmployeeType? VoorEmployeeType,
    string? VoorDepartment,
    Guid? VoorDienstId,
    Guid? VoorSectorId,
    List<TemplateTaskDefinitionDto> Taken,
    int StandaardDuurDagen = 14,
    bool IsDefault = false
);

/// <summary>
/// DTO for updating an existing template.
/// </summary>
public record UpdateOnboardingTemplateDto(
    string? Naam,
    string? Beschrijving,
    EmployeeType? VoorEmployeeType,
    string? VoorDepartment,
    Guid? VoorDienstId,
    Guid? VoorSectorId,
    List<TemplateTaskDefinitionDto>? Taken,
    int? StandaardDuurDagen,
    bool? IsActive,
    bool? IsDefault
);

/// <summary>
/// Definition of a task within a template.
/// </summary>
public record TemplateTaskDefinitionDto(
    string Titel,
    OnboardingTaskType TaskType,
    string? Beschrijving,
    int Volgorde,
    bool IsVerplicht = true,
    int VerwachteDuurDagen = 1,
    int? AfhankelijkVanVolgorde = null,
    OnboardingAfdeling? ToegewezenAanAfdeling = null
);

#endregion

#region Statistics DTOs

/// <summary>
/// Statistics overview for onboarding processes.
/// </summary>
public record OnboardingStatisticsDto(
    int TotaalProcessen,
    int ActieveProcessen,
    int VoltooideProcessen,
    int GeannuleerdeProcessen,
    int OnboardingProcessen,
    int OffboardingProcessen,
    int TotaalTaken,
    int VoltooiTaken,
    int OpenTaken,
    int GeblokkeerdeTaken,
    double GemiddeldeVoltooiingsTijd,
    List<ProcessStatusCountDto> StatusVerdeling,
    List<TaskTypeCountDto> TaakTypeVerdeling
);

/// <summary>
/// Count per process status.
/// </summary>
public record ProcessStatusCountDto(
    OnboardingProcessStatus Status,
    int Aantal
);

/// <summary>
/// Count per task type.
/// </summary>
public record TaskTypeCountDto(
    OnboardingTaskType TaskType,
    int Aantal
);

#endregion
