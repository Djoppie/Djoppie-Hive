using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service voor het beheren van JobTitle-Role mappings en automatische roltoewijzing.
/// </summary>
public interface IJobTitleRoleMappingService
{
    // CRUD operaties voor mappings
    Task<IEnumerable<JobTitleRoleMappingDto>> GetAllMappingsAsync(CancellationToken cancellationToken = default);
    Task<JobTitleRoleMappingDto?> GetMappingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<JobTitleRoleMappingDto> CreateMappingAsync(CreateJobTitleRoleMappingDto dto, string createdBy, CancellationToken cancellationToken = default);
    Task<JobTitleRoleMappingDto?> UpdateMappingAsync(Guid id, UpdateJobTitleRoleMappingDto dto, string updatedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteMappingAsync(Guid id, CancellationToken cancellationToken = default);

    // Automatische roltoewijzing

    /// <summary>
    /// Voert automatische roltoewijzing uit voor één medewerker op basis van JobTitle.
    /// </summary>
    Task<AutoRoleAssignmentResultDto> AssignRoleForEmployeeAsync(
        Guid employeeId,
        string assignedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Voert automatische roltoewijzing uit voor alle medewerkers met een JobTitle.
    /// </summary>
    Task<AutoRoleAssignmentSummaryDto> AssignRolesForAllEmployeesAsync(
        string assignedBy,
        bool onlyNewEmployees = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Preview welke rollen zouden worden toegekend zonder daadwerkelijk toe te wijzen.
    /// </summary>
    Task<AutoRoleAssignmentSummaryDto> PreviewAutoAssignmentAsync(
        bool onlyNewEmployees = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Bepaalt welke mapping van toepassing is voor een gegeven JobTitle.
    /// </summary>
    Task<JobTitleRoleMappingDto?> FindMatchingMappingAsync(
        string jobTitle,
        CancellationToken cancellationToken = default);
}
