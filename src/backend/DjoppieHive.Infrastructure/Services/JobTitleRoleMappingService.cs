using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service voor het beheren van JobTitle-Role mappings en automatische roltoewijzing.
/// </summary>
public class JobTitleRoleMappingService : IJobTitleRoleMappingService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserRoleService _userRoleService;
    private readonly ILogger<JobTitleRoleMappingService> _logger;

    // Rol display namen mapping
    private static readonly Dictionary<string, string> RoleDisplayNames = new()
    {
        ["ict_super_admin"] = "ICT Super Admin",
        ["hr_admin"] = "HR Admin",
        ["sectormanager"] = "Sectormanager",
        ["diensthoofd"] = "Diensthoofd/Teamcoach",
        ["medewerker"] = "Medewerker"
    };

    // Scope determination display namen
    private static readonly Dictionary<ScopeDeterminationType, string> ScopeDeterminationDisplayNames = new()
    {
        [ScopeDeterminationType.None] = "Geen scope (globaal)",
        [ScopeDeterminationType.FromSectorMembership] = "Automatisch vanuit sector-lidmaatschap",
        [ScopeDeterminationType.FromDienstMembership] = "Automatisch vanuit dienst-lidmaatschap",
        [ScopeDeterminationType.FromPrimaryDienst] = "Automatisch vanuit primaire dienst"
    };

    public JobTitleRoleMappingService(
        ApplicationDbContext context,
        IUserRoleService userRoleService,
        ILogger<JobTitleRoleMappingService> logger)
    {
        _context = context;
        _userRoleService = userRoleService;
        _logger = logger;
    }

    #region CRUD Operations

    public async Task<IEnumerable<JobTitleRoleMappingDto>> GetAllMappingsAsync(CancellationToken cancellationToken = default)
    {
        var mappings = await _context.JobTitleRoleMappings
            .OrderByDescending(m => m.Priority)
            .ThenBy(m => m.JobTitlePattern)
            .ToListAsync(cancellationToken);

        return mappings.Select(MapToDto);
    }

    public async Task<JobTitleRoleMappingDto?> GetMappingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var mapping = await _context.JobTitleRoleMappings
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        return mapping == null ? null : MapToDto(mapping);
    }

    public async Task<JobTitleRoleMappingDto> CreateMappingAsync(
        CreateJobTitleRoleMappingDto dto,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        // Valideer rol
        var normalizedRole = dto.Role.ToLowerInvariant();
        if (!RoleDisplayNames.ContainsKey(normalizedRole))
        {
            throw new InvalidOperationException($"Ongeldige rol: {dto.Role}");
        }

        var mapping = new JobTitleRoleMapping
        {
            Id = Guid.NewGuid(),
            JobTitlePattern = dto.JobTitlePattern.Trim(),
            ExactMatch = dto.ExactMatch,
            Role = normalizedRole,
            ScopeDetermination = dto.ScopeDetermination,
            Priority = dto.Priority,
            Description = dto.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.JobTitleRoleMappings.Add(mapping);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "JobTitle mapping aangemaakt: '{Pattern}' -> {Role} door {CreatedBy}",
            mapping.JobTitlePattern, mapping.Role, createdBy);

        return MapToDto(mapping);
    }

    public async Task<JobTitleRoleMappingDto?> UpdateMappingAsync(
        Guid id,
        UpdateJobTitleRoleMappingDto dto,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        var mapping = await _context.JobTitleRoleMappings
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (mapping == null)
        {
            return null;
        }

        if (dto.JobTitlePattern != null)
        {
            mapping.JobTitlePattern = dto.JobTitlePattern.Trim();
        }

        if (dto.ExactMatch.HasValue)
        {
            mapping.ExactMatch = dto.ExactMatch.Value;
        }

        if (dto.Role != null)
        {
            var normalizedRole = dto.Role.ToLowerInvariant();
            if (!RoleDisplayNames.ContainsKey(normalizedRole))
            {
                throw new InvalidOperationException($"Ongeldige rol: {dto.Role}");
            }
            mapping.Role = normalizedRole;
        }

        if (dto.ScopeDetermination.HasValue)
        {
            mapping.ScopeDetermination = dto.ScopeDetermination.Value;
        }

        if (dto.Priority.HasValue)
        {
            mapping.Priority = dto.Priority.Value;
        }

        if (dto.IsActive.HasValue)
        {
            mapping.IsActive = dto.IsActive.Value;
        }

        if (dto.Description != null)
        {
            mapping.Description = dto.Description;
        }

        mapping.UpdatedAt = DateTime.UtcNow;
        mapping.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "JobTitle mapping bijgewerkt: {MappingId} door {UpdatedBy}",
            id, updatedBy);

        return MapToDto(mapping);
    }

    public async Task<bool> DeleteMappingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var mapping = await _context.JobTitleRoleMappings
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (mapping == null)
        {
            return false;
        }

        _context.JobTitleRoleMappings.Remove(mapping);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "JobTitle mapping verwijderd: '{Pattern}' -> {Role}",
            mapping.JobTitlePattern, mapping.Role);

        return true;
    }

    #endregion

    #region Auto-Assignment

    public async Task<JobTitleRoleMappingDto?> FindMatchingMappingAsync(
        string jobTitle,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jobTitle))
        {
            return null;
        }

        var normalizedJobTitle = jobTitle.ToLowerInvariant().Trim();

        // Haal alle actieve mappings op, gesorteerd op prioriteit (hoogste eerst)
        var mappings = await _context.JobTitleRoleMappings
            .Where(m => m.IsActive)
            .OrderByDescending(m => m.Priority)
            .ToListAsync(cancellationToken);

        foreach (var mapping in mappings)
        {
            var pattern = mapping.JobTitlePattern.ToLowerInvariant().Trim();

            if (mapping.ExactMatch)
            {
                // Exacte match (case-insensitive)
                if (normalizedJobTitle.Equals(pattern, StringComparison.OrdinalIgnoreCase))
                {
                    return MapToDto(mapping);
                }
            }
            else
            {
                // Contains match (case-insensitive)
                if (normalizedJobTitle.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                {
                    return MapToDto(mapping);
                }
            }
        }

        return null;
    }

    public async Task<AutoRoleAssignmentResultDto> AssignRoleForEmployeeAsync(
        Guid employeeId,
        string assignedBy,
        CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees
            .Include(e => e.Dienst)
            .ThenInclude(d => d!.BovenliggendeGroep) // Sector (parent van dienst)
            .Include(e => e.GroupMemberships)
            .ThenInclude(gm => gm.DistributionGroup)
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);

        if (employee == null)
        {
            return new AutoRoleAssignmentResultDto(
                employeeId.ToString(),
                "Onbekend",
                "Onbekend",
                null,
                false,
                null, null, null, null, null,
                "Medewerker niet gevonden");
        }

        return await ProcessEmployeeRoleAssignment(employee, assignedBy, false, cancellationToken);
    }

    public async Task<AutoRoleAssignmentSummaryDto> AssignRolesForAllEmployeesAsync(
        string assignedBy,
        bool onlyNewEmployees = false,
        CancellationToken cancellationToken = default)
    {
        return await ProcessBulkAssignment(assignedBy, onlyNewEmployees, isPreview: false, cancellationToken);
    }

    public async Task<AutoRoleAssignmentSummaryDto> PreviewAutoAssignmentAsync(
        bool onlyNewEmployees = false,
        CancellationToken cancellationToken = default)
    {
        return await ProcessBulkAssignment("preview", onlyNewEmployees, isPreview: true, cancellationToken);
    }

    #endregion

    #region Private Methods

    private async Task<AutoRoleAssignmentSummaryDto> ProcessBulkAssignment(
        string assignedBy,
        bool onlyNewEmployees,
        bool isPreview,
        CancellationToken cancellationToken)
    {
        var results = new List<AutoRoleAssignmentResultDto>();
        var query = _context.Employees
            .Include(e => e.Dienst)
            .ThenInclude(d => d!.BovenliggendeGroep)
            .Include(e => e.GroupMemberships)
            .ThenInclude(gm => gm.DistributionGroup)
            .Where(e => e.IsActive && e.JobTitle != null && e.JobTitle != "");

        // Als we alleen nieuwe medewerkers willen, filter op die zonder rollen
        if (onlyNewEmployees)
        {
            var employeesWithRoles = await _context.UserRoles
                .Where(r => r.IsActive)
                .Select(r => r.EntraObjectId)
                .Distinct()
                .ToListAsync(cancellationToken);

            query = query.Where(e => !employeesWithRoles.Contains(e.EntraObjectId));
        }

        var employees = await query.ToListAsync(cancellationToken);

        int rolesAssigned = 0;
        int rolesSkipped = 0;
        int errors = 0;

        foreach (var employee in employees)
        {
            try
            {
                var result = await ProcessEmployeeRoleAssignment(employee, assignedBy, isPreview, cancellationToken);
                results.Add(result);

                if (result.RoleAssigned)
                {
                    rolesAssigned++;
                }
                else
                {
                    rolesSkipped++;
                }
            }
            catch (Exception ex)
            {
                errors++;
                _logger.LogError(ex, "Fout bij verwerken van medewerker {EmployeeId}", employee.Id);
                results.Add(new AutoRoleAssignmentResultDto(
                    employee.Id.ToString(),
                    employee.DisplayName,
                    employee.Email,
                    employee.JobTitle,
                    false,
                    null, null, null, null, null,
                    $"Fout: {ex.Message}"));
            }
        }

        return new AutoRoleAssignmentSummaryDto(
            employees.Count,
            rolesAssigned,
            rolesSkipped,
            errors,
            DateTime.UtcNow,
            assignedBy,
            results);
    }

    private async Task<AutoRoleAssignmentResultDto> ProcessEmployeeRoleAssignment(
        Employee employee,
        string assignedBy,
        bool isPreview,
        CancellationToken cancellationToken)
    {
        // Check of medewerker een JobTitle heeft
        if (string.IsNullOrWhiteSpace(employee.JobTitle))
        {
            return new AutoRoleAssignmentResultDto(
                employee.Id.ToString(),
                employee.DisplayName,
                employee.Email,
                employee.JobTitle,
                false,
                null, null, null, null, null,
                "Geen functietitel beschikbaar");
        }

        // Zoek matching mapping
        var mapping = await FindMatchingMappingAsync(employee.JobTitle, cancellationToken);

        if (mapping == null)
        {
            return new AutoRoleAssignmentResultDto(
                employee.Id.ToString(),
                employee.DisplayName,
                employee.Email,
                employee.JobTitle,
                false,
                null, null, null, null, null,
                "Geen matching mapping gevonden");
        }

        // Bepaal scope (Sector/Dienst ID)
        var (scopeType, scopeId, scopeName) = DetermineScope(employee, Enum.Parse<ScopeDeterminationType>(mapping.ScopeDetermination.ToString()));

        // Check of gebruiker deze rol al heeft
        var existingRole = await _context.UserRoles
            .FirstOrDefaultAsync(r =>
                r.EntraObjectId == employee.EntraObjectId &&
                r.Role == mapping.Role &&
                r.IsActive,
                cancellationToken);

        if (existingRole != null)
        {
            return new AutoRoleAssignmentResultDto(
                employee.Id.ToString(),
                employee.DisplayName,
                employee.Email,
                employee.JobTitle,
                false,
                mapping.Role,
                mapping.RoleDisplayName,
                scopeType,
                scopeId,
                scopeName,
                "Rol is al toegekend");
        }

        // Bij preview: alleen simuleren
        if (isPreview)
        {
            return new AutoRoleAssignmentResultDto(
                employee.Id.ToString(),
                employee.DisplayName,
                employee.Email,
                employee.JobTitle,
                true,
                mapping.Role,
                mapping.RoleDisplayName,
                scopeType,
                scopeId,
                scopeName,
                "Zou worden toegekend (preview)");
        }

        // Rol daadwerkelijk toekennen via UserRoleService
        try
        {
            var createDto = new CreateUserRoleDto(
                employee.EntraObjectId,
                employee.Email,
                employee.DisplayName,
                mapping.Role,
                scopeType == "sector" ? Guid.Parse(scopeId!) : null,
                scopeType == "dienst" ? Guid.Parse(scopeId!) : null);

            await _userRoleService.CreateAsync(createDto, assignedBy, cancellationToken);

            _logger.LogInformation(
                "Automatische roltoewijzing: {Role} aan {Email} (JobTitle: {JobTitle})",
                mapping.Role, employee.Email, employee.JobTitle);

            return new AutoRoleAssignmentResultDto(
                employee.Id.ToString(),
                employee.DisplayName,
                employee.Email,
                employee.JobTitle,
                true,
                mapping.Role,
                mapping.RoleDisplayName,
                scopeType,
                scopeId,
                scopeName,
                "Rol succesvol toegekend");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fout bij toekennen rol aan {Email}", employee.Email);
            return new AutoRoleAssignmentResultDto(
                employee.Id.ToString(),
                employee.DisplayName,
                employee.Email,
                employee.JobTitle,
                false,
                mapping.Role,
                mapping.RoleDisplayName,
                scopeType,
                scopeId,
                scopeName,
                $"Fout bij toekennen: {ex.Message}");
        }
    }

    private (string? scopeType, string? scopeId, string? scopeName) DetermineScope(
        Employee employee,
        ScopeDeterminationType scopeDetermination)
    {
        switch (scopeDetermination)
        {
            case ScopeDeterminationType.None:
                return (null, null, null);

            case ScopeDeterminationType.FromPrimaryDienst:
                if (employee.DienstId.HasValue && employee.Dienst != null)
                {
                    return ("dienst", employee.DienstId.Value.ToString(), employee.Dienst.DisplayName);
                }
                return (null, null, "Geen primaire dienst gevonden");

            case ScopeDeterminationType.FromSectorMembership:
                // Zoek naar MG-SECTOR-* groep in lidmaatschappen
                var sectorGroup = employee.GroupMemberships
                    .Select(gm => gm.DistributionGroup)
                    .FirstOrDefault(g => g != null && g.DisplayName.StartsWith("MG-SECTOR-", StringComparison.OrdinalIgnoreCase));

                if (sectorGroup != null)
                {
                    return ("sector", sectorGroup.Id.ToString(), sectorGroup.DisplayName);
                }

                // Fallback: kijk naar parent van primaire dienst
                if (employee.Dienst?.BovenliggendeGroep != null)
                {
                    return ("sector", employee.Dienst.BovenliggendeGroep.Id.ToString(), employee.Dienst.BovenliggendeGroep.DisplayName);
                }
                return (null, null, "Geen sector gevonden");

            case ScopeDeterminationType.FromDienstMembership:
                // Zoek naar niet-sector MG- groep in lidmaatschappen
                var dienstGroup = employee.GroupMemberships
                    .Select(gm => gm.DistributionGroup)
                    .FirstOrDefault(g => g != null &&
                        g.DisplayName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase) &&
                        !g.DisplayName.StartsWith("MG-SECTOR-", StringComparison.OrdinalIgnoreCase) &&
                        !g.DisplayName.Equals("MG-iedereenpersoneel", StringComparison.OrdinalIgnoreCase));

                if (dienstGroup != null)
                {
                    return ("dienst", dienstGroup.Id.ToString(), dienstGroup.DisplayName);
                }

                // Fallback: primaire dienst
                if (employee.DienstId.HasValue && employee.Dienst != null)
                {
                    return ("dienst", employee.DienstId.Value.ToString(), employee.Dienst.DisplayName);
                }
                return (null, null, "Geen dienst gevonden");

            default:
                return (null, null, null);
        }
    }

    private JobTitleRoleMappingDto MapToDto(JobTitleRoleMapping mapping)
    {
        return new JobTitleRoleMappingDto(
            mapping.Id.ToString(),
            mapping.JobTitlePattern,
            mapping.ExactMatch,
            mapping.Role,
            RoleDisplayNames.GetValueOrDefault(mapping.Role, mapping.Role),
            mapping.ScopeDetermination,
            ScopeDeterminationDisplayNames.GetValueOrDefault(mapping.ScopeDetermination, mapping.ScopeDetermination.ToString()),
            mapping.Priority,
            mapping.IsActive,
            mapping.Description,
            mapping.CreatedAt,
            mapping.CreatedBy,
            mapping.UpdatedAt,
            mapping.UpdatedBy);
    }

    #endregion
}
