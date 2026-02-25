using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Unified Groups API - Combineert Exchange, Dynamic en Local groepen.
/// Onderdeel van het Hybrid Groups System.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Unified Groups")]
public class UnifiedGroupsController : ControllerBase
{
    private readonly IUnifiedGroupService _groupService;
    private readonly IUserContextService _userContext;
    private readonly ILogger<UnifiedGroupsController> _logger;

    public UnifiedGroupsController(
        IUnifiedGroupService groupService,
        IUserContextService userContext,
        ILogger<UnifiedGroupsController> logger)
    {
        _groupService = groupService;
        _userContext = userContext;
        _logger = logger;
    }

    #region Unified Operations

    /// <summary>
    /// Gets all groups from all sources (Exchange, Dynamic, Local).
    /// </summary>
    /// <returns>List of unified groups sorted by display name.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UnifiedGroupDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UnifiedGroupDto>>> GetAll(CancellationToken ct)
    {
        var groups = await _groupService.GetAllGroupsAsync(ct);
        return Ok(groups);
    }

    /// <summary>
    /// Gets a specific group by ID with full details and members.
    /// </summary>
    /// <param name="id">Group ID. Format: raw GUID for Exchange, "dynamic:{guid}" or "local:{guid}".</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UnifiedGroupDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UnifiedGroupDetailDto>> GetById(string id, CancellationToken ct)
    {
        var group = await _groupService.GetGroupByIdAsync(id, ct);

        if (group == null)
        {
            return NotFound(new { message = $"Group with ID '{id}' not found" });
        }

        return Ok(group);
    }

    /// <summary>
    /// Gets all members of a group.
    /// </summary>
    /// <param name="id">Group ID.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("{id}/members")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeSummaryDto>>> GetMembers(string id, CancellationToken ct)
    {
        var members = await _groupService.GetGroupMembersAsync(id, ct);
        return Ok(members);
    }

