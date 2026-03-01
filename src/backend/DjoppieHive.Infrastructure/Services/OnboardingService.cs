using System.Text.Json;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service for managing onboarding/offboarding processes, tasks, and templates.
/// </summary>
public class OnboardingService : IOnboardingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OnboardingService> _logger;
    private readonly IAuditService _auditService;

    public OnboardingService(
        ApplicationDbContext context,
        ILogger<OnboardingService> logger,
        IAuditService auditService)
    {
        _context = context;
        _logger = logger;
        _auditService = auditService;
    }

    #region Process Operations

    public async Task<IEnumerable<OnboardingProcessSummaryDto>> GetAllProcessesAsync(
        OnboardingProcessFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingProcesses
            .Include(p => p.Employee)
            .AsQueryable();

        // Apply filters
        if (filter != null)
        {
            if (filter.Type.HasValue)
                query = query.Where(p => p.Type == filter.Type.Value);

            if (filter.Status.HasValue)
                query = query.Where(p => p.Status == filter.Status.Value);

            if (filter.EmployeeId.HasValue)
                query = query.Where(p => p.EmployeeId == filter.EmployeeId.Value);

            if (filter.VerantwoordelijkeId.HasValue)
                query = query.Where(p => p.VerantwoordelijkeId == filter.VerantwoordelijkeId.Value);

            if (filter.StartDatumVan.HasValue)
                query = query.Where(p => p.GeplandeStartdatum >= filter.StartDatumVan.Value);

            if (filter.StartDatumTot.HasValue)
                query = query.Where(p => p.GeplandeStartdatum <= filter.StartDatumTot.Value);

            if (filter.IsActive.HasValue)
                query = query.Where(p => p.IsActive == filter.IsActive.Value);

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var search = filter.SearchQuery.ToLower();
                query = query.Where(p =>
                    p.Titel.ToLower().Contains(search) ||
                    (p.Employee != null && p.Employee.DisplayName.ToLower().Contains(search)) ||
                    (p.VerantwoordelijkeNaam != null && p.VerantwoordelijkeNaam.ToLower().Contains(search)));
            }
        }

        var processes = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        return processes.Select(p => new OnboardingProcessSummaryDto(
            p.Id,
            p.Type,
            p.Status,
            p.EmployeeId,
            p.Employee?.DisplayName ?? "Onbekend",
            p.Titel,
            p.GeplandeStartdatum,
            p.GewensteEinddatum,
            p.VoortgangPercentage,
            p.AantalVoltooideTaken,
            p.TotaalAantalTaken,
            p.Prioriteit,
            p.VerantwoordelijkeNaam
        ));
    }

    public async Task<OnboardingProcessDto?> GetProcessByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var process = await _context.OnboardingProcesses
            .Include(p => p.Employee)
            .Include(p => p.Template)
            .Include(p => p.Tasks.Where(t => t.IsActive).OrderBy(t => t.Volgorde))
                .ThenInclude(t => t.AfhankelijkVanTaak)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (process == null)
            return null;

        return MapProcessToDto(process);
    }

    public async Task<IEnumerable<OnboardingProcessSummaryDto>> GetProcessesByEmployeeAsync(
        Guid employeeId,
        CancellationToken cancellationToken = default)
    {
        return await GetAllProcessesAsync(
            new OnboardingProcessFilter(EmployeeId: employeeId),
            cancellationToken);
    }

    public async Task<IEnumerable<OnboardingProcessSummaryDto>> GetMyProcessesAsync(
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        var processes = await _context.OnboardingProcesses
            .Include(p => p.Employee)
            .Where(p => p.IsActive && p.VerantwoordelijkeEmail == userEmail)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        return processes.Select(p => new OnboardingProcessSummaryDto(
            p.Id,
            p.Type,
            p.Status,
            p.EmployeeId,
            p.Employee?.DisplayName ?? "Onbekend",
            p.Titel,
            p.GeplandeStartdatum,
            p.GewensteEinddatum,
            p.VoortgangPercentage,
            p.AantalVoltooideTaken,
            p.TotaalAantalTaken,
            p.Prioriteit,
            p.VerantwoordelijkeNaam
        ));
    }

    public async Task<OnboardingProcessDto> CreateProcessAsync(
        CreateOnboardingProcessDto dto,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        // Verify employee exists
        var employee = await _context.Employees.FindAsync([dto.EmployeeId], cancellationToken)
            ?? throw new ArgumentException($"Employee with ID {dto.EmployeeId} not found");

        var process = new OnboardingProcess
        {
            Id = Guid.NewGuid(),
            Type = dto.Type,
            Status = OnboardingProcessStatus.Nieuw,
            EmployeeId = dto.EmployeeId,
            Titel = dto.Titel,
            Beschrijving = dto.Beschrijving,
            GeplandeStartdatum = dto.GeplandeStartdatum,
            GewensteEinddatum = dto.GewensteEinddatum,
            VerantwoordelijkeId = dto.VerantwoordelijkeId,
            VerantwoordelijkeEmail = dto.VerantwoordelijkeEmail,
            VerantwoordelijkeNaam = dto.VerantwoordelijkeNaam,
            Prioriteit = dto.Prioriteit,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.OnboardingProcesses.Add(process);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.Create,
            AuditEntityType.OnboardingProcess,
            process.Id,
            process.Titel,
            null,
            JsonSerializer.Serialize(new { process.Type, process.EmployeeId, process.Titel }),
            null,
            cancellationToken);

        _logger.LogInformation("Created onboarding process {ProcessId} for employee {EmployeeId}", process.Id, dto.EmployeeId);

        return (await GetProcessByIdAsync(process.Id, cancellationToken))!;
    }

    public async Task<OnboardingProcessDto> CreateProcessFromTemplateAsync(
        CreateProcessFromTemplateDto dto,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        var template = await _context.OnboardingTemplates.FindAsync([dto.TemplateId], cancellationToken)
            ?? throw new ArgumentException($"Template with ID {dto.TemplateId} not found");

        var employee = await _context.Employees.FindAsync([dto.EmployeeId], cancellationToken)
            ?? throw new ArgumentException($"Employee with ID {dto.EmployeeId} not found");

        // Create process
        var process = new OnboardingProcess
        {
            Id = Guid.NewGuid(),
            Type = template.ProcessType,
            Status = OnboardingProcessStatus.Nieuw,
            EmployeeId = dto.EmployeeId,
            Titel = $"{template.Naam} - {employee.DisplayName}",
            Beschrijving = template.Beschrijving,
            GeplandeStartdatum = dto.GeplandeStartdatum,
            GewensteEinddatum = dto.GeplandeStartdatum.AddDays(template.StandaardDuurDagen),
            VerantwoordelijkeId = dto.VerantwoordelijkeId,
            VerantwoordelijkeEmail = dto.VerantwoordelijkeEmail,
            VerantwoordelijkeNaam = dto.VerantwoordelijkeNaam,
            TemplateId = template.Id,
            Prioriteit = dto.Prioriteit ?? 3,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.OnboardingProcesses.Add(process);

        // Parse and create tasks from template
        var taskDefinitions = JsonSerializer.Deserialize<List<TemplateTaskDefinitionDto>>(
            template.TaskenDefinitie,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        var taskIdMapping = new Dictionary<int, Guid>(); // Map volgorde to task ID for dependencies

        foreach (var taskDef in taskDefinitions.OrderBy(t => t.Volgorde))
        {
            var taskId = Guid.NewGuid();
            taskIdMapping[taskDef.Volgorde] = taskId;

            Guid? dependencyId = null;
            if (taskDef.AfhankelijkVanVolgorde.HasValue &&
                taskIdMapping.TryGetValue(taskDef.AfhankelijkVanVolgorde.Value, out var depId))
            {
                dependencyId = depId;
            }

            var task = new OnboardingTask
            {
                Id = taskId,
                OnboardingProcessId = process.Id,
                TaskType = taskDef.TaskType,
                Titel = taskDef.Titel,
                Beschrijving = taskDef.Beschrijving,
                Status = OnboardingTaskStatus.NietGestart,
                Volgorde = taskDef.Volgorde,
                IsVerplicht = taskDef.IsVerplicht,
                VerwachteDuurDagen = taskDef.VerwachteDuurDagen,
                ToegewezenAanAfdeling = taskDef.ToegewezenAanAfdeling,
                AfhankelijkVanTaakId = dependencyId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy
            };

            _context.OnboardingTasks.Add(task);
        }

        // Update process task counts
        process.TotaalAantalTaken = taskDefinitions.Count;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.Create,
            AuditEntityType.OnboardingProcess,
            process.Id,
            process.Titel,
            null,
            JsonSerializer.Serialize(new { TemplateId = template.Id, process.EmployeeId, TaskCount = taskDefinitions.Count }),
            "CreatedFromTemplate",
            cancellationToken);

        _logger.LogInformation("Created onboarding process {ProcessId} from template {TemplateId} with {TaskCount} tasks",
            process.Id, template.Id, taskDefinitions.Count);

        return (await GetProcessByIdAsync(process.Id, cancellationToken))!;
    }

    public async Task<OnboardingProcessDto?> UpdateProcessAsync(
        Guid id,
        UpdateOnboardingProcessDto dto,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        var process = await _context.OnboardingProcesses.FindAsync([id], cancellationToken);
        if (process == null || !process.IsActive)
            return null;

        var oldValues = JsonSerializer.Serialize(new
        {
            process.Titel,
            process.Beschrijving,
            process.GeplandeStartdatum,
            process.GewensteEinddatum,
            process.VerantwoordelijkeNaam,
            process.Prioriteit
        });

        if (dto.Titel != null) process.Titel = dto.Titel;
        if (dto.Beschrijving != null) process.Beschrijving = dto.Beschrijving;
        if (dto.GeplandeStartdatum.HasValue) process.GeplandeStartdatum = dto.GeplandeStartdatum.Value;
        if (dto.GewensteEinddatum.HasValue) process.GewensteEinddatum = dto.GewensteEinddatum.Value;
        if (dto.VerantwoordelijkeId.HasValue) process.VerantwoordelijkeId = dto.VerantwoordelijkeId;
        if (dto.VerantwoordelijkeEmail != null) process.VerantwoordelijkeEmail = dto.VerantwoordelijkeEmail;
        if (dto.VerantwoordelijkeNaam != null) process.VerantwoordelijkeNaam = dto.VerantwoordelijkeNaam;
        if (dto.Prioriteit.HasValue) process.Prioriteit = dto.Prioriteit.Value;

        process.UpdatedAt = DateTime.UtcNow;
        process.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.Update,
            AuditEntityType.OnboardingProcess,
            id,
            process.Titel,
            oldValues,
            JsonSerializer.Serialize(dto),
            null,
            cancellationToken);

        return await GetProcessByIdAsync(id, cancellationToken);
    }

    public async Task<OnboardingProcessDto?> ChangeProcessStatusAsync(
        Guid id,
        OnboardingProcessStatus newStatus,
        string updatedBy,
        string? opmerking = null,
        CancellationToken cancellationToken = default)
    {
        var process = await _context.OnboardingProcesses.FindAsync([id], cancellationToken);
        if (process == null || !process.IsActive)
            return null;

        // Validate state transition
        if (!IsValidStatusTransition(process.Status, newStatus))
        {
            throw new InvalidOperationException(
                $"Invalid status transition from {process.Status} to {newStatus}");
        }

        var oldStatus = process.Status;
        process.Status = newStatus;
        process.UpdatedAt = DateTime.UtcNow;
        process.UpdatedBy = updatedBy;

        // Set completion/cancellation dates
        if (newStatus == OnboardingProcessStatus.Voltooid)
            process.DatumVoltooid = DateTime.UtcNow;
        else if (newStatus == OnboardingProcessStatus.Geannuleerd)
            process.DatumGeannuleerd = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.Update,
            AuditEntityType.OnboardingProcess,
            id,
            $"Status: {oldStatus} -> {newStatus}",
            oldStatus.ToString(),
            newStatus.ToString(),
            opmerking,
            cancellationToken);

        _logger.LogInformation("Changed process {ProcessId} status from {OldStatus} to {NewStatus}",
            id, oldStatus, newStatus);

        return await GetProcessByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteProcessAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var process = await _context.OnboardingProcesses.FindAsync([id], cancellationToken);
        if (process == null)
            return false;

        process.IsActive = false;
        process.UpdatedAt = DateTime.UtcNow;

        // Also soft-delete all tasks
        var tasks = await _context.OnboardingTasks
            .Where(t => t.OnboardingProcessId == id)
            .ToListAsync(cancellationToken);

        foreach (var task in tasks)
        {
            task.IsActive = false;
            task.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Soft-deleted process {ProcessId} and {TaskCount} tasks", id, tasks.Count);

        return true;
    }

    private static bool IsValidStatusTransition(OnboardingProcessStatus from, OnboardingProcessStatus to)
    {
        return (from, to) switch
        {
            (OnboardingProcessStatus.Nieuw, OnboardingProcessStatus.InProgress) => true,
            (OnboardingProcessStatus.Nieuw, OnboardingProcessStatus.Geannuleerd) => true,
            (OnboardingProcessStatus.InProgress, OnboardingProcessStatus.Voltooid) => true,
            (OnboardingProcessStatus.InProgress, OnboardingProcessStatus.OnHold) => true,
            (OnboardingProcessStatus.InProgress, OnboardingProcessStatus.Geannuleerd) => true,
            (OnboardingProcessStatus.OnHold, OnboardingProcessStatus.InProgress) => true,
            (OnboardingProcessStatus.OnHold, OnboardingProcessStatus.Geannuleerd) => true,
            _ => false
        };
    }

    #endregion

    #region Task Operations

    public async Task<IEnumerable<OnboardingTaskDto>> GetTasksByProcessAsync(
        Guid processId,
        CancellationToken cancellationToken = default)
    {
        var tasks = await _context.OnboardingTasks
            .Include(t => t.AfhankelijkVanTaak)
            .Where(t => t.OnboardingProcessId == processId && t.IsActive)
            .OrderBy(t => t.Volgorde)
            .ToListAsync(cancellationToken);

        var taskList = new List<OnboardingTaskDto>();
        foreach (var task in tasks)
        {
            var canStart = await CanStartTaskInternalAsync(task, cancellationToken);
            taskList.Add(MapTaskToDto(task, canStart));
        }

        return taskList;
    }

    public async Task<OnboardingTaskDto?> GetTaskByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var task = await _context.OnboardingTasks
            .Include(t => t.AfhankelijkVanTaak)
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive, cancellationToken);

        if (task == null)
            return null;

        var canStart = await CanStartTaskInternalAsync(task, cancellationToken);
        return MapTaskToDto(task, canStart);
    }

    public async Task<IEnumerable<OnboardingTaskDto>> GetMyTasksAsync(
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        var tasks = await _context.OnboardingTasks
            .Include(t => t.AfhankelijkVanTaak)
            .Include(t => t.OnboardingProcess)
            .Where(t => t.IsActive &&
                        t.ToegewezenAanEmail == userEmail &&
                        t.Status != OnboardingTaskStatus.Voltooid &&
                        t.Status != OnboardingTaskStatus.Overgeslagen &&
                        t.OnboardingProcess!.IsActive)
            .OrderBy(t => t.Deadline ?? DateTime.MaxValue)
            .ThenBy(t => t.Volgorde)
            .ToListAsync(cancellationToken);

        var taskList = new List<OnboardingTaskDto>();
        foreach (var task in tasks)
        {
            var canStart = await CanStartTaskInternalAsync(task, cancellationToken);
            taskList.Add(MapTaskToDto(task, canStart));
        }

        return taskList;
    }

    public async Task<OnboardingTaskDto> CreateTaskAsync(
        CreateOnboardingTaskDto dto,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        // Verify process exists
        var process = await _context.OnboardingProcesses.FindAsync([dto.OnboardingProcessId], cancellationToken)
            ?? throw new ArgumentException($"Process with ID {dto.OnboardingProcessId} not found");

        var task = new OnboardingTask
        {
            Id = Guid.NewGuid(),
            OnboardingProcessId = dto.OnboardingProcessId,
            TaskType = dto.TaskType,
            Titel = dto.Titel,
            Beschrijving = dto.Beschrijving,
            Volgorde = dto.Volgorde,
            IsVerplicht = dto.IsVerplicht,
            VerwachteDuurDagen = dto.VerwachteDuurDagen,
            Deadline = dto.Deadline,
            ToegewezenAanId = dto.ToegewezenAanId,
            ToegewezenAanEmail = dto.ToegewezenAanEmail,
            ToegewezenAanNaam = dto.ToegewezenAanNaam,
            ToegewezenAanAfdeling = dto.ToegewezenAanAfdeling,
            AfhankelijkVanTaakId = dto.AfhankelijkVanTaakId,
            Metadata = dto.Metadata,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.OnboardingTasks.Add(task);

        // Update process task count
        process.TotaalAantalTaken++;
        process.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateProcessProgressAsync(dto.OnboardingProcessId, cancellationToken);

        _logger.LogInformation("Created task {TaskId} for process {ProcessId}", task.Id, dto.OnboardingProcessId);

        return (await GetTaskByIdAsync(task.Id, cancellationToken))!;
    }

    public async Task<OnboardingTaskDto?> UpdateTaskAsync(
        Guid id,
        UpdateOnboardingTaskDto dto,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        var task = await _context.OnboardingTasks.FindAsync([id], cancellationToken);
        if (task == null || !task.IsActive)
            return null;

        if (dto.Titel != null) task.Titel = dto.Titel;
        if (dto.Beschrijving != null) task.Beschrijving = dto.Beschrijving;
        if (dto.Volgorde.HasValue) task.Volgorde = dto.Volgorde.Value;
        if (dto.IsVerplicht.HasValue) task.IsVerplicht = dto.IsVerplicht.Value;
        if (dto.VerwachteDuurDagen.HasValue) task.VerwachteDuurDagen = dto.VerwachteDuurDagen.Value;
        if (dto.Deadline.HasValue) task.Deadline = dto.Deadline;
        if (dto.ToegewezenAanId.HasValue) task.ToegewezenAanId = dto.ToegewezenAanId;
        if (dto.ToegewezenAanEmail != null) task.ToegewezenAanEmail = dto.ToegewezenAanEmail;
        if (dto.ToegewezenAanNaam != null) task.ToegewezenAanNaam = dto.ToegewezenAanNaam;
        if (dto.ToegewezenAanAfdeling.HasValue) task.ToegewezenAanAfdeling = dto.ToegewezenAanAfdeling;
        if (dto.AfhankelijkVanTaakId.HasValue) task.AfhankelijkVanTaakId = dto.AfhankelijkVanTaakId;
        if (dto.Metadata != null) task.Metadata = dto.Metadata;

        task.UpdatedAt = DateTime.UtcNow;
        task.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetTaskByIdAsync(id, cancellationToken);
    }

    public async Task<OnboardingTaskDto?> ChangeTaskStatusAsync(
        Guid id,
        OnboardingTaskStatus newStatus,
        string updatedBy,
        string? voltooiingNotities = null,
        CancellationToken cancellationToken = default)
    {
        var task = await _context.OnboardingTasks.FindAsync([id], cancellationToken);
        if (task == null || !task.IsActive)
            return null;

        // Validate dependencies if starting
        if (newStatus == OnboardingTaskStatus.Bezig)
        {
            var canStart = await CanStartTaskAsync(id, cancellationToken);
            if (!canStart)
            {
                throw new InvalidOperationException("Cannot start task: dependencies not completed");
            }
            task.GestartOp = DateTime.UtcNow;
        }

        var oldStatus = task.Status;
        task.Status = newStatus;
        task.UpdatedAt = DateTime.UtcNow;
        task.UpdatedBy = updatedBy;

        // Set completion fields
        if (newStatus == OnboardingTaskStatus.Voltooid || newStatus == OnboardingTaskStatus.Overgeslagen)
        {
            task.VoltooidOp = DateTime.UtcNow;
            task.VoltooidDoor = updatedBy;
            task.VoltooiingNotities = voltooiingNotities;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Recalculate process progress
        await RecalculateProcessProgressAsync(task.OnboardingProcessId, cancellationToken);

        await _auditService.LogAsync(
            AuditAction.Update,
            AuditEntityType.OnboardingTask,
            id,
            $"Status: {oldStatus} -> {newStatus}",
            oldStatus.ToString(),
            newStatus.ToString(),
            null,
            cancellationToken);

        _logger.LogInformation("Changed task {TaskId} status from {OldStatus} to {NewStatus}",
            id, oldStatus, newStatus);

        return await GetTaskByIdAsync(id, cancellationToken);
    }

    public async Task<OnboardingTaskDto?> AssignTaskAsync(
        Guid taskId,
        AssignTaskDto dto,
        string assignedBy,
        CancellationToken cancellationToken = default)
    {
        var task = await _context.OnboardingTasks.FindAsync([taskId], cancellationToken);
        if (task == null || !task.IsActive)
            return null;

        task.ToegewezenAanId = dto.Id;
        task.ToegewezenAanEmail = dto.Email;
        task.ToegewezenAanNaam = dto.Naam;
        task.UpdatedAt = DateTime.UtcNow;
        task.UpdatedBy = assignedBy;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.Update,
            AuditEntityType.OnboardingTask,
            taskId,
            $"Assigned to {dto.Email}",
            null,
            dto.Email,
            null,
            cancellationToken);

        return await GetTaskByIdAsync(taskId, cancellationToken);
    }

    public async Task<bool> DeleteTaskAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var task = await _context.OnboardingTasks.FindAsync([id], cancellationToken);
        if (task == null)
            return false;

        var processId = task.OnboardingProcessId;

        task.IsActive = false;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateProcessProgressAsync(processId, cancellationToken);

        return true;
    }

    public async Task<bool> CanStartTaskAsync(
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        var task = await _context.OnboardingTasks
            .Include(t => t.AfhankelijkVanTaak)
            .FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);

        if (task == null)
            return false;

        return await CanStartTaskInternalAsync(task, cancellationToken);
    }

    private async Task<bool> CanStartTaskInternalAsync(
        OnboardingTask task,
        CancellationToken cancellationToken)
    {
        // Already started or completed
        if (task.Status != OnboardingTaskStatus.NietGestart)
            return task.Status == OnboardingTaskStatus.Bezig;

        // No dependency
        if (!task.AfhankelijkVanTaakId.HasValue)
            return true;

        // Check if dependency is completed
        var dependency = task.AfhankelijkVanTaak ??
            await _context.OnboardingTasks.FindAsync([task.AfhankelijkVanTaakId.Value], cancellationToken);

        return dependency?.Status == OnboardingTaskStatus.Voltooid ||
               dependency?.Status == OnboardingTaskStatus.Overgeslagen;
    }

    #endregion

    #region Template Operations

    public async Task<IEnumerable<OnboardingTemplateDto>> GetAllTemplatesAsync(
        OnboardingProcessType? type = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingTemplates
            .Include(t => t.VoorDienst)
            .Where(t => t.IsActive);

        if (type.HasValue)
            query = query.Where(t => t.ProcessType == type.Value);

        var templates = await query
            .OrderBy(t => t.ProcessType)
            .ThenByDescending(t => t.IsDefault)
            .ThenBy(t => t.Naam)
            .ToListAsync(cancellationToken);

        return templates.Select(MapTemplateToDto);
    }

    public async Task<OnboardingTemplateDto?> GetTemplateByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var template = await _context.OnboardingTemplates
            .Include(t => t.VoorDienst)
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive, cancellationToken);

        return template == null ? null : MapTemplateToDto(template);
    }

    public async Task<OnboardingTemplateDto> CreateTemplateAsync(
        CreateOnboardingTemplateDto dto,
        string createdBy,
        CancellationToken cancellationToken = default)
    {
        // If this is set as default, unset other defaults
        if (dto.IsDefault)
        {
            var existingDefaults = await _context.OnboardingTemplates
                .Where(t => t.ProcessType == dto.ProcessType && t.IsDefault)
                .ToListAsync(cancellationToken);

            foreach (var t in existingDefaults)
            {
                t.IsDefault = false;
                t.UpdatedAt = DateTime.UtcNow;
            }
        }

        var template = new OnboardingTemplate
        {
            Id = Guid.NewGuid(),
            Naam = dto.Naam,
            ProcessType = dto.ProcessType,
            Beschrijving = dto.Beschrijving,
            VoorEmployeeType = dto.VoorEmployeeType,
            VoorDepartment = dto.VoorDepartment,
            VoorDienstId = dto.VoorDienstId,
            VoorSectorId = dto.VoorSectorId,
            TaskenDefinitie = JsonSerializer.Serialize(dto.Taken),
            StandaardDuurDagen = dto.StandaardDuurDagen,
            IsDefault = dto.IsDefault,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.OnboardingTemplates.Add(template);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created template {TemplateId} '{Name}'", template.Id, dto.Naam);

        return (await GetTemplateByIdAsync(template.Id, cancellationToken))!;
    }

    public async Task<OnboardingTemplateDto?> UpdateTemplateAsync(
        Guid id,
        UpdateOnboardingTemplateDto dto,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        var template = await _context.OnboardingTemplates.FindAsync([id], cancellationToken);
        if (template == null || !template.IsActive)
            return null;

        if (dto.Naam != null) template.Naam = dto.Naam;
        if (dto.Beschrijving != null) template.Beschrijving = dto.Beschrijving;
        if (dto.VoorEmployeeType.HasValue) template.VoorEmployeeType = dto.VoorEmployeeType;
        if (dto.VoorDepartment != null) template.VoorDepartment = dto.VoorDepartment;
        if (dto.VoorDienstId.HasValue) template.VoorDienstId = dto.VoorDienstId;
        if (dto.VoorSectorId.HasValue) template.VoorSectorId = dto.VoorSectorId;
        if (dto.Taken != null)
        {
            template.TaskenDefinitie = JsonSerializer.Serialize(dto.Taken);
            template.Versie++;
        }
        if (dto.StandaardDuurDagen.HasValue) template.StandaardDuurDagen = dto.StandaardDuurDagen.Value;
        if (dto.IsActive.HasValue) template.IsActive = dto.IsActive.Value;

        // Handle default flag
        if (dto.IsDefault == true && !template.IsDefault)
        {
            var existingDefaults = await _context.OnboardingTemplates
                .Where(t => t.ProcessType == template.ProcessType && t.IsDefault && t.Id != id)
                .ToListAsync(cancellationToken);

            foreach (var t in existingDefaults)
            {
                t.IsDefault = false;
                t.UpdatedAt = DateTime.UtcNow;
            }
            template.IsDefault = true;
        }
        else if (dto.IsDefault == false)
        {
            template.IsDefault = false;
        }

        template.UpdatedAt = DateTime.UtcNow;
        template.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetTemplateByIdAsync(id, cancellationToken);
    }

    public async Task<OnboardingTemplateDto?> SetDefaultTemplateAsync(
        Guid id,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        var template = await _context.OnboardingTemplates.FindAsync([id], cancellationToken);
        if (template == null || !template.IsActive)
            return null;

        // Unset other defaults for same process type
        var existingDefaults = await _context.OnboardingTemplates
            .Where(t => t.ProcessType == template.ProcessType && t.IsDefault && t.Id != id)
            .ToListAsync(cancellationToken);

        foreach (var t in existingDefaults)
        {
            t.IsDefault = false;
            t.UpdatedAt = DateTime.UtcNow;
        }

        template.IsDefault = true;
        template.UpdatedAt = DateTime.UtcNow;
        template.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetTemplateByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteTemplateAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var template = await _context.OnboardingTemplates.FindAsync([id], cancellationToken);
        if (template == null)
            return false;

        template.IsActive = false;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    #endregion

    #region Business Logic

    public async Task RecalculateProcessProgressAsync(
        Guid processId,
        CancellationToken cancellationToken = default)
    {
        var process = await _context.OnboardingProcesses.FindAsync([processId], cancellationToken);
        if (process == null)
            return;

        var tasks = await _context.OnboardingTasks
            .Where(t => t.OnboardingProcessId == processId && t.IsActive)
            .ToListAsync(cancellationToken);

        var totalRequired = tasks.Count(t => t.IsVerplicht);
        var completedRequired = tasks.Count(t => t.IsVerplicht &&
            (t.Status == OnboardingTaskStatus.Voltooid || t.Status == OnboardingTaskStatus.Overgeslagen));

        process.TotaalAantalTaken = tasks.Count;
        process.AantalVoltooideTaken = tasks.Count(t =>
            t.Status == OnboardingTaskStatus.Voltooid || t.Status == OnboardingTaskStatus.Overgeslagen);

        process.VoortgangPercentage = totalRequired > 0
            ? (int)Math.Round((double)completedRequired / totalRequired * 100)
            : 0;

        process.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<OnboardingStatisticsDto> GetStatisticsAsync(
        CancellationToken cancellationToken = default)
    {
        var processes = await _context.OnboardingProcesses
            .Where(p => p.IsActive)
            .ToListAsync(cancellationToken);

        var tasks = await _context.OnboardingTasks
            .Where(t => t.IsActive)
            .ToListAsync(cancellationToken);

        var completedProcesses = processes.Where(p => p.Status == OnboardingProcessStatus.Voltooid).ToList();
        var avgCompletionTime = completedProcesses.Any()
            ? completedProcesses
                .Where(p => p.DatumVoltooid.HasValue)
                .Average(p => (p.DatumVoltooid!.Value - p.CreatedAt).TotalDays)
            : 0;

        var statusCounts = Enum.GetValues<OnboardingProcessStatus>()
            .Select(s => new ProcessStatusCountDto(s, processes.Count(p => p.Status == s)))
            .ToList();

        var taskTypeCounts = Enum.GetValues<OnboardingTaskType>()
            .Select(t => new TaskTypeCountDto(t, tasks.Count(task => task.TaskType == t)))
            .Where(t => t.Aantal > 0)
            .ToList();

        return new OnboardingStatisticsDto(
            TotaalProcessen: processes.Count,
            ActieveProcessen: processes.Count(p => p.Status == OnboardingProcessStatus.InProgress),
            VoltooideProcessen: processes.Count(p => p.Status == OnboardingProcessStatus.Voltooid),
            GeannuleerdeProcessen: processes.Count(p => p.Status == OnboardingProcessStatus.Geannuleerd),
            OnboardingProcessen: processes.Count(p => p.Type == OnboardingProcessType.Onboarding),
            OffboardingProcessen: processes.Count(p => p.Type == OnboardingProcessType.Offboarding),
            TotaalTaken: tasks.Count,
            VoltooiTaken: tasks.Count(t => t.Status == OnboardingTaskStatus.Voltooid),
            OpenTaken: tasks.Count(t => t.Status == OnboardingTaskStatus.NietGestart || t.Status == OnboardingTaskStatus.Bezig),
            GeblokkeerdeTaken: tasks.Count(t => t.Status == OnboardingTaskStatus.Geblokkeerd),
            GemiddeldeVoltooiingsTijd: Math.Round(avgCompletionTime, 1),
            StatusVerdeling: statusCounts,
            TaakTypeVerdeling: taskTypeCounts
        );
    }

    #endregion

    #region Mapping Helpers

    private OnboardingProcessDto MapProcessToDto(OnboardingProcess process)
    {
        return new OnboardingProcessDto(
            process.Id,
            process.Type,
            process.Status,
            process.EmployeeId,
            process.Employee?.DisplayName ?? "Onbekend",
            process.Employee?.Email,
            process.Titel,
            process.Beschrijving,
            process.GeplandeStartdatum,
            process.GewensteEinddatum,
            process.DatumVoltooid,
            process.DatumGeannuleerd,
            process.VerantwoordelijkeId,
            process.VerantwoordelijkeEmail,
            process.VerantwoordelijkeNaam,
            process.VoortgangPercentage,
            process.AantalVoltooideTaken,
            process.TotaalAantalTaken,
            process.TemplateId,
            process.Template?.Naam,
            process.Prioriteit,
            process.IsActive,
            process.CreatedAt,
            process.CreatedBy,
            process.UpdatedAt,
            process.UpdatedBy,
            process.Tasks?.Select(t => MapTaskToDto(t, true)).ToList()
        );
    }

    private static OnboardingTaskDto MapTaskToDto(OnboardingTask task, bool kanGestart)
    {
        return new OnboardingTaskDto(
            task.Id,
            task.OnboardingProcessId,
            task.TaskType,
            task.Titel,
            task.Beschrijving,
            task.Status,
            task.Volgorde,
            task.IsVerplicht,
            task.VerwachteDuurDagen,
            task.Deadline,
            task.ToegewezenAanId,
            task.ToegewezenAanEmail,
            task.ToegewezenAanNaam,
            task.ToegewezenAanAfdeling,
            task.GestartOp,
            task.VoltooidOp,
            task.VoltooidDoor,
            task.VoltooiingNotities,
            task.AfhankelijkVanTaakId,
            task.AfhankelijkVanTaak?.Titel,
            task.Metadata,
            task.IsActive,
            task.CreatedAt,
            task.CreatedBy,
            task.UpdatedAt,
            task.UpdatedBy,
            kanGestart
        );
    }

    private OnboardingTemplateDto MapTemplateToDto(OnboardingTemplate template)
    {
        var taken = JsonSerializer.Deserialize<List<TemplateTaskDefinitionDto>>(
            template.TaskenDefinitie,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        return new OnboardingTemplateDto(
            template.Id,
            template.Naam,
            template.ProcessType,
            template.Beschrijving,
            template.VoorEmployeeType,
            template.VoorDepartment,
            template.VoorDienstId,
            template.VoorDienst?.DisplayName,
            template.VoorSectorId,
            null, // VoorSectorNaam - would need join
            taken,
            template.StandaardDuurDagen,
            template.IsActive,
            template.IsDefault,
            template.Versie,
            template.CreatedAt,
            template.CreatedBy,
            template.UpdatedAt,
            template.UpdatedBy
        );
    }

    #endregion
}
