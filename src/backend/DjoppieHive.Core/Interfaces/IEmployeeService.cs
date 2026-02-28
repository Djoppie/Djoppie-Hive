using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service interface for managing employees from Entra ID and local database.
/// </summary>
public interface IEmployeeService
{
    /// <summary>
    /// Gets all employees from MG- distribution groups (Graph API - legacy method).
    /// </summary>
    Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an employee by their Entra Object ID (Graph API - legacy method).
    /// </summary>
    Task<EmployeeDto?> GetEmployeeByIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches employees by name or email (Graph API - legacy method).
    /// </summary>
    Task<IEnumerable<EmployeeSummaryDto>> SearchEmployeesAsync(string query, CancellationToken cancellationToken = default);

    // NEW CRUD METHODS (Database operations)

    /// <summary>
    /// Gets all employees from the database with optional filtering.
    /// </summary>
    Task<IEnumerable<EmployeeDto>> GetAllAsync(EmployeeFilter? filter = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an employee by their internal database ID.
    /// </summary>
    Task<EmployeeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new employee in the database.
    /// </summary>
    Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing employee in the database.
    /// Validates that Azure-synced employees can only update specific fields.
    /// </summary>
    Task<EmployeeDto?> UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes an employee (sets IsActive = false).
    /// </summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the validation status of an employee.
    /// Used by HR/managers to approve or reject employee data.
    /// </summary>
    Task<EmployeeDto?> UpdateValidatieStatusAsync(
        Guid id,
        Enums.ValidatieStatus status,
        string gevalideerdDoor,
        string? opmerkingen = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all employees belonging to a specific dienst (DistributionGroup).
    /// </summary>
    Task<IEnumerable<EmployeeDto>> GetByDienstAsync(Guid dienstId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all volunteers (employees with EmployeeType = Vrijwilliger).
    /// Includes VrijwilligerDetails if available.
    /// </summary>
    Task<IEnumerable<EmployeeDto>> GetVolunteersAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports all personal data for a specific employee (GDPR Article 15).
    /// Includes: personal data, group memberships, event participations, audit logs, roles.
    /// </summary>
    Task<GdprExportDto?> ExportPersonalDataAsync(Guid employeeId, string exportedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the count of employees that need validation (status Nieuw or InReview).
    /// Optionally filtered by sector.
    /// </summary>
    Task<int> GetValidatieAantalAsync(Guid? sectorId = null, CancellationToken cancellationToken = default);
}
