using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DistributionGroupsController : ControllerBase
{
    private readonly IDistributionGroupService _groupService;
    private readonly ILogger<DistributionGroupsController> _logger;

    public DistributionGroupsController(
        IDistributionGroupService groupService,
        ILogger<DistributionGroupsController> logger)
    {
        _groupService = groupService;
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
    /// Test endpoint to verify Graph API connection (no auth required for debugging).
    /// </summary>
    [HttpGet("test")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> TestGraphConnection(CancellationToken cancellationToken)
    {
        try
        {
            var groups = await _groupService.GetAllGroupsAsync(cancellationToken);
            return Ok(new {
                success = true,
                groupCount = groups.Count(),
                groups = groups.Select(g => new { g.DisplayName, g.Email })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Graph API test failed");
            return Ok(new {
                success = false,
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
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
    /// </summary>
    [HttpPost("{id}/members/{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
    /// </summary>
    [HttpDelete("{id}/members/{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
