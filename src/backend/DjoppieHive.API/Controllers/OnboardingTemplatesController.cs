using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van onboarding/offboarding templates.
/// Templates defini�ren standaard taken voor processen.
/// </summary>
[ApiController]
[Route("api/onboarding-templates")]
[Authorize]
[Tags("Onboarding")]
public class OnboardingTemplatesController : ControllerBase
{
    private readonly IOnboardingService _onboardingService;
    private readonly ILogger<OnboardingTemplatesController> _logger;

    public OnboardingTemplatesController(
        IOnboardingService onboardingService,
        ILogger<OnboardingTemplatesController> logger)
    {
        _onboardingService = onboardingService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all templates with optional type filter.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<OnboardingTemplateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OnboardingTemplateDto>>> GetAll(
        [FromQuery] OnboardingProcessType? type,
        CancellationToken cancellationToken)
    {
        var templates = await _onboardingService.GetAllTemplatesAsync(type, cancellationToken);
        return Ok(templates);
    }

    /// <summary>
    /// Gets a specific template by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OnboardingTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingTemplateDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var template = await _onboardingService.GetTemplateByIdAsync(id, cancellationToken);

        if (template == null)
        {
            return NotFound(new { message = $"Template met ID {id} niet gevonden." });
        }

        return Ok(template);
    }

    /// <summary>
    /// Creates a new template.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(OnboardingTemplateDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OnboardingTemplateDto>> Create(
        [FromBody] CreateOnboardingTemplateDto dto,
        CancellationToken cancellationToken)
    {
        var createdBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        try
        {
            var template = await _onboardingService.CreateTemplateAsync(dto, createdBy, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = template.Id }, template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing template.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(OnboardingTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingTemplateDto>> Update(
        Guid id,
        [FromBody] UpdateOnboardingTemplateDto dto,
        CancellationToken cancellationToken)
    {
        var updatedBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        var template = await _onboardingService.UpdateTemplateAsync(id, dto, updatedBy, cancellationToken);

        if (template == null)
        {
            return NotFound(new { message = $"Template met ID {id} niet gevonden." });
        }

        return Ok(template);
    }

    /// <summary>
    /// Sets a template as the default for its process type.
    /// </summary>
    [HttpPatch("{id:guid}/set-default")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(typeof(OnboardingTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OnboardingTemplateDto>> SetDefault(
        Guid id,
        CancellationToken cancellationToken)
    {
        var updatedBy = User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "unknown";

        var template = await _onboardingService.SetDefaultTemplateAsync(id, updatedBy, cancellationToken);

        if (template == null)
        {
            return NotFound(new { message = $"Template met ID {id} niet gevonden." });
        }

        return Ok(template);
    }

    /// <summary>
    /// Soft deletes a template.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireIctAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _onboardingService.DeleteTemplateAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(new { message = $"Template met ID {id} niet gevonden." });
        }

        return NoContent();
    }
}
