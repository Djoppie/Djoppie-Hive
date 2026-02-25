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
/// Service voor het Hybrid Groups System.
/// Combineert Exchange groepen (via IDistributionGroupService), Dynamic en Local groepen.
/// </summary>
public class UnifiedGroupService : IUnifiedGroupService
{
    private readonly ApplicationDbContext _context;
    private readonly IDistributionGroupService _distributionGroupService;
    private readonly ILogger<UnifiedGroupService> _logger;

    private const string DynamicPrefix = "dynamic:";
    private const string LocalPrefix = "local:";

    public UnifiedGroupService(
        ApplicationDbContext context,
        IDistributionGroupService distributionGroupService,
        ILogger<UnifiedGroupService> logger)
    {
        _context = context;
        _distributionGroupService = distributionGroupService;
        _logger = logger;
    }

    #region Unified Operations

    public async Task<IEnumerable<UnifiedGroupDto>> GetAllGroupsAsync(CancellationToken ct = default)
    {
        var result = new List<UnifiedGroupDto>();

        // 1. Exchange groepen (via Graph API)
        try
        {
            var exchangeGroups = await _distributionGroupService.GetAllGroupsAsync(ct);
            foreach (var g in exchangeGroups)
            {
                result.Add(new UnifiedGroupDto(
                    g.Id,
                    g.DisplayName,
                    g.Description,
                    g.Email,
                    g.MemberCount,
                    Source: "Exchange",
                    IsReadOnly: true,
                    IsSystemGroup: false,
                    LastEvaluatedAt: null
                ));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch Exchange groups, continuing with local groups only");
        }

        // 2. Dynamic groepen (uit database)
        var dynamicGroups = await _context.DynamicGroups
            .OrderBy(g => g.DisplayName)
            .ToListAsync(ct);

        foreach (var g in dynamicGroups)
        {
            result.Add(new UnifiedGroupDto(
                $"{DynamicPrefix}{g.Id}",
                g.DisplayName,
                g.Description,
                g.Email,
                g.CachedMemberCount,
                Source: "Dynamic",
                IsReadOnly: false,
                IsSystemGroup: g.IsSystemGroup,
                LastEvaluatedAt: g.LastEvaluatedAt
            ));
        }

        // 3. Local groepen (uit database)
        var localGroups = await _context.LocalGroups
            .Include(g => g.Members)
            .OrderBy(g => g.DisplayName)
            .ToListAsync(ct);

        foreach (var g in localGroups)
        {
            result.Add(new UnifiedGroupDto(
                $"{LocalPrefix}{g.Id}",
                g.DisplayName,
                g.Description,
                g.Email,
                g.Members.Count,
                Source: "Local",
                IsReadOnly: false,
                IsSystemGroup: false,
                LastEvaluatedAt: null
            ));
        }

        return result.OrderBy(g => g.DisplayName);
    }

    public async Task<UnifiedGroupDetailDto?> GetGroupByIdAsync(string id, CancellationToken ct = default)
    {
        var (source, guid) = ParseGroupId(id);

        return source switch
        {
            "Exchange" => await GetExchangeGroupDetailAsync(id, ct),
            "Dynamic" => await GetDynamicGroupDetailAsync(guid!.Value, ct),
            "Local" => await GetLocalGroupDetailAsync(guid!.Value, ct),
            _ => null
        };
    }

    public async Task<IEnumerable<EmployeeSummaryDto>> GetGroupMembersAsync(string id, CancellationToken ct = default)
    {
        var (source, guid) = ParseGroupId(id);

        return source switch
        {
            "Exchange" => await _distributionGroupService.GetGroupMembersAsync(id, ct),
            "Dynamic" => await EvaluateDynamicGroupMembersAsync(guid!.Value, ct),
            "Local" => await GetLocalGroupMembersAsync(guid!.Value, ct),
            _ => Enumerable.Empty<EmployeeSummaryDto>()
        };
    }

    public async Task<GroupsPreviewDto> GetGroupsPreviewAsync(IEnumerable<string> groupIds, CancellationToken ct = default)
    {
        var allMembers = new Dictionary<string, EmployeeSummaryDto>();
        var breakdown = new Dictionary<string, int>();

        foreach (var groupId in groupIds)
        {
            var members = await GetGroupMembersAsync(groupId, ct);
            var memberList = members.ToList();
            breakdown[groupId] = memberList.Count;

            foreach (var member in memberList)
            {
                allMembers.TryAdd(member.Id, member);
            }
        }

        return new GroupsPreviewDto(
            TotalUniqueMembers: allMembers.Count,
            GroupBreakdown: breakdown,
            SampleMembers: allMembers.Values.Take(10).ToList()
        );
    }

    #endregion

    #region Dynamic Group Operations

    public async Task<UnifiedGroupDto> CreateDynamicGroupAsync(CreateDynamicGroupDto dto, string? createdBy = null, CancellationToken ct = default)
    {
        var group = new DynamicGroup
        {
            Id = Guid.NewGuid(),
            DisplayName = dto.DisplayName,
            Description = dto.Description,
            Email = dto.Email,
            FilterCriteria = JsonSerializer.Serialize(dto.FilterCriteria),
            IsSystemGroup = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.DynamicGroups.Add(group);
        await _context.SaveChangesAsync(ct);

        // Evaluate members immediately
        var memberCount = await EvaluateDynamicGroupAsync(group.Id, ct);

        return new UnifiedGroupDto(
            $"{DynamicPrefix}{group.Id}",
            group.DisplayName,
            group.Description,
            group.Email,
            memberCount,
            Source: "Dynamic",
            IsReadOnly: false,
            IsSystemGroup: false,
            LastEvaluatedAt: group.LastEvaluatedAt
        );
    }

    public async Task<UnifiedGroupDto?> UpdateDynamicGroupAsync(Guid id, UpdateDynamicGroupDto dto, CancellationToken ct = default)
    {
        var group = await _context.DynamicGroups.FindAsync(new object[] { id }, ct);
        if (group == null) return null;

        if (dto.DisplayName != null) group.DisplayName = dto.DisplayName;
        if (dto.Description != null) group.Description = dto.Description;
        if (dto.Email != null) group.Email = dto.Email;
        if (dto.FilterCriteria != null) group.FilterCriteria = JsonSerializer.Serialize(dto.FilterCriteria);
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        // Re-evaluate if filter changed
        if (dto.FilterCriteria != null)
        {
            await EvaluateDynamicGroupAsync(id, ct);
        }

        return new UnifiedGroupDto(
            $"{DynamicPrefix}{group.Id}",
            group.DisplayName,
            group.Description,
            group.Email,
            group.CachedMemberCount,
            Source: "Dynamic",
            IsReadOnly: false,
            IsSystemGroup: group.IsSystemGroup,
            LastEvaluatedAt: group.LastEvaluatedAt
        );
    }

    public async Task<bool> DeleteDynamicGroupAsync(Guid id, CancellationToken ct = default)
    {
        var group = await _context.DynamicGroups.FindAsync(new object[] { id }, ct);
        if (group == null) return false;

        if (group.IsSystemGroup)
        {
            _logger.LogWarning("Attempt to delete system group {GroupId} ({GroupName})", id, group.DisplayName);
            return false;
        }

        _context.DynamicGroups.Remove(group);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> EvaluateDynamicGroupAsync(Guid id, CancellationToken ct = default)
    {
        var group = await _context.DynamicGroups.FindAsync(new object[] { id }, ct);
        if (group == null) return 0;

        var members = await EvaluateDynamicGroupMembersAsync(id, ct);
        var count = members.Count();

        group.CachedMemberCount = count;
        group.LastEvaluatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return count;
    }

    private async Task<IEnumerable<EmployeeSummaryDto>> EvaluateDynamicGroupMembersAsync(Guid id, CancellationToken ct)
    {
        var group = await _context.DynamicGroups.FindAsync(new object[] { id }, ct);
        if (group == null) return Enumerable.Empty<EmployeeSummaryDto>();

        var criteria = JsonSerializer.Deserialize<DynamicGroupFilterCriteria>(group.FilterCriteria)
                       ?? new DynamicGroupFilterCriteria();

        var query = _context.Employees
            .Include(e => e.Dienst)
            .AsQueryable();

        // Filter: alleen actief
        if (criteria.AlleenActief ?? true)
        {
            query = query.Where(e => e.IsActive);
        }

        // Filter: employee types
        if (criteria.EmployeeTypes?.Any() == true)
        {
            var types = criteria.EmployeeTypes
                .Select(t => Enum.TryParse<EmployeeType>(t, true, out var et) ? et : (EmployeeType?)null)
                .Where(t => t.HasValue)
                .Select(t => t!.Value)
                .ToList();

            if (types.Any())
            {
                query = query.Where(e => types.Contains(e.EmployeeType));
            }
        }

        // Filter: arbeidsregimes
        if (criteria.ArbeidsRegimes?.Any() == true)
        {
            var regimes = criteria.ArbeidsRegimes
                .Select(r => Enum.TryParse<ArbeidsRegime>(r, true, out var ar) ? ar : (ArbeidsRegime?)null)
                .Where(r => r.HasValue)
                .Select(r => r!.Value)
                .ToList();

            if (regimes.Any())
            {
                query = query.Where(e => regimes.Contains(e.ArbeidsRegime));
            }
        }

        // Filter: dienst IDs
        if (criteria.DienstIds?.Any() == true)
        {
            var dienstGuids = criteria.DienstIds
                .Select(d => Guid.TryParse(d, out var g) ? g : (Guid?)null)
                .Where(g => g.HasValue)
                .Select(g => g!.Value)
                .ToList();

            if (dienstGuids.Any())
            {
                query = query.Where(e => e.DienstId.HasValue && dienstGuids.Contains(e.DienstId.Value));
            }
        }

        // Filter: sector IDs (via dienst.BovenliggendeGroepId)
        if (criteria.SectorIds?.Any() == true)
        {
            var sectorGuids = criteria.SectorIds
                .Select(s => Guid.TryParse(s, out var g) ? g : (Guid?)null)
                .Where(g => g.HasValue)
                .Select(g => g!.Value)
                .ToList();

            if (sectorGuids.Any())
            {
                query = query.Where(e => e.Dienst != null &&
                                         e.Dienst.BovenliggendeGroepId.HasValue &&
                                         sectorGuids.Contains(e.Dienst.BovenliggendeGroepId.Value));
            }
        }

        var employees = await query
            .OrderBy(e => e.DisplayName)
            .Select(e => new EmployeeSummaryDto(
                e.Id.ToString(),
                e.DisplayName,
                e.Email,
                e.JobTitle,
                e.EmployeeType.ToString(),
                e.ArbeidsRegime.ToString(),
                e.IsActive,
                e.Dienst != null ? e.Dienst.DisplayName : null
            ))
            .ToListAsync(ct);

        return employees;
    }

    private async Task<UnifiedGroupDetailDto?> GetDynamicGroupDetailAsync(Guid id, CancellationToken ct)
    {
        var group = await _context.DynamicGroups.FindAsync(new object[] { id }, ct);
        if (group == null) return null;

        var criteria = JsonSerializer.Deserialize<DynamicGroupFilterCriteria>(group.FilterCriteria);
        var members = (await EvaluateDynamicGroupMembersAsync(id, ct)).ToList();

        return new UnifiedGroupDetailDto(
            $"{DynamicPrefix}{group.Id}",
            group.DisplayName,
            group.Description,
            group.Email,
            members.Count,
            Source: "Dynamic",
            IsReadOnly: false,
            IsSystemGroup: group.IsSystemGroup,
            FilterCriteria: criteria,
            Members: members,
            LastEvaluatedAt: group.LastEvaluatedAt,
            CreatedAt: group.CreatedAt,
            CreatedBy: group.CreatedBy
        );
    }

    #endregion

    #region Local Group Operations

    public async Task<UnifiedGroupDto> CreateLocalGroupAsync(CreateLocalGroupDto dto, string? createdBy = null, CancellationToken ct = default)
    {
        var group = new LocalGroup
        {
            Id = Guid.NewGuid(),
            DisplayName = dto.DisplayName,
            Description = dto.Description,
            Email = dto.Email,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.LocalGroups.Add(group);
        await _context.SaveChangesAsync(ct);

        // Add initial members if provided
        if (dto.InitialMemberIds?.Any() == true)
        {
            foreach (var employeeId in dto.InitialMemberIds)
            {
                await AddMemberToLocalGroupAsync(group.Id, employeeId, createdBy, ct);
            }
        }

        var memberCount = dto.InitialMemberIds?.Count ?? 0;

        return new UnifiedGroupDto(
            $"{LocalPrefix}{group.Id}",
            group.DisplayName,
            group.Description,
            group.Email,
            memberCount,
            Source: "Local",
            IsReadOnly: false,
            IsSystemGroup: false,
            LastEvaluatedAt: null
        );
    }

    public async Task<UnifiedGroupDto?> UpdateLocalGroupAsync(Guid id, UpdateLocalGroupDto dto, CancellationToken ct = default)
    {
        var group = await _context.LocalGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id, ct);

        if (group == null) return null;

        if (dto.DisplayName != null) group.DisplayName = dto.DisplayName;
        if (dto.Description != null) group.Description = dto.Description;
        if (dto.Email != null) group.Email = dto.Email;
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return new UnifiedGroupDto(
            $"{LocalPrefix}{group.Id}",
            group.DisplayName,
            group.Description,
            group.Email,
            group.Members.Count,
            Source: "Local",
            IsReadOnly: false,
            IsSystemGroup: false,
            LastEvaluatedAt: null
        );
    }

    public async Task<bool> DeleteLocalGroupAsync(Guid id, CancellationToken ct = default)
    {
        var group = await _context.LocalGroups.FindAsync(new object[] { id }, ct);
        if (group == null) return false;

        _context.LocalGroups.Remove(group);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> AddMemberToLocalGroupAsync(Guid groupId, Guid employeeId, string? addedBy = null, CancellationToken ct = default)
    {
        // Check if group exists
        var groupExists = await _context.LocalGroups.AnyAsync(g => g.Id == groupId, ct);
        if (!groupExists) return false;

        // Check if employee exists
        var employeeExists = await _context.Employees.AnyAsync(e => e.Id == employeeId, ct);
        if (!employeeExists) return false;

        // Check if already a member
        var alreadyMember = await _context.LocalGroupMembers
            .AnyAsync(m => m.LocalGroupId == groupId && m.EmployeeId == employeeId, ct);
        if (alreadyMember) return true; // Already a member, consider it success

        var membership = new LocalGroupMember
        {
            LocalGroupId = groupId,
            EmployeeId = employeeId,
            AddedAt = DateTime.UtcNow,
            AddedBy = addedBy
        };

        _context.LocalGroupMembers.Add(membership);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RemoveMemberFromLocalGroupAsync(Guid groupId, Guid employeeId, CancellationToken ct = default)
    {
        var membership = await _context.LocalGroupMembers
            .FirstOrDefaultAsync(m => m.LocalGroupId == groupId && m.EmployeeId == employeeId, ct);

        if (membership == null) return false;

        _context.LocalGroupMembers.Remove(membership);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    private async Task<IEnumerable<EmployeeSummaryDto>> GetLocalGroupMembersAsync(Guid groupId, CancellationToken ct)
    {
        var members = await _context.LocalGroupMembers
            .Where(m => m.LocalGroupId == groupId)
            .Include(m => m.Employee)
                .ThenInclude(e => e.Dienst)
            .Select(m => new EmployeeSummaryDto(
                m.Employee.Id.ToString(),
                m.Employee.DisplayName,
                m.Employee.Email,
                m.Employee.JobTitle,
                m.Employee.EmployeeType.ToString(),
                m.Employee.ArbeidsRegime.ToString(),
                m.Employee.IsActive,
                m.Employee.Dienst != null ? m.Employee.Dienst.DisplayName : null
            ))
            .OrderBy(e => e.DisplayName)
            .ToListAsync(ct);

        return members;
    }

    private async Task<UnifiedGroupDetailDto?> GetLocalGroupDetailAsync(Guid id, CancellationToken ct)
    {
        var group = await _context.LocalGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id, ct);

        if (group == null) return null;

        var members = (await GetLocalGroupMembersAsync(id, ct)).ToList();

        return new UnifiedGroupDetailDto(
            $"{LocalPrefix}{group.Id}",
            group.DisplayName,
            group.Description,
            group.Email,
            members.Count,
            Source: "Local",
            IsReadOnly: false,
            IsSystemGroup: false,
            FilterCriteria: null,
            Members: members,
            LastEvaluatedAt: null,
            CreatedAt: group.CreatedAt,
            CreatedBy: group.CreatedBy
        );
    }

    #endregion

    #region Exchange Group Operations (delegated)

    private async Task<UnifiedGroupDetailDto?> GetExchangeGroupDetailAsync(string id, CancellationToken ct)
    {
        var detail = await _distributionGroupService.GetGroupByIdAsync(id, ct);
        if (detail == null) return null;

        return new UnifiedGroupDetailDto(
            detail.Id,
            detail.DisplayName,
            detail.Description,
            detail.Email,
            detail.MemberCount,
            Source: "Exchange",
            IsReadOnly: true,
            IsSystemGroup: false,
            FilterCriteria: null,
            Members: detail.Members,
            LastEvaluatedAt: null,
            CreatedAt: DateTime.MinValue, // Not tracked for Exchange groups
            CreatedBy: null
        );
    }

    #endregion

    #region Export Operations

    public async Task<string> GetGroupEmailsAsCsvAsync(IEnumerable<string> groupIds, CancellationToken ct = default)
    {
        var allEmails = new HashSet<string>();

        foreach (var groupId in groupIds)
        {
            var members = await GetGroupMembersAsync(groupId, ct);
            foreach (var member in members)
            {
                if (!string.IsNullOrWhiteSpace(member.Email))
                {
                    allEmails.Add(member.Email);
                }
            }
        }

        return string.Join("\n", allEmails.OrderBy(e => e));
    }

    public async Task<EmailExportDto> GetMailtoLinkAsync(IEnumerable<string> groupIds, string? subject = null, string? body = null, CancellationToken ct = default)
    {
        var allEmails = new HashSet<string>();

        foreach (var groupId in groupIds)
        {
            var members = await GetGroupMembersAsync(groupId, ct);
            foreach (var member in members)
            {
                if (!string.IsNullOrWhiteSpace(member.Email))
                {
                    allEmails.Add(member.Email);
                }
            }
        }

        var emailList = allEmails.OrderBy(e => e).ToList();
        var emailCount = emailList.Count;

        // Build mailto link
        var mailtoBuilder = new System.Text.StringBuilder("mailto:");

        // Use BCC for privacy (first email goes in To, rest in BCC)
        if (emailList.Any())
        {
            mailtoBuilder.Append(Uri.EscapeDataString(emailList.First()));
            mailtoBuilder.Append('?');

            if (emailList.Count > 1)
            {
                mailtoBuilder.Append("bcc=");
                mailtoBuilder.Append(Uri.EscapeDataString(string.Join(",", emailList.Skip(1))));
                mailtoBuilder.Append('&');
            }
        }
        else
        {
            mailtoBuilder.Append('?');
        }

        if (!string.IsNullOrWhiteSpace(subject))
        {
            mailtoBuilder.Append("subject=");
            mailtoBuilder.Append(Uri.EscapeDataString(subject));
            mailtoBuilder.Append('&');
        }

        if (!string.IsNullOrWhiteSpace(body))
        {
            mailtoBuilder.Append("body=");
            mailtoBuilder.Append(Uri.EscapeDataString(body));
        }

        var mailtoLink = mailtoBuilder.ToString().TrimEnd('&', '?');

        // Check if link is too long (most browsers/mail clients have a ~2000 char limit)
        string? warning = null;
        if (mailtoLink.Length > 2000)
        {
            warning = $"De mailto-link is te lang ({mailtoLink.Length} tekens). Sommige e-mailadressen zijn mogelijk weggelaten. Gebruik de CSV-export voor grote groepen.";
            // Truncate to reasonable length
            mailtoLink = mailtoLink.Substring(0, 2000);
        }

        return new EmailExportDto(mailtoLink, emailCount, warning);
    }

    #endregion

    #region Seed Operations

    public async Task SeedPredefinedDynamicGroupsAsync(CancellationToken ct = default)
    {
        var predefinedGroups = new[]
        {
            new
            {
                DisplayName = "Alle Vrijwilligers",
                Description = "Alle actieve vrijwilligers in het systeem",
                Filter = new DynamicGroupFilterCriteria(
                    EmployeeTypes: new List<string> { "Vrijwilliger" },
                    AlleenActief: true
                )
            },
            new
            {
                DisplayName = "Alle Interimmers",
                Description = "Alle actieve interim-medewerkers",
                Filter = new DynamicGroupFilterCriteria(
                    EmployeeTypes: new List<string> { "Interim" },
                    AlleenActief: true
                )
            },
            new
            {
                DisplayName = "Alle Externen",
                Description = "Alle actieve externe medewerkers",
                Filter = new DynamicGroupFilterCriteria(
                    EmployeeTypes: new List<string> { "Extern" },
                    AlleenActief: true
                )
            },
            new
            {
                DisplayName = "Actief Personeel",
                Description = "Alle actieve personeelsleden (vast)",
                Filter = new DynamicGroupFilterCriteria(
                    EmployeeTypes: new List<string> { "Personeel" },
                    AlleenActief: true
                )
            },
            new
            {
                DisplayName = "Alle Stagiairs",
                Description = "Alle actieve stagiairs en leerlingen",
                Filter = new DynamicGroupFilterCriteria(
                    EmployeeTypes: new List<string> { "Stagiair" },
                    AlleenActief: true
                )
            }
        };

        foreach (var predefined in predefinedGroups)
        {
            // Check if group already exists
            var exists = await _context.DynamicGroups
                .AnyAsync(g => g.DisplayName == predefined.DisplayName && g.IsSystemGroup, ct);

            if (!exists)
            {
                var group = new DynamicGroup
                {
                    Id = Guid.NewGuid(),
                    DisplayName = predefined.DisplayName,
                    Description = predefined.Description,
                    FilterCriteria = JsonSerializer.Serialize(predefined.Filter),
                    IsSystemGroup = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };

                _context.DynamicGroups.Add(group);
                _logger.LogInformation("Seeding predefined dynamic group: {GroupName}", predefined.DisplayName);
            }
        }

        await _context.SaveChangesAsync(ct);

        // Evaluate all dynamic groups
        var dynamicGroups = await _context.DynamicGroups.ToListAsync(ct);
        foreach (var group in dynamicGroups)
        {
            await EvaluateDynamicGroupAsync(group.Id, ct);
        }
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Parseert een groep ID en bepaalt de bron.
    /// </summary>
    /// <returns>Tuple met (source, guid). Voor Exchange groepen is guid null.</returns>
    private static (string source, Guid? guid) ParseGroupId(string id)
    {
        if (id.StartsWith(DynamicPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var guidPart = id.Substring(DynamicPrefix.Length);
            if (Guid.TryParse(guidPart, out var guid))
            {
                return ("Dynamic", guid);
            }
        }
        else if (id.StartsWith(LocalPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var guidPart = id.Substring(LocalPrefix.Length);
            if (Guid.TryParse(guidPart, out var guid))
            {
                return ("Local", guid);
            }
        }

        // Assume Exchange group (raw Entra Object ID)
        return ("Exchange", null);
    }

    #endregion
}
