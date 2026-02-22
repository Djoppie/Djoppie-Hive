using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Entities;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service voor het beheren en afhandelen van validatieverzoeken.
/// </summary>
public class ValidatieVerzoekService : IValidatieVerzoekService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ValidatieVerzoekService> _logger;

    public ValidatieVerzoekService(
        ApplicationDbContext context,
        ILogger<ValidatieVerzoekService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ValidatieVerzoekDto>> GetOpenstaandeVerzoekenAsync(
        Guid? groepId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ValidatieVerzoeken
            .Include(v => v.Employee)
            .Include(v => v.DistributionGroup)
            .Where(v => v.Status == ValidatieVerzoekStatus.InAfwachting ||
                        v.Status == ValidatieVerzoekStatus.InBehandeling);

        if (groepId.HasValue)
        {
            query = query.Where(v => v.DistributionGroupId == groepId.Value ||
                                     v.ToegwezenAanGroepId == groepId.Value);
        }

        var verzoeken = await query
            .OrderByDescending(v => v.AangemaaktOp)
            .ToListAsync(cancellationToken);

        return verzoeken.Select(MapToDto);
    }

    public async Task<ValidatieVerzoekDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var verzoek = await _context.ValidatieVerzoeken
            .Include(v => v.Employee)
            .Include(v => v.DistributionGroup)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        return verzoek == null ? null : MapToDto(verzoek);
    }

    public async Task<ValidatieVerzoekDetailDto?> GetDetailByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var verzoek = await _context.ValidatieVerzoeken
            .Include(v => v.Employee)
            .Include(v => v.DistributionGroup)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (verzoek == null)
        {
            return null;
        }

        return new ValidatieVerzoekDetailDto(
            verzoek.Id,
            verzoek.Type.ToString(),
            verzoek.Beschrijving,
            verzoek.EmployeeId,
            verzoek.Employee?.DisplayName,
            verzoek.Employee?.Email,
            verzoek.DistributionGroupId,
            verzoek.DistributionGroup?.DisplayName,
            verzoek.Status.ToString(),
            verzoek.AangemaaktOp,
            verzoek.ToegwezenAanRol,
            verzoek.VorigeWaarde,
            verzoek.NieuweWaarde,
            verzoek.AfgehandeldDoor,
            verzoek.AfgehandeldOp,
            verzoek.AfhandelingNotities,
            verzoek.Afhandeling?.ToString());
    }

    public async Task<bool> HandelAfAsync(
        Guid id,
        ValidatieAfhandeling afhandeling,
        string afgehandeldDoor,
        string? notities = null,
        CancellationToken cancellationToken = default)
    {
        var verzoek = await _context.ValidatieVerzoeken
            .Include(v => v.Employee)
            .Include(v => v.DistributionGroup)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (verzoek == null)
        {
            _logger.LogWarning("Validatieverzoek {Id} niet gevonden", id);
            return false;
        }

        if (verzoek.Status != ValidatieVerzoekStatus.InAfwachting &&
            verzoek.Status != ValidatieVerzoekStatus.InBehandeling)
        {
            _logger.LogWarning(
                "Validatieverzoek {Id} kan niet worden afgehandeld, huidige status: {Status}",
                id, verzoek.Status);
            return false;
        }

        // Verwerk de afhandeling
        switch (afhandeling)
        {
            case ValidatieAfhandeling.BevestigVerwijdering:
                await BevestigVerwijderingAsync(verzoek, cancellationToken);
                verzoek.Status = ValidatieVerzoekStatus.Goedgekeurd;
                break;

            case ValidatieAfhandeling.HandmatigHertoevoegen:
                await HertoevoegenAsync(verzoek, cancellationToken);
                verzoek.Status = ValidatieVerzoekStatus.Goedgekeurd;
                break;

            case ValidatieAfhandeling.Negeren:
                // Geen actie nodig, alleen status bijwerken
                verzoek.Status = ValidatieVerzoekStatus.Afgekeurd;
                break;

            case ValidatieAfhandeling.Escaleren:
                await EscaleerAsync(verzoek, cancellationToken);
                verzoek.Status = ValidatieVerzoekStatus.Geescaleerd;
                break;
        }

        verzoek.Afhandeling = afhandeling;
        verzoek.AfgehandeldDoor = afgehandeldDoor;
        verzoek.AfgehandeldOp = DateTime.UtcNow;
        verzoek.AfhandelingNotities = notities;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Validatieverzoek {Id} afgehandeld door {AfgehandeldDoor} met actie {Afhandeling}",
            id, afgehandeldDoor, afhandeling);

        return true;
    }

    public async Task<int> GetOpenstaandAantalAsync(
        Guid? groepId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ValidatieVerzoeken
            .Where(v => v.Status == ValidatieVerzoekStatus.InAfwachting ||
                        v.Status == ValidatieVerzoekStatus.InBehandeling);

        if (groepId.HasValue)
        {
            query = query.Where(v => v.DistributionGroupId == groepId.Value ||
                                     v.ToegwezenAanGroepId == groepId.Value);
        }

        return await query.CountAsync(cancellationToken);
    }

    private async Task BevestigVerwijderingAsync(
        ValidatieVerzoek verzoek,
        CancellationToken cancellationToken)
    {
        // Bij bevestiging van verwijdering: definitief verwijderen van lidmaatschap
        if (verzoek.Type == ValidatieVerzoekType.LidVerwijderd &&
            verzoek.EmployeeId.HasValue &&
            verzoek.DistributionGroupId.HasValue)
        {
            var lidmaatschap = await _context.EmployeeGroupMemberships
                .FirstOrDefaultAsync(m =>
                    m.EmployeeId == verzoek.EmployeeId.Value &&
                    m.DistributionGroupId == verzoek.DistributionGroupId.Value,
                    cancellationToken);

            if (lidmaatschap != null)
            {
                _context.EmployeeGroupMemberships.Remove(lidmaatschap);
                _logger.LogInformation(
                    "Lidmaatschap definitief verwijderd: {MedewerkerNaam} uit {GroepNaam}",
                    verzoek.Employee?.DisplayName,
                    verzoek.DistributionGroup?.DisplayName);
            }
        }
    }

    private async Task HertoevoegenAsync(
        ValidatieVerzoek verzoek,
        CancellationToken cancellationToken)
    {
        // Bij hertoevoegen: lidmaatschap weer activeren als handmatig
        if (verzoek.Type == ValidatieVerzoekType.LidVerwijderd &&
            verzoek.EmployeeId.HasValue &&
            verzoek.DistributionGroupId.HasValue)
        {
            var lidmaatschap = await _context.EmployeeGroupMemberships
                .FirstOrDefaultAsync(m =>
                    m.EmployeeId == verzoek.EmployeeId.Value &&
                    m.DistributionGroupId == verzoek.DistributionGroupId.Value,
                    cancellationToken);

            if (lidmaatschap != null)
            {
                lidmaatschap.IsActief = true;
                lidmaatschap.VerwijderdOp = null;
                lidmaatschap.Bron = GegevensBron.Handmatig; // Nu handmatig beheerd
                _logger.LogInformation(
                    "Lidmaatschap hersteld als handmatig: {MedewerkerNaam} in {GroepNaam}",
                    verzoek.Employee?.DisplayName,
                    verzoek.DistributionGroup?.DisplayName);
            }
            else
            {
                // Lidmaatschap was al definitief verwijderd, maak nieuwe aan
                var nieuwLidmaatschap = new EmployeeGroupMembership
                {
                    EmployeeId = verzoek.EmployeeId.Value,
                    DistributionGroupId = verzoek.DistributionGroupId.Value,
                    Bron = GegevensBron.Handmatig,
                    ToegevoegdOp = DateTime.UtcNow,
                    IsActief = true
                };
                _context.EmployeeGroupMemberships.Add(nieuwLidmaatschap);
                _logger.LogInformation(
                    "Nieuw handmatig lidmaatschap aangemaakt: {MedewerkerNaam} in {GroepNaam}",
                    verzoek.Employee?.DisplayName,
                    verzoek.DistributionGroup?.DisplayName);
            }
        }
    }

    private Task EscaleerAsync(
        ValidatieVerzoek verzoek,
        CancellationToken cancellationToken)
    {
        // Bij escalatie: wijzig toegewezen rol naar sectormanager
        verzoek.ToegwezenAanRol = "sectormanager";
        _logger.LogInformation(
            "Validatieverzoek {Id} geescaleerd naar sectormanager",
            verzoek.Id);

        return Task.CompletedTask;
    }

    private static ValidatieVerzoekDto MapToDto(ValidatieVerzoek verzoek)
    {
        return new ValidatieVerzoekDto(
            verzoek.Id,
            verzoek.Type.ToString(),
            verzoek.Beschrijving,
            verzoek.Employee?.DisplayName,
            verzoek.Employee?.Email,
            verzoek.DistributionGroup?.DisplayName,
            verzoek.Status.ToString(),
            verzoek.AangemaaktOp,
            verzoek.ToegwezenAanRol,
            verzoek.VorigeWaarde);
    }
}
