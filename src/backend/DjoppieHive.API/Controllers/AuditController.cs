using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Audit logs voor GDPR compliance en wijzigingsbeheer.
/// Biedt inzicht in alle wijzigingen aan medewerkers en groepen.
/// Alleen toegankelijk voor HR Admin en ICT Admin.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.CanViewAuditLogs)]
[Tags("Audit & Compliance")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;
    private readonly ILogger<AuditController> _logger;

    public AuditController(
        IAuditService auditService,
        ILogger<AuditController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Haal audit logs op met optionele filters en paginering.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(AuditLogPagedResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuditLogPagedResponse>> GetLogs(
        [FromQuery] AuditLogFilterDto filter,
        CancellationToken cancellationToken)
    {
        // Parse action filter if provided
        AuditAction? action = null;
        if (!string.IsNullOrEmpty(filter.Action) && Enum.TryParse<AuditAction>(filter.Action, true, out var parsedAction))
        {
            action = parsedAction;
        }

        // Parse entity type filter if provided
        AuditEntityType? entityType = null;
        if (!string.IsNullOrEmpty(filter.EntityType) && Enum.TryParse<AuditEntityType>(filter.EntityType, true, out var parsedEntityType))
        {
            entityType = parsedEntityType;
        }

        var logs = await _auditService.GetLogsAsync(
            filter.FromDate,
            filter.ToDate,
            filter.UserId,
            action,
            entityType,
            filter.EntityId,
            filter.PageNumber,
            filter.PageSize,
            cancellationToken);

        var totalCount = await _auditService.GetLogsCountAsync(
            filter.FromDate,
            filter.ToDate,
            filter.UserId,
            action,
            entityType,
            filter.EntityId,
            cancellationToken);

        var totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize);

        var items = logs.Select(l => new AuditLogDto(
            l.Id,
            l.UserId,
            l.UserEmail,
            l.UserDisplayName,
            l.Action.ToString(),
            l.EntityType.ToString(),
            l.EntityId,
            l.EntityDescription,
            l.OldValues,
            l.NewValues,
            l.Timestamp,
            l.IpAddress,
            l.AdditionalInfo
        ));

        return Ok(new AuditLogPagedResponse(
            items,
            totalCount,
            filter.PageNumber,
            filter.PageSize,
            totalPages
        ));
    }

    /// <summary>
    /// Haal de audit geschiedenis op voor een specifieke entiteit.
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<AuditLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetEntityHistory(
        string entityType,
        Guid entityId,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<AuditEntityType>(entityType, true, out var parsedEntityType))
        {
            return BadRequest(new { message = $"Ongeldig entity type: {entityType}" });
        }

        var logs = await _auditService.GetEntityHistoryAsync(
            parsedEntityType,
            entityId,
            cancellationToken);

        var items = logs.Select(l => new AuditLogDto(
            l.Id,
            l.UserId,
            l.UserEmail,
            l.UserDisplayName,
            l.Action.ToString(),
            l.EntityType.ToString(),
            l.EntityId,
            l.EntityDescription,
            l.OldValues,
            l.NewValues,
            l.Timestamp,
            l.IpAddress,
            l.AdditionalInfo
        ));

        return Ok(items);
    }

    /// <summary>
    /// Haal beschikbare filter opties op (actions en entity types).
    /// </summary>
    [HttpGet("options")]
    [ProducesResponseType(typeof(AuditFilterOptions), StatusCodes.Status200OK)]
    public ActionResult<AuditFilterOptions> GetFilterOptions()
    {
        var actions = Enum.GetNames<AuditAction>();
        var entityTypes = Enum.GetNames<AuditEntityType>();

        return Ok(new AuditFilterOptions(actions, entityTypes));
    }
}

/// <summary>
/// Filter opties voor audit logs.
/// </summary>
public record AuditFilterOptions(
    IEnumerable<string> Actions,
    IEnumerable<string> EntityTypes
);
