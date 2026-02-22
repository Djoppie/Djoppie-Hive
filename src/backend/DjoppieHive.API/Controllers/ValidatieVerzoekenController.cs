using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Controller voor het beheren van validatieverzoeken.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ValidatieVerzoekenController : ControllerBase
{
    private readonly IValidatieVerzoekService _validatieService;
    private readonly ILogger<ValidatieVerzoekenController> _logger;

    public ValidatieVerzoekenController(
        IValidatieVerzoekService validatieService,
        ILogger<ValidatieVerzoekenController> logger)
    {
        _validatieService = validatieService;
        _logger = logger;
    }

    /// <summary>
    /// Haalt alle openstaande validatieverzoeken op.
    /// </summary>
    /// <param name="groepId">Optioneel filter op groep</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ValidatieVerzoekDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ValidatieVerzoekDto>>> GetOpenstaande(
        [FromQuery] Guid? groepId = null,
        CancellationToken cancellationToken = default)
    {
        var verzoeken = await _validatieService.GetOpenstaandeVerzoekenAsync(groepId, cancellationToken);
        return Ok(verzoeken);
    }

    /// <summary>
    /// Haalt een specifiek validatieverzoek op.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ValidatieVerzoekDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ValidatieVerzoekDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var verzoek = await _validatieService.GetByIdAsync(id, cancellationToken);

        if (verzoek == null)
        {
            return NotFound();
        }

        return Ok(verzoek);
    }

    /// <summary>
    /// Handelt een validatieverzoek af.
    /// </summary>
    [HttpPost("{id:guid}/afhandelen")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> HandelAf(
        Guid id,
        [FromBody] AfhandelValidatieVerzoekDto request,
        CancellationToken cancellationToken)
    {
        var gebruiker = User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";

        // Parse afhandeling string naar enum
        if (!Enum.TryParse<ValidatieAfhandeling>(request.Afhandeling, true, out var afhandeling))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Ongeldige afhandeling",
                Detail = $"Afhandeling '{request.Afhandeling}' is niet geldig. " +
                         $"Geldige waarden: {string.Join(", ", Enum.GetNames<ValidatieAfhandeling>())}",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var succes = await _validatieService.HandelAfAsync(
            id,
            afhandeling,
            gebruiker,
            request.Notities,
            cancellationToken);

        if (!succes)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Validatieverzoek niet gevonden of niet afhandelbaar",
                Detail = $"Validatieverzoek met ID {id} is niet gevonden of kan niet worden afgehandeld.",
                Status = StatusCodes.Status404NotFound
            });
        }

        _logger.LogInformation(
            "Validatieverzoek {Id} afgehandeld door {Gebruiker} met actie {Afhandeling}",
            id, gebruiker, afhandeling);

        return NoContent();
    }

    /// <summary>
    /// Haalt het aantal openstaande validatieverzoeken op (voor badge weergave).
    /// </summary>
    [HttpGet("aantal")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> GetAantal(
        [FromQuery] Guid? groepId = null,
        CancellationToken cancellationToken = default)
    {
        var aantal = await _validatieService.GetOpenstaandAantalAsync(groepId, cancellationToken);
        return Ok(aantal);
    }

    // ============================================
    // TEST ENDPOINTS (geen authenticatie vereist)
    // ============================================

    /// <summary>
    /// [TEST] Haalt alle openstaande validatieverzoeken op zonder authenticatie.
    /// </summary>
    [HttpGet("test")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ValidatieVerzoekDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ValidatieVerzoekDto>>> TestGetOpenstaande(
        [FromQuery] Guid? groepId = null,
        CancellationToken cancellationToken = default)
    {
        var verzoeken = await _validatieService.GetOpenstaandeVerzoekenAsync(groepId, cancellationToken);
        return Ok(verzoeken);
    }

    /// <summary>
    /// [TEST] Haalt het aantal openstaande validatieverzoeken op zonder authenticatie.
    /// </summary>
    [HttpGet("test/aantal")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> TestGetAantal(
        [FromQuery] Guid? groepId = null,
        CancellationToken cancellationToken = default)
    {
        var aantal = await _validatieService.GetOpenstaandAantalAsync(groepId, cancellationToken);
        return Ok(aantal);
    }

    /// <summary>
    /// [TEST] Handelt een validatieverzoek af zonder authenticatie.
    /// </summary>
    [HttpPost("test/{id:guid}/afhandelen")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TestHandelAf(
        Guid id,
        [FromBody] AfhandelValidatieVerzoekDto request,
        CancellationToken cancellationToken)
    {
        var gebruiker = "TestGebruiker";

        if (!Enum.TryParse<ValidatieAfhandeling>(request.Afhandeling, true, out var afhandeling))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Ongeldige afhandeling",
                Detail = $"Afhandeling '{request.Afhandeling}' is niet geldig.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var succes = await _validatieService.HandelAfAsync(
            id, afhandeling, gebruiker, request.Notities, cancellationToken);

        if (!succes)
        {
            return NotFound();
        }

        return NoContent();
    }
}
