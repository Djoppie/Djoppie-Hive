using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van MG- distributiegroepen uit Microsoft 365.
/// Biedt inzicht in de organisatiehierarchie met sectoren en diensten.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Distributiegroepen")]
public class DistributionGroupsController : ControllerBase
{
    private readonly IDistributionGroupService _groupService;
    private readonly IUserContextService _userContext;
    private readonly ILogger<DistributionGroupsController> _logger;

    public DistributionGroupsController(
        IDistributionGroupService groupService,
        IUserContextService userContext,
        ILogger<DistributionGroupsController> logger)
    {
        _groupService = groupService;
        _userContext = userContext;
        _logger = logger;
    }

    /// <summary>
    /// Gets all MG- distribution groups.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DistributionGroupDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DistributionGroupDto>>> GetAll(CancellationToken cancellationToken)
    {
        var groups = await _groupService.GetAllGroupsAsync(cancellationToken);
        return Ok(groups);
    }

    /// <summary>
    /// Gets the complete organizational hierarchy starting from MG-iedereenpersoneel.
    /// Returns all sectors (MG-SECTOR-*), their sector managers, diensten (MG-*), and medewerkers.
    /// </summary>
    [HttpGet("hierarchy")]
    [ProducesResponseType(typeof(OrganizationHierarchyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrganizationHierarchyDto>> GetHierarchy(CancellationToken cancellationToken)
    {
        var hierarchy = await _groupService.GetOrganizationHierarchyAsync(cancellationToken);

        if (hierarchy == null)
        {
            return NotFound(new { message = "Root group MG-iedereenpersoneel not found in Entra ID" });
        }

        _logger.LogInformation(
            "Retrieved organization hierarchy: {TotalSectors} sectors, {TotalDiensten} diensten, {TotalMedewerkers} medewerkers",
            hierarchy.TotalSectors, hierarchy.TotalDiensten, hierarchy.TotalMedewerkers);

        return Ok(hierarchy);
    }

    /// <summary>
    /// Gets a specific distribution group by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DistributionGroupDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DistributionGroupDetailDto>> GetById(string id, CancellationToken cancellationToken)
    {
        var group = await _groupService.GetGroupByIdAsync(id, cancellationToken);

        if (group == null)
        {
            return NotFound();
        }

        return Ok(group);
    }

    /// <summary>
    /// Gets all members of a distribution group.
    /// </summary>
    [HttpGet("{id}/members")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeSummaryDto>>> GetMembers(string id, CancellationToken cancellationToken)
    {
        var members = await _groupService.GetGroupMembersAsync(id, cancellationToken);
        return Ok(members);
    }

    /// <summary>
    /// Adds a member to a distribution group.
    /// Requires: CanManageGroups (ICT Admin only)
    /// </summary>
    [HttpPost("{id}/members/{userId}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddMember(string id, string userId, CancellationToken cancellationToken)
    {
        var success = await _groupService.AddMemberToGroupAsync(id, userId, cancellationToken);

        if (!success)
        {
            return BadRequest("Failed to add member to group");
        }

        _logger.LogInformation("Member {UserId} added to group {GroupId} by {User}",
            userId, id, User.Identity?.Name);

        return NoContent();
    }

    /// <summary>
    /// Removes a member from a distribution group.
    /// Requires: CanManageGroups (ICT Admin only)
    /// </summary>
    [HttpDelete("{id}/members/{userId}")]
    [Authorize(Policy = PolicyNames.CanManageGroups)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RemoveMember(string id, string userId, CancellationToken cancellationToken)
    {
        var success = await _groupService.RemoveMemberFromGroupAsync(id, userId, cancellationToken);

        if (!success)
        {
            return BadRequest("Failed to remove member from group");
        }

        _logger.LogInformation("Member {UserId} removed from group {GroupId} by {User}",
            userId, id, User.Identity?.Name);

        return NoContent();
    }
}
