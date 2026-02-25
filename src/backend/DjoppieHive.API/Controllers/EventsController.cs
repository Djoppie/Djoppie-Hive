using System.Text.Json;
using DjoppieHive.API.Authorization;
using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieHive.API.Controllers;

/// <summary>
/// Beheer van evenementen en uitnodigingen.
/// Ondersteunt het aanmaken, versturen en beheren van evenementen
/// zoals personeelsfeesten, meetings en andere events.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Evenementen")]
public class EventsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EventsController> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public EventsController(
        ApplicationDbContext context,
        ILogger<EventsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Haal alle evenementen op.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetAll(
        [FromQuery] EventStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Events
            .Include(e => e.DistributieGroep)
            .Include(e => e.Deelnemers)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(e => e.Status == status.Value);
        }

        var events = await query
            .OrderByDescending(e => e.AangemaaktOp)
            .ToListAsync(cancellationToken);

        return Ok(events.Select(MapToDto));
    }

    /// <summary>
    /// Haal een specifiek evenement op met details.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EventDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var eventEntity = await _context.Events
            .Include(e => e.DistributieGroep)
            .Include(e => e.Deelnemers)
                .ThenInclude(p => p.Employee)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (eventEntity == null)
        {
            return NotFound(new { message = $"Evenement met ID {id} niet gevonden." });
        }

        return Ok(MapToDetailDto(eventEntity));
    }

    /// <summary>
    /// Maak een nieuw evenement aan.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyNames.CanEditEmployees)]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventDto>> Create(
        [FromBody] CreateEventDto dto,
        CancellationToken cancellationToken)
    {
        var currentUser = User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";

        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            Titel = dto.Titel,
            Beschrijving = dto.Beschrijving,
            Datum = dto.Datum,
            Type = dto.Type,
            Status = EventStatus.Concept,
            FilterCriteria = dto.FilterCriteria != null
                ? JsonSerializer.Serialize(dto.FilterCriteria, JsonOptions)
                : null,
            DistributieGroepId = dto.DistributieGroepId,
            AangemaaktDoor = currentUser,
            AangemaaktOp = DateTime.UtcNow
        };

        // Bepaal ontvangers op basis van filters
        var ontvangers = await GetOntvangers(dto.FilterCriteria, dto.DistributieGroepId, cancellationToken);

        foreach (var ontvanger in ontvangers)
        {
            eventEntity.Deelnemers.Add(new EventParticipant
            {
                EventId = eventEntity.Id,
                EmployeeId = ontvanger.Id,
                ToegevoegdOp = DateTime.UtcNow
            });
        }

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Evenement '{Titel}' aangemaakt door {User} met {Aantal} ontvangers",
            eventEntity.Titel, currentUser, eventEntity.Deelnemers.Count);

        // Reload with includes
        eventEntity = await _context.Events
            .Include(e => e.DistributieGroep)
            .Include(e => e.Deelnemers)
            .FirstAsync(e => e.Id == eventEntity.Id, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = eventEntity.Id }, MapToDto(eventEntity));
    }

    /// <summary>
    /// Werk een evenement bij.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyNames.CanEditEmployees)]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventDto>> Update(
        Guid id,
        [FromBody] UpdateEventDto dto,
        CancellationToken cancellationToken)
    {
        var eventEntity = await _context.Events
            .Include(e => e.Deelnemers)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (eventEntity == null)
        {
            return NotFound(new { message = $"Evenement met ID {id} niet gevonden." });
        }

        if (eventEntity.Status != EventStatus.Concept)
        {
            return BadRequest(new { message = "Alleen concept evenementen kunnen worden gewijzigd." });
        }

        // Update velden
        if (dto.Titel != null) eventEntity.Titel = dto.Titel;
        if (dto.Beschrijving != null) eventEntity.Beschrijving = dto.Beschrijving;
        if (dto.Datum.HasValue) eventEntity.Datum = dto.Datum.Value;
        if (dto.Type.HasValue) eventEntity.Type = dto.Type.Value;

        // Update filters en herbereken ontvangers
        if (dto.FilterCriteria != null || dto.DistributieGroepId.HasValue)
        {
            eventEntity.FilterCriteria = dto.FilterCriteria != null
                ? JsonSerializer.Serialize(dto.FilterCriteria, JsonOptions)
                : eventEntity.FilterCriteria;
            eventEntity.DistributieGroepId = dto.DistributieGroepId ?? eventEntity.DistributieGroepId;

            // Verwijder bestaande deelnemers en herbereken
            _context.EventParticipants.RemoveRange(eventEntity.Deelnemers);

            var filterCriteria = dto.FilterCriteria ?? DeserializeFilterCriteria(eventEntity.FilterCriteria);
            var ontvangers = await GetOntvangers(filterCriteria, eventEntity.DistributieGroepId, cancellationToken);

            foreach (var ontvanger in ontvangers)
            {
                eventEntity.Deelnemers.Add(new EventParticipant
                {
                    EventId = eventEntity.Id,
                    EmployeeId = ontvanger.Id,
                    ToegevoegdOp = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Reload with includes
        eventEntity = await _context.Events
            .Include(e => e.DistributieGroep)
            .Include(e => e.Deelnemers)
            .FirstAsync(e => e.Id == id, cancellationToken);

        return Ok(MapToDto(eventEntity));
    }

    /// <summary>
    /// Verstuur een evenement (markeer als verstuurd).
    /// </summary>
    [HttpPost("{id:guid}/versturen")]
    [Authorize(Policy = PolicyNames.CanEditEmployees)]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventDto>> Versturen(Guid id, CancellationToken cancellationToken)
    {
        var currentUser = User.Identity?.Name ?? User.Claims
            .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";

        var eventEntity = await _context.Events
            .Include(e => e.DistributieGroep)
            .Include(e => e.Deelnemers)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (eventEntity == null)
        {
            return NotFound(new { message = $"Evenement met ID {id} niet gevonden." });
        }

        if (eventEntity.Status != EventStatus.Concept)
        {
            return BadRequest(new { message = "Alleen concept evenementen kunnen worden verstuurd." });
        }

        if (!eventEntity.Deelnemers.Any())
        {
            return BadRequest(new { message = "Evenement heeft geen ontvangers." });
        }

        eventEntity.Status = EventStatus.Verstuurd;
        eventEntity.VerstuurdOp = DateTime.UtcNow;
        eventEntity.VerstuurdDoor = currentUser;

        // Markeer alle emails als verstuurd
        foreach (var deelnemer in eventEntity.Deelnemers)
        {
            deelnemer.EmailVerstuurd = true;
            deelnemer.EmailVerstuurdOp = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Evenement '{Titel}' verstuurd door {User} naar {Aantal} ontvangers",
            eventEntity.Titel, currentUser, eventEntity.Deelnemers.Count);

        return Ok(MapToDto(eventEntity));
    }

    /// <summary>
    /// Annuleer een evenement.
    /// </summary>
    [HttpPost("{id:guid}/annuleren")]
    [Authorize(Policy = PolicyNames.CanEditEmployees)]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> Annuleren(Guid id, CancellationToken cancellationToken)
    {
        var eventEntity = await _context.Events
            .Include(e => e.DistributieGroep)
            .Include(e => e.Deelnemers)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (eventEntity == null)
        {
            return NotFound(new { message = $"Evenement met ID {id} niet gevonden." });
        }

        eventEntity.Status = EventStatus.Geannuleerd;
        eventEntity.GeannuleerdOp = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(eventEntity));
    }

    /// <summary>
    /// Verwijder een evenement.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyNames.CanDeleteEmployees)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var eventEntity = await _context.Events.FindAsync([id], cancellationToken);

        if (eventEntity == null)
        {
            return NotFound(new { message = $"Evenement met ID {id} niet gevonden." });
        }

        _context.Events.Remove(eventEntity);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Preview van ontvangers op basis van filters.
    /// </summary>
    [HttpPost("preview-ontvangers")]
    [ProducesResponseType(typeof(EventRecipientsPreviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EventRecipientsPreviewDto>> PreviewOntvangers(
        [FromBody] EventFilterCriteria filters,
        [FromQuery] Guid? distributieGroepId = null,
        CancellationToken cancellationToken = default)
    {
        var ontvangers = await GetOntvangers(filters, distributieGroepId, cancellationToken);

        var preview = new EventRecipientsPreviewDto(
            TotaalAantal: ontvangers.Count,
            VoorbeeldOntvangers: ontvangers.Take(10).Select(e => new EventParticipantDto(
                e.Id,
                e.DisplayName,
                e.Email,
                e.JobTitle,
                e.Department,
                false,
                null
            ))
        );

        return Ok(preview);
    }

    private async Task<List<Employee>> GetOntvangers(
        EventFilterCriteria? filters,
        Guid? distributieGroepId,
        CancellationToken cancellationToken)
    {
        // Als een distributiegroep is geselecteerd, gebruik die leden
        if (distributieGroepId.HasValue)
        {
            return await _context.EmployeeGroupMemberships
                .Where(m => m.DistributionGroupId == distributieGroepId.Value && m.IsActief)
                .Include(m => m.Employee)
                .Select(m => m.Employee)
                .Where(e => e.IsActive)
                .ToListAsync(cancellationToken);
        }

        // Anders, filter op basis van criteria
        var query = _context.Employees.AsQueryable();

        if (filters?.AlleenActief ?? true)
        {
            query = query.Where(e => e.IsActive);
        }

        if (filters?.EmployeeTypes?.Any() == true)
        {
            query = query.Where(e => filters.EmployeeTypes.Contains(e.EmployeeType));
        }

        if (filters?.ArbeidsRegimes?.Any() == true)
        {
            query = query.Where(e => filters.ArbeidsRegimes.Contains(e.ArbeidsRegime));
        }

        // Sectoren filter: filter op basis van DienstId en de bovenliggende sector
        if (filters?.Sectoren?.Any() == true)
        {
            var sectorIds = await _context.DistributionGroups
                .Where(g => filters.Sectoren.Contains(g.DisplayName) && g.Niveau == GroepNiveau.Sector)
                .Select(g => g.Id)
                .ToListAsync(cancellationToken);

            var dienstIdsInSectoren = await _context.DistributionGroups
                .Where(g => g.BovenliggendeGroepId.HasValue && sectorIds.Contains(g.BovenliggendeGroepId.Value))
                .Select(g => g.Id)
                .ToListAsync(cancellationToken);

            query = query.Where(e => e.DienstId.HasValue && dienstIdsInSectoren.Contains(e.DienstId.Value));
        }

        return await query.ToListAsync(cancellationToken);
    }

    private static EventFilterCriteria? DeserializeFilterCriteria(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        return JsonSerializer.Deserialize<EventFilterCriteria>(json, JsonOptions);
    }

    private static EventDto MapToDto(Event e)
    {
        return new EventDto(
            e.Id,
            e.Titel,
            e.Beschrijving,
            e.Datum,
            e.Type.ToString(),
            e.Status.ToString(),
            DeserializeFilterCriteria(e.FilterCriteria),
            e.DistributieGroepId,
            e.DistributieGroep?.DisplayName,
            e.Deelnemers.Count,
            e.AangemaaktDoor,
            e.AangemaaktOp,
            e.VerstuurdOp,
            e.VerstuurdDoor
        );
    }

    private static EventDetailDto MapToDetailDto(Event e)
    {
        return new EventDetailDto(
            e.Id,
            e.Titel,
            e.Beschrijving,
            e.Datum,
            e.Type.ToString(),
            e.Status.ToString(),
            DeserializeFilterCriteria(e.FilterCriteria),
            e.DistributieGroepId,
            e.DistributieGroep?.DisplayName,
            e.Deelnemers.Select(p => new EventParticipantDto(
                p.EmployeeId,
                p.Employee.DisplayName,
                p.Employee.Email,
                p.Employee.JobTitle,
                p.Employee.Department,
                p.EmailVerstuurd,
                p.EmailVerstuurdOp
            )),
            e.AangemaaktDoor,
            e.AangemaaktOp,
            e.VerstuurdOp,
            e.VerstuurdDoor
        );
    }
}
