using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service interface for managing employees from Entra ID.
/// </summary>
public interface IEmployeeService
{
    /// <summary>
    /// Gets all employees from MG- distribution groups.
    /// </summary>
    Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an employee by their Entra Object ID.
    /// </summary>
    Task<EmployeeDto?> GetEmployeeByIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches employees by name or email.
    /// </summary>
    Task<IEnumerable<EmployeeSummaryDto>> SearchEmployeesAsync(string query, CancellationToken cancellationToken = default);
}
