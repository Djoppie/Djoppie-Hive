using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service interface for managing onboarding/offboarding processes, tasks, and templates.
/// </summary>
public interface IOnboardingService
{
    #region Process Operations

    /// <summary>
    /// Gets all onboarding processes with optional filtering.
    /// </summary>
    Task<IEnumerable<OnboardingProcessSummaryDto>> GetAllProcessesAsync(
        OnboardingProcessFilter? filter = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific process by ID with all tasks.
    /// </summary>
    Task<OnboardingProcessDto?> GetProcessByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all processes for a specific employee.
    /// </summary>
    Task<IEnumerable<OnboardingProcessSummaryDto>> GetProcessesByEmployeeAsync(
        Guid employeeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets processes assigned to a specific responsible person.
    /// </summary>
    Task<IEnumerable<OnboardingProcessSummaryDto>> GetMyProcessesAsync(
        string userEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new onboarding process.
    /// </summary>
    Task<OnboardingProcessDto> CreateProcessAsync(
        CreateOnboardingProcessDto dto,
        string createdBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new process from a template.
    /// </summary>
    Task<OnboardingProcessDto> CreateProcessFromTemplateAsync(
        CreateProcessFromTemplateDto dto,
        string createdBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing process.
    /// </summary>
    Task<OnboardingProcessDto?> UpdateProcessAsync(
        Guid id,
        UpdateOnboardingProcessDto dto,
        string updatedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Changes the status of a process with state machine validation.
    /// </summary>
    Task<OnboardingProcessDto?> ChangeProcessStatusAsync(
        Guid id,
        OnboardingProcessStatus newStatus,
        string updatedBy,
        string? opmerking = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a process.
    /// </summary>
    Task<bool> DeleteProcessAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    #endregion

    #region Task Operations

    /// <summary>
    /// Gets all tasks for a specific process.
    /// </summary>
    Task<IEnumerable<OnboardingTaskDto>> GetTasksByProcessAsync(
        Guid processId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific task by ID.
    /// </summary>
    Task<OnboardingTaskDto?> GetTaskByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all tasks assigned to a specific person.
    /// </summary>
    Task<IEnumerable<OnboardingTaskDto>> GetMyTasksAsync(
        string userEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new task within a process.
    /// </summary>
    Task<OnboardingTaskDto> CreateTaskAsync(
        CreateOnboardingTaskDto dto,
        string createdBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing task.
    /// </summary>
    Task<OnboardingTaskDto?> UpdateTaskAsync(
        Guid id,
        UpdateOnboardingTaskDto dto,
        string updatedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Changes the status of a task with dependency validation.
    /// </summary>
    Task<OnboardingTaskDto?> ChangeTaskStatusAsync(
        Guid id,
        OnboardingTaskStatus newStatus,
        string updatedBy,
        string? voltooiingNotities = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Assigns a task to a person.
    /// </summary>
    Task<OnboardingTaskDto?> AssignTaskAsync(
        Guid taskId,
        AssignTaskDto dto,
        string assignedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a task.
    /// </summary>
    Task<bool> DeleteTaskAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a task can be started (dependencies completed).
    /// </summary>
    Task<bool> CanStartTaskAsync(
        Guid taskId,
        CancellationToken cancellationToken = default);

    #endregion

    #region Template Operations

    /// <summary>
    /// Gets all templates with optional type filter.
    /// </summary>
    Task<IEnumerable<OnboardingTemplateDto>> GetAllTemplatesAsync(
        OnboardingProcessType? type = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific template by ID.
    /// </summary>
    Task<OnboardingTemplateDto?> GetTemplateByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new template.
    /// </summary>
    Task<OnboardingTemplateDto> CreateTemplateAsync(
        CreateOnboardingTemplateDto dto,
        string createdBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing template.
    /// </summary>
    Task<OnboardingTemplateDto?> UpdateTemplateAsync(
        Guid id,
        UpdateOnboardingTemplateDto dto,
        string updatedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets a template as the default for its process type.
    /// </summary>
    Task<OnboardingTemplateDto?> SetDefaultTemplateAsync(
        Guid id,
        string updatedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a template.
    /// </summary>
    Task<bool> DeleteTemplateAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    #endregion

    #region Business Logic

    /// <summary>
    /// Recalculates the progress fields of a process based on task completion.
    /// Called automatically when task status changes.
    /// </summary>
    Task RecalculateProcessProgressAsync(
        Guid processId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets onboarding statistics for dashboard/overview.
    /// </summary>
    Task<OnboardingStatisticsDto> GetStatisticsAsync(
        CancellationToken cancellationToken = default);

    #endregion
}
