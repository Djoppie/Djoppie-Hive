using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Database-backed employee service with full CRUD operations.
/// Handles both Azure-synced employees and manually-added employees.
/// </summary>
public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(
        ApplicationDbContext context,
        ILogger<EmployeeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Legacy Graph API Methods (Stub implementations)

    public Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("GetAllEmployeesAsync is deprecated. Use GetAllAsync with filters instead.");
        return GetAllAsync(null, cancellationToken);
    }

    public async Task<EmployeeDto?> GetEmployeeByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("GetEmployeeByIdAsync(string) is deprecated. Use GetByIdAsync(Guid) instead.");

        // Try to find by EntraObjectId
        var employee = await _context.Employees
            .Include(e => e.Dienst)
                .ThenInclude(d => d!.BovenliggendeGroep)
            .Include(e => e.VrijwilligerDetails)
            .Include(e => e.GroupMemberships)
                .ThenInclude(m => m.DistributionGroup)
            .FirstOrDefaultAsync(e => e.EntraObjectId == userId, cancellationToken);

        return employee != null ? MapToDto(employee) : null;
    }

    public async Task<IEnumerable<EmployeeSummaryDto>> SearchEmployeesAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
        {
            return Array.Empty<EmployeeSummaryDto>();
        }

        var lowerQuery = query.ToLower();

        var employees = await _context.Employees
            .Include(e => e.Dienst)
                .ThenInclude(d => d!.BovenliggendeGroep)
            .Where(e => e.IsActive &&
                       (e.DisplayName.ToLower().Contains(lowerQuery) ||
                        e.Email.ToLower().Contains(lowerQuery)))
            .OrderBy(e => e.DisplayName)
            .Take(25)
            .Select(e => new EmployeeSummaryDto(
                e.Id.ToString(),
                e.DisplayName,
                e.Email,
                e.JobTitle,
                e.EmployeeType.ToString(),
                e.ArbeidsRegime.ToString(),
                e.IsActive,
                e.Dienst != null ? e.Dienst.DisplayName : null
            ))
            .ToListAsync(cancellationToken);

        return employees;
    }

    #endregion

    #region CRUD Operations

    public async Task<IEnumerable<EmployeeDto>> GetAllAsync(
        EmployeeFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.Employees
                .Include(e => e.Dienst)
                .ThenInclude(d => d!.BovenliggendeGroep)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .AsQueryable();

            // Apply filters
            if (filter != null)
            {
                if (filter.Type.HasValue)
                {
                    query = query.Where(e => e.EmployeeType == filter.Type.Value);
                }

                if (filter.Regime.HasValue)
                {
                    query = query.Where(e => e.ArbeidsRegime == filter.Regime.Value);
                }

                if (filter.IsActive.HasValue)
                {
                    query = query.Where(e => e.IsActive == filter.IsActive.Value);
                }

                if (filter.DienstId.HasValue)
                {
                    query = query.Where(e => e.DienstId == filter.DienstId.Value);
                }

                if (filter.SectorId.HasValue)
                {
                    // Filter by sector: employees whose dienst belongs to the specified sector
                    query = query.Where(e => e.Dienst != null && e.Dienst.BovenliggendeGroepId == filter.SectorId.Value);
                }

                if (filter.Bron.HasValue)
                {
                    query = query.Where(e => e.Bron == filter.Bron.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                {
                    var searchLower = filter.SearchTerm.ToLower();
                    query = query.Where(e =>
                        e.DisplayName.ToLower().Contains(searchLower) ||
                        e.Email.ToLower().Contains(searchLower) ||
                        (e.GivenName != null && e.GivenName.ToLower().Contains(searchLower)) ||
                        (e.Surname != null && e.Surname.ToLower().Contains(searchLower))
                    );
                }
            }

            var employees = await query
                .OrderBy(e => e.DisplayName)
                .ToListAsync(cancellationToken);

            return employees.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving employees with filter {@Filter}", filter);
            throw;
        }
    }

    public async Task<EmployeeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _context.Employees
                .Include(e => e.Dienst)
                .ThenInclude(d => d!.BovenliggendeGroep)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            return employee != null ? MapToDto(employee) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving employee with ID {EmployeeId}", id);
            throw;
        }
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate DienstId if provided - if not found locally, we'll skip setting it
            // (Azure AD groups may not be synced to local DB yet)
            Guid? validatedDienstId = null;
            if (dto.DienstId.HasValue)
            {
                var dienstExists = await _context.DistributionGroups
                    .AnyAsync(d => d.Id == dto.DienstId.Value, cancellationToken);

                if (dienstExists)
                {
                    validatedDienstId = dto.DienstId.Value;
                }
                // If dienst doesn't exist locally, we just skip setting it (no error)
            }

            // Check for duplicate email
            var emailExists = await _context.Employees
                .AnyAsync(e => e.Email == dto.Email, cancellationToken);

            if (emailExists)
            {
                throw new InvalidOperationException($"An employee with email {dto.Email} already exists.");
            }

            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                EntraObjectId = Guid.NewGuid().ToString(), // Generate unique ID for manual entries
                DisplayName = dto.DisplayName,
                GivenName = dto.GivenName,
                Surname = dto.Surname,
                Email = dto.Email,
                JobTitle = dto.JobTitle,
                Department = dto.Department,
                OfficeLocation = dto.OfficeLocation,
                MobilePhone = dto.MobilePhone,
                BusinessPhones = dto.BusinessPhones,
                IsActive = dto.IsActive,
                EmployeeType = dto.EmployeeType,
                ArbeidsRegime = dto.ArbeidsRegime,
                PhotoUrl = dto.PhotoUrl,
                DienstId = validatedDienstId,
                StartDatum = dto.StartDatum,
                EindDatum = dto.EindDatum,
                Telefoonnummer = dto.Telefoonnummer,
                Bron = GegevensBron.Handmatig,
                IsHandmatigToegevoegd = true,
                CreatedAt = DateTime.UtcNow
            };

            // Add VrijwilligerDetails if employee is a volunteer
            if (dto.EmployeeType == EmployeeType.Vrijwilliger && dto.VrijwilligerDetails != null)
            {
                employee.VrijwilligerDetails = new VrijwilligerDetails
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employee.Id,
                    Beschikbaarheid = dto.VrijwilligerDetails.Beschikbaarheid,
                    Specialisaties = dto.VrijwilligerDetails.Specialisaties,
                    NoodContactNaam = dto.VrijwilligerDetails.NoodContactNaam,
                    NoodContactTelefoon = dto.VrijwilligerDetails.NoodContactTelefoon,
                    VogDatum = dto.VrijwilligerDetails.VogDatum,
                    VogGeldigTot = dto.VrijwilligerDetails.VogGeldigTot,
                    Opmerkingen = dto.VrijwilligerDetails.Opmerkingen,
                    CreatedAt = DateTime.UtcNow
                };
            }

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created new employee {EmployeeId} - {DisplayName}", employee.Id, employee.DisplayName);

            // Reload with includes
            var created = await GetByIdAsync(employee.Id, cancellationToken);
            return created!;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating employee {DisplayName}", dto.DisplayName);
            throw;
        }
    }

    public async Task<EmployeeDto?> UpdateAsync(
        Guid id,
        UpdateEmployeeDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _context.Employees
                .Include(e => e.VrijwilligerDetails)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return null;
            }

            // Validate updates based on data source
            if (employee.Bron == GegevensBron.AzureAD)
            {
                // Azure-synced employees: Only allow updating specific fields
                _logger.LogInformation(
                    "Updating Azure-synced employee {EmployeeId}. Only specific fields allowed.",
                    id);

                if (dto.EmployeeType.HasValue)
                    employee.EmployeeType = dto.EmployeeType.Value;

                if (dto.ArbeidsRegime.HasValue)
                    employee.ArbeidsRegime = dto.ArbeidsRegime.Value;

                if (dto.DienstId.HasValue)
                {
                    if (dto.DienstId.Value != Guid.Empty)
                    {
                        // Check if dienst exists locally - if not, skip setting it
                        // (Azure AD groups may not be synced to local DB yet)
                        var dienstExists = await _context.DistributionGroups
                            .AnyAsync(d => d.Id == dto.DienstId.Value, cancellationToken);

                        if (dienstExists)
                        {
                            employee.DienstId = dto.DienstId.Value;
                        }
                        // If dienst doesn't exist locally, we just skip setting it (no error)
                    }
                    else
                    {
                        employee.DienstId = null; // Clear dienst
                    }
                }

                if (dto.StartDatum.HasValue)
                    employee.StartDatum = dto.StartDatum.Value;

                if (dto.EindDatum.HasValue)
                    employee.EindDatum = dto.EindDatum.Value;

                if (dto.Telefoonnummer != null)
                    employee.Telefoonnummer = dto.Telefoonnummer;

                // Cannot update: DisplayName, Email, JobTitle (managed by Azure AD)
            }
            else
            {
                // Manual employees: Allow updating all fields
                if (dto.DisplayName != null)
                    employee.DisplayName = dto.DisplayName;

                if (dto.GivenName != null)
                    employee.GivenName = dto.GivenName;

                if (dto.Surname != null)
                    employee.Surname = dto.Surname;

                if (dto.Email != null)
                {
                    // Check for duplicate email
                    var emailExists = await _context.Employees
                        .AnyAsync(e => e.Email == dto.Email && e.Id != id, cancellationToken);

                    if (emailExists)
                    {
                        throw new InvalidOperationException($"An employee with email {dto.Email} already exists.");
                    }

                    employee.Email = dto.Email;
                }

                if (dto.JobTitle != null)
                    employee.JobTitle = dto.JobTitle;

                if (dto.Department != null)
                    employee.Department = dto.Department;

                if (dto.OfficeLocation != null)
                    employee.OfficeLocation = dto.OfficeLocation;

                if (dto.MobilePhone != null)
                    employee.MobilePhone = dto.MobilePhone;

                if (dto.BusinessPhones != null)
                    employee.BusinessPhones = dto.BusinessPhones;

                if (dto.IsActive.HasValue)
                    employee.IsActive = dto.IsActive.Value;

                if (dto.EmployeeType.HasValue)
                    employee.EmployeeType = dto.EmployeeType.Value;

                if (dto.ArbeidsRegime.HasValue)
                    employee.ArbeidsRegime = dto.ArbeidsRegime.Value;

                if (dto.PhotoUrl != null)
                    employee.PhotoUrl = dto.PhotoUrl;

                if (dto.DienstId.HasValue)
                {
                    if (dto.DienstId.Value != Guid.Empty)
                    {
                        // Check if dienst exists locally - if not, skip setting it
                        // (Azure AD groups may not be synced to local DB yet)
                        var dienstExists = await _context.DistributionGroups
                            .AnyAsync(d => d.Id == dto.DienstId.Value, cancellationToken);

                        if (dienstExists)
                        {
                            employee.DienstId = dto.DienstId.Value;
                        }
                        // If dienst doesn't exist locally, we just skip setting it (no error)
                    }
                    else
                    {
                        employee.DienstId = null;
                    }
                }

                if (dto.StartDatum.HasValue)
                    employee.StartDatum = dto.StartDatum.Value;

                if (dto.EindDatum.HasValue)
                    employee.EindDatum = dto.EindDatum.Value;

                if (dto.Telefoonnummer != null)
                    employee.Telefoonnummer = dto.Telefoonnummer;
            }

            // Update VrijwilligerDetails if provided
            if (dto.VrijwilligerDetails != null)
            {
                if (employee.EmployeeType == EmployeeType.Vrijwilliger)
                {
                    if (employee.VrijwilligerDetails == null)
                    {
                        // Create new VrijwilligerDetails
                        employee.VrijwilligerDetails = new VrijwilligerDetails
                        {
                            Id = Guid.NewGuid(),
                            EmployeeId = employee.Id,
                            CreatedAt = DateTime.UtcNow
                        };
                    }

                    var details = employee.VrijwilligerDetails;
                    details.Beschikbaarheid = dto.VrijwilligerDetails.Beschikbaarheid;
                    details.Specialisaties = dto.VrijwilligerDetails.Specialisaties;
                    details.NoodContactNaam = dto.VrijwilligerDetails.NoodContactNaam;
                    details.NoodContactTelefoon = dto.VrijwilligerDetails.NoodContactTelefoon;
                    details.VogDatum = dto.VrijwilligerDetails.VogDatum;
                    details.VogGeldigTot = dto.VrijwilligerDetails.VogGeldigTot;
                    details.Opmerkingen = dto.VrijwilligerDetails.Opmerkingen;
                    details.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _logger.LogWarning(
                        "Cannot add VrijwilligerDetails to employee {EmployeeId} with type {EmployeeType}",
                        id, employee.EmployeeType);
                }
            }

            employee.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated employee {EmployeeId} - {DisplayName}", employee.Id, employee.DisplayName);

            // Reload with includes
            return await GetByIdAsync(employee.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating employee {EmployeeId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _context.Employees.FindAsync([id], cancellationToken);

            if (employee == null)
            {
                return false;
            }

            // Soft delete: Set IsActive to false
            employee.IsActive = false;
            employee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Soft-deleted employee {EmployeeId} - {DisplayName}", employee.Id, employee.DisplayName);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting employee {EmployeeId}", id);
            throw;
        }
    }

    public async Task<EmployeeDto?> UpdateValidatieStatusAsync(
        Guid id,
        ValidatieStatus status,
        string gevalideerdDoor,
        string? opmerkingen = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return null;
            }

            employee.ValidatieStatus = status;
            employee.GevalideerdDoor = gevalideerdDoor;
            employee.ValidatieDatum = DateTime.UtcNow;
            employee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Updated validation status for employee {EmployeeId} to {Status} by {GevalideerdDoor}",
                id, status, gevalideerdDoor);

            // Reload with full includes
            return await GetByIdAsync(id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating validation status for employee {EmployeeId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<EmployeeDto>> GetByDienstAsync(
        Guid dienstId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var employees = await _context.Employees
                .Include(e => e.Dienst)
                .ThenInclude(d => d!.BovenliggendeGroep)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .Where(e => e.DienstId == dienstId && e.IsActive)
                .OrderBy(e => e.DisplayName)
                .ToListAsync(cancellationToken);

            return employees.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving employees for dienst {DienstId}", dienstId);
            throw;
        }
    }

    public async Task<IEnumerable<EmployeeDto>> GetVolunteersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var volunteers = await _context.Employees
                .Include(e => e.Dienst)
                .ThenInclude(d => d!.BovenliggendeGroep)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .Where(e => e.EmployeeType == EmployeeType.Vrijwilliger && e.IsActive)
                .OrderBy(e => e.DisplayName)
                .ToListAsync(cancellationToken);

            return volunteers.Select(MapToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving volunteers");
            throw;
        }
    }

    public async Task<GdprExportDto?> ExportPersonalDataAsync(
        Guid employeeId,
        string exportedBy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. Get employee with all related data
            var employee = await _context.Employees
                .Include(e => e.Dienst)
                    .ThenInclude(d => d!.BovenliggendeGroep)
                .Include(e => e.VrijwilligerDetails)
                .Include(e => e.GroupMemberships)
                    .ThenInclude(m => m.DistributionGroup)
                .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken);

            if (employee == null)
            {
                return null;
            }

            // Determine sector name
            string? sectorNaam = null;
            if (employee.Dienst?.BovenliggendeGroep != null)
            {
                sectorNaam = employee.Dienst.BovenliggendeGroep.DisplayName;
            }
            else if (employee.Dienst?.Niveau == GroepNiveau.Sector)
            {
                sectorNaam = employee.Dienst.DisplayName;
            }

            // 2. Map personal data
            var personalData = new GdprEmployeeDataDto(
                employee.Id,
                employee.EntraObjectId,
                employee.DisplayName,
                employee.GivenName,
                employee.Surname,
                employee.Email,
                employee.Telefoonnummer ?? employee.MobilePhone,
                employee.JobTitle,
                employee.Department,
                employee.EmployeeType,
                employee.ArbeidsRegime,
                employee.IsActive,
                employee.Bron,
                employee.Dienst?.DisplayName,
                sectorNaam,
                employee.StartDatum,
                employee.EindDatum,
                employee.CreatedAt,
                employee.UpdatedAt
            );

            // 3. Map group memberships
            var groupMemberships = employee.GroupMemberships
                .Select(m => new GdprGroupMembershipDto(
                    m.DistributionGroupId,
                    m.DistributionGroup.DisplayName,
                    m.DistributionGroup.Niveau.ToString(),
                    m.ToegevoegdOp
                ))
                .ToList();

            // 4. Get event participations
            var eventParticipations = await _context.Set<Core.Entities.EventParticipant>()
                .Include(ep => ep.Event)
                .Where(ep => ep.EmployeeId == employeeId)
                .Select(ep => new GdprEventParticipationDto(
                    ep.EventId,
                    ep.Event.Titel,
                    ep.Event.Datum,
                    ep.Event.Status.ToString(),
                    ep.ToegevoegdOp,
                    ep.EmailVerstuurd,
                    ep.EmailVerstuurdOp
                ))
                .ToListAsync(cancellationToken);

            // 5. Get audit logs related to this employee
            var auditLogs = await _context.AuditLogs
                .Where(a =>
                    (a.EntityType == AuditEntityType.Employee && a.EntityId == employeeId) ||
                    a.UserId == employee.EntraObjectId)
                .OrderByDescending(a => a.Timestamp)
                .Take(500) // Limit to last 500 entries
                .Select(a => new GdprAuditEntryDto(
                    a.Timestamp,
                    a.Action.ToString(),
                    a.EntityType.ToString(),
                    a.EntityDescription,
                    a.UserDisplayName
                ))
                .ToListAsync(cancellationToken);

            // 6. Get user roles (if employee has EntraObjectId)
            var roles = new List<GdprUserRoleDto>();
            if (!string.IsNullOrEmpty(employee.EntraObjectId))
            {
                var userRoles = await _context.UserRoles
                    .Include(ur => ur.Sector)
                    .Include(ur => ur.Dienst)
                    .Where(ur => ur.EntraObjectId == employee.EntraObjectId && ur.IsActive)
                    .ToListAsync(cancellationToken);

                roles = userRoles.Select(ur => new GdprUserRoleDto(
                    ur.Role,
                    ur.Sector?.DisplayName,
                    ur.Dienst?.DisplayName,
                    ur.CreatedAt,
                    ur.CreatedBy
                )).ToList();
            }

            _logger.LogInformation(
                "GDPR data export requested for employee {EmployeeId} by {ExportedBy}",
                employeeId, exportedBy);

            return new GdprExportDto(
                DateTime.UtcNow,
                exportedBy,
                "GDPR Article 15 - Right of Access",
                personalData,
                groupMemberships,
                eventParticipations,
                auditLogs,
                roles
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting GDPR data for employee {EmployeeId}", employeeId);
            throw;
        }
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Maps an Employee entity to EmployeeDto.
    /// </summary>
    private EmployeeDto MapToDto(Employee employee)
    {
        var groups = employee.GroupMemberships
            .Where(m => m.IsActief)
            .Select(m => m.DistributionGroup.DisplayName)
            .ToList();

        VrijwilligerDetailsDto? vrijwilligerDetails = null;
        if (employee.VrijwilligerDetails != null)
        {
            vrijwilligerDetails = new VrijwilligerDetailsDto(
                employee.VrijwilligerDetails.Id.ToString(),
                employee.VrijwilligerDetails.EmployeeId.ToString(),
                employee.VrijwilligerDetails.Beschikbaarheid,
                employee.VrijwilligerDetails.Specialisaties,
                employee.VrijwilligerDetails.NoodContactNaam,
                employee.VrijwilligerDetails.NoodContactTelefoon,
                employee.VrijwilligerDetails.VogDatum,
                employee.VrijwilligerDetails.VogGeldigTot,
                employee.VrijwilligerDetails.Opmerkingen,
                employee.VrijwilligerDetails.CreatedAt,
                employee.VrijwilligerDetails.UpdatedAt
            );
        }

        // Bepaal de sector naam via de bovenliggende groep van de dienst
        string? sectorNaam = null;
        if (employee.Dienst?.BovenliggendeGroep != null)
        {
            sectorNaam = employee.Dienst.BovenliggendeGroep.DisplayName;
        }
        else if (employee.Dienst?.Niveau == DjoppieHive.Core.Enums.GroepNiveau.Sector)
        {
            // Dienst IS de sector
            sectorNaam = employee.Dienst.DisplayName;
        }

        return new EmployeeDto(
            employee.Id.ToString(),
            employee.DisplayName,
            employee.GivenName,
            employee.Surname,
            employee.Email,
            employee.JobTitle,
            employee.Department,
            employee.OfficeLocation,
            employee.MobilePhone,
            groups,
            employee.IsActive,
            employee.Bron.ToString(),
            employee.IsHandmatigToegevoegd,
            employee.EmployeeType.ToString(),
            employee.ArbeidsRegime.ToString(),
            employee.PhotoUrl,
            employee.DienstId?.ToString(),
            employee.Dienst?.DisplayName,
            sectorNaam,
            employee.StartDatum,
            employee.EindDatum,
            employee.Telefoonnummer,
            employee.ValidatieStatus.ToString(),
            employee.GevalideerdDoor,
            employee.ValidatieDatum,
            vrijwilligerDetails,
            employee.CreatedAt,
            employee.UpdatedAt,
            employee.LastSyncedAt
        );
    }

    #endregion

    #region Validation Count

    /// <inheritdoc />
    public async Task<int> GetValidatieAantalAsync(Guid? sectorId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Employees
            .Where(e => e.IsActive &&
                       (e.ValidatieStatus == ValidatieStatus.Nieuw ||
                        e.ValidatieStatus == ValidatieStatus.InReview));

        // Filter by sector if provided (non-admin users)
        if (sectorId.HasValue)
        {
            // Get all diensten (child groups) within this sector
            var dienstIdsInSector = await _context.DistributionGroups
                .Where(g => g.BovenliggendeGroepId == sectorId.Value)
                .Select(g => g.Id)
                .ToListAsync(cancellationToken);

            // Include employees in any dienst within the sector
            query = query.Where(e => e.DienstId.HasValue && dienstIdsInSector.Contains(e.DienstId.Value));
        }

        return await query.CountAsync(cancellationToken);
    }

    #endregion
}