    /// <summary>
    /// Gets a preview of combined members from multiple groups.
    /// Useful for showing recipient count when multiple groups are selected.
    /// </summary>
    /// <param name="groupIds">Comma-separated list of group IDs.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("preview")]
    [ProducesResponseType(typeof(GroupsPreviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<GroupsPreviewDto>> GetPreview([FromQuery] string groupIds, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(groupIds))
        {
            return Ok(new GroupsPreviewDto(0, new Dictionary<string, int>(), new List<EmployeeSummaryDto>()));
        }

        var ids = groupIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var preview = await _groupService.GetGroupsPreviewAsync(ids, ct);
        return Ok(preview);
    }

    #endregion

    #region Dynamic Group Operations

    /// <summary>
    /// Creates a new dynamic group with filter-based membership.
    /// </summary>
    [HttpPost("dynamic")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(typeof(UnifiedGroupDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UnifiedGroupDto>> CreateDynamicGroup(
        [FromBody] CreateDynamicGroupDto dto,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.DisplayName))
        {
            return BadRequest(new { message = "DisplayName is required" });
        }

        var createdBy = _userContext.GetCurrentUserEmail();
        var group = await _groupService.CreateDynamicGroupAsync(dto, createdBy, ct);

        _logger.LogInformation("Dynamic group '{GroupName}' created by {User}",
            group.DisplayName, createdBy);

        return CreatedAtAction(nameof(GetById), new { id = group.Id }, group);
    }

    /// <summary>
    /// Updates an existing dynamic group.
    /// </summary>
    [HttpPut("dynamic/{id:guid}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(typeof(UnifiedGroupDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UnifiedGroupDto>> UpdateDynamicGroup(
        Guid id,
        [FromBody] UpdateDynamicGroupDto dto,
        CancellationToken ct)
    {
        var group = await _groupService.UpdateDynamicGroupAsync(id, dto, ct);

        if (group == null)
        {
            return NotFound(new { message = $"Dynamic group with ID '{id}' not found" });
        }

        _logger.LogInformation("Dynamic group '{GroupId}' updated by {User}",
            id, _userContext.GetCurrentUserEmail());

        return Ok(group);
    }

    /// <summary>
    /// Deletes a dynamic group. System groups cannot be deleted.
    /// </summary>
    [HttpDelete("dynamic/{id:guid}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDynamicGroup(Guid id, CancellationToken ct)
    {
        var success = await _groupService.DeleteDynamicGroupAsync(id, ct);

        if (!success)
        {
            return BadRequest(new { message = "Cannot delete dynamic group. It may be a system group or does not exist." });
        }

        _logger.LogInformation("Dynamic group '{GroupId}' deleted by {User}",
            id, _userContext.GetCurrentUserEmail());

        return NoContent();
    }

    /// <summary>
    /// Re-evaluates the members of a dynamic group based on its filter criteria.
    /// Returns the new member count.
    /// </summary>
    [HttpPost("dynamic/{id:guid}/evaluate")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> EvaluateDynamicGroup(Guid id, CancellationToken ct)
    {
        var memberCount = await _groupService.EvaluateDynamicGroupAsync(id, ct);

        if (memberCount == 0)
        {
            // Could be 0 members or group not found - check existence
            var group = await _groupService.GetGroupByIdAsync($"dynamic:{id}", ct);
            if (group == null)
            {
                return NotFound(new { message = $"Dynamic group with ID '{id}' not found" });
            }
        }

        return Ok(new { memberCount });
    }

    #endregion

    #region Local Group Operations

    /// <summary>
    /// Creates a new local group with manually managed membership.
    /// </summary>
    [HttpPost("local")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(typeof(UnifiedGroupDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UnifiedGroupDto>> CreateLocalGroup(
        [FromBody] CreateLocalGroupDto dto,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.DisplayName))
        {
            return BadRequest(new { message = "DisplayName is required" });
        }

        var createdBy = _userContext.GetCurrentUserEmail();
        var group = await _groupService.CreateLocalGroupAsync(dto, createdBy, ct);

        _logger.LogInformation("Local group '{GroupName}' created by {User}",
            group.DisplayName, createdBy);

        return CreatedAtAction(nameof(GetById), new { id = group.Id }, group);
    }

    /// <summary>
    /// Updates an existing local group.
    /// </summary>
    [HttpPut("local/{id:guid}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(typeof(UnifiedGroupDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UnifiedGroupDto>> UpdateLocalGroup(
        Guid id,
        [FromBody] UpdateLocalGroupDto dto,
        CancellationToken ct)
    {
        var group = await _groupService.UpdateLocalGroupAsync(id, dto, ct);

        if (group == null)
        {
            return NotFound(new { message = $"Local group with ID '{id}' not found" });
        }

        _logger.LogInformation("Local group '{GroupId}' updated by {User}",
            id, _userContext.GetCurrentUserEmail());

        return Ok(group);
    }

    /// <summary>
    /// Deletes a local group.
    /// </summary>
    [HttpDelete("local/{id:guid}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLocalGroup(Guid id, CancellationToken ct)
    {
        var success = await _groupService.DeleteLocalGroupAsync(id, ct);

        if (!success)
        {
            return NotFound(new { message = $"Local group with ID '{id}' not found" });
        }

        _logger.LogInformation("Local group '{GroupId}' deleted by {User}",
            id, _userContext.GetCurrentUserEmail());

        return NoContent();
    }

    /// <summary>
    /// Adds a member to a local group.
    /// </summary>
    [HttpPost("local/{groupId:guid}/members/{employeeId:guid}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddMemberToLocalGroup(
        Guid groupId,
        Guid employeeId,
        CancellationToken ct)
    {
        var addedBy = _userContext.GetCurrentUserEmail();
        var success = await _groupService.AddMemberToLocalGroupAsync(groupId, employeeId, addedBy, ct);

        if (!success)
        {
            return BadRequest(new { message = "Failed to add member. Group or employee may not exist." });
        }

        _logger.LogInformation("Employee {EmployeeId} added to local group {GroupId} by {User}",
            employeeId, groupId, addedBy);

        return NoContent();
    }

    /// <summary>
    /// Removes a member from a local group.
    /// </summary>
    [HttpDelete("local/{groupId:guid}/members/{employeeId:guid}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveMemberFromLocalGroup(
        Guid groupId,
        Guid employeeId,
        CancellationToken ct)
    {
        var success = await _groupService.RemoveMemberFromLocalGroupAsync(groupId, employeeId, ct);

        if (!success)
        {
            return NotFound(new { message = "Membership not found" });
        }

        _logger.LogInformation("Employee {EmployeeId} removed from local group {GroupId} by {User}",
            employeeId, groupId, _userContext.GetCurrentUserEmail());

        return NoContent();
    }

    #endregion

    #region Export Operations

    /// <summary>
    /// Exports email addresses of selected groups as a CSV string.
    /// </summary>
    /// <param name="groupIds">Comma-separated list of group IDs.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("export/emails")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<ActionResult<string>> ExportEmails([FromQuery] string groupIds, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(groupIds))
        {
            return Ok(string.Empty);
        }

        var ids = groupIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var csv = await _groupService.GetGroupEmailsAsCsvAsync(ids, ct);

        return Ok(csv);
    }

    /// <summary>
    /// Generates a mailto: link for the selected groups.
    /// Useful for opening Outlook with all recipients pre-filled.
    /// </summary>
    /// <param name="groupIds">Comma-separated list of group IDs.</param>
    /// <param name="subject">Optional email subject.</param>
    /// <param name="body">Optional email body.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("export/mailto")]
    [ProducesResponseType(typeof(EmailExportDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmailExportDto>> GetMailtoLink(
        [FromQuery] string groupIds,
        [FromQuery] string? subject = null,
        [FromQuery] string? body = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(groupIds))
        {
            return Ok(new EmailExportDto("mailto:", 0, null));
        }

        var ids = groupIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var result = await _groupService.GetMailtoLinkAsync(ids, subject, body, ct);

        return Ok(result);
    }

    #endregion
}
