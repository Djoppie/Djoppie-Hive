using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using DjoppieHive.Core.Interfaces;
using DjoppieHive.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieHive.Infrastructure.Services;

/// <summary>
/// Service voor het berekenen van dashboard statistieken.
/// </summary>
public class StatisticsService : IStatisticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StatisticsService> _logger;

    public StatisticsService(
        ApplicationDbContext context,
        ILogger<StatisticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DashboardStatisticsDto> GetDashboardStatisticsAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Dashboard statistieken ophalen");

        var stats = new DashboardStatisticsDto();

        // Employee counts
        var employees = await _context.Employees
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        stats.TotaalMedewerkers = employees.Count;
        stats.ActiefPersoneel = employees.Count(e => e.IsActive && e.EmployeeType == EmployeeType.Personeel);
        stats.InactiefPersoneel = employees.Count(e => !e.IsActive);
        stats.Vrijwilligers = employees.Count(e => e.EmployeeType == EmployeeType.Vrijwilliger);
        stats.Interimmers = employees.Count(e => e.EmployeeType == EmployeeType.Interim);
        stats.Externen = employees.Count(e => e.EmployeeType == EmployeeType.Extern);
        stats.Stagiairs = employees.Count(e => e.EmployeeType == EmployeeType.Stagiair);

        // Data source
        stats.VanuitAzure = employees.Count(e => e.Bron == GegevensBron.AzureAD);
        stats.HandmatigToegevoegd = employees.Count(e => e.Bron == GegevensBron.Handmatig);

        // Arbeidsregime
        stats.Voltijds = employees.Count(e => e.ArbeidsRegime == ArbeidsRegime.Voltijds);
        stats.Deeltijds = employees.Count(e => e.ArbeidsRegime == ArbeidsRegime.Deeltijds);
        stats.VrijwilligersRegime = employees.Count(e => e.ArbeidsRegime == ArbeidsRegime.Vrijwilliger);

        // Validation requests
        stats.OpenValidaties = await _context.ValidatieVerzoeken
            .CountAsync(v => v.Status == ValidatieVerzoekStatus.InAfwachting ||
                            v.Status == ValidatieVerzoekStatus.InBehandeling,
                       cancellationToken);

        // Last sync info
        var laatsteSync = await _context.SyncLogboeken
            .OrderByDescending(s => s.GeStartOp)
            .FirstOrDefaultAsync(cancellationToken);

        if (laatsteSync != null)
        {
            stats.LaatseSyncOp = laatsteSync.VoltooidOp ?? laatsteSync.GeStartOp;
            stats.LaatseSyncStatus = laatsteSync.Status.ToString();
        }

        stats.TotaalSyncs = await _context.SyncLogboeken.CountAsync(cancellationToken);

        // Distribution groups
        var groups = await _context.DistributionGroups
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        stats.TotaalGroepen = groups.Count;
        stats.TotaalSectoren = groups.Count(g => g.Niveau == GroepNiveau.Sector);
        stats.TotaalDiensten = groups.Count(g => g.Niveau == GroepNiveau.Dienst);

        // Per sector statistics
        var sectoren = groups.Where(g => g.Niveau == GroepNiveau.Sector).ToList();
        foreach (var sector in sectoren)
        {
            var dienstenInSector = groups
                .Where(g => g.BovenliggendeGroepId == sector.Id)
                .ToList();

            var dienstIds = dienstenInSector.Select(d => d.Id).ToHashSet();
            var medewerkersInSector = employees
                .Count(e => e.DienstId.HasValue && dienstIds.Contains(e.DienstId.Value));

            stats.PerSector.Add(new SectorStatistiekDto
            {
                SectorNaam = sector.DisplayName.Replace("MG-SECTOR-", ""),
                AantalMedewerkers = medewerkersInSector,
                AantalDiensten = dienstenInSector.Count
            });
        }

        // Sort sectors by employee count
        stats.PerSector = stats.PerSector
            .OrderByDescending(s => s.AantalMedewerkers)
            .ToList();

        // VOG statistics for volunteers
        var vrijwilligers = await _context.Employees
            .Include(e => e.VrijwilligerDetails)
            .Where(e => e.EmployeeType == EmployeeType.Vrijwilliger)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var today = DateTime.Today;
        var threeMonthsFromNow = today.AddMonths(3);

        stats.VogStatistieken.TotaalVrijwilligers = vrijwilligers.Count;

        foreach (var v in vrijwilligers)
        {
            if (v.VrijwilligerDetails?.VogGeldigTot == null)
            {
                stats.VogStatistieken.ZonderVog++;
            }
            else
            {
                var geldigTot = v.VrijwilligerDetails.VogGeldigTot.Value;
                if (geldigTot < today)
                {
                    stats.VogStatistieken.VogVerlopen++;
                }
                else if (geldigTot <= threeMonthsFromNow)
                {
                    stats.VogStatistieken.VogVerlooptBinnenkort++;
                }
                else
                {
                    stats.VogStatistieken.MetGeldigeVog++;
                }
            }
        }

        _logger.LogInformation(
            "Dashboard statistieken: {Total} medewerkers, {Active} actief, {Validators} openstaande validaties",
            stats.TotaalMedewerkers, stats.ActiefPersoneel, stats.OpenValidaties);

        return stats;
    }
}
