using DjoppieHive.Core.DTOs;

namespace DjoppieHive.Core.Interfaces;

/// <summary>
/// Service interface voor het Hybrid Groups System.
/// Combineert Exchange, Dynamic en Local groepen in één uniforme API.
/// </summary>
public interface IUnifiedGroupService
{
    // ============================================
    // UNIFIED OPERATIONS (alle groeptypes)
    // ============================================

    /// <summary>
    /// Haalt alle groepen op uit alle bronnen (Exchange, Dynamic, Local).
    /// </summary>
    Task<IEnumerable<UnifiedGroupDto>> GetAllGroupsAsync(CancellationToken ct = default);

    /// <summary>
    /// Haalt een specifieke groep op met details.
    /// ID formaat: raw GUID voor Exchange, "dynamic:{guid}" of "local:{guid}".
    /// </summary>
    Task<UnifiedGroupDetailDto?> GetGroupByIdAsync(string id, CancellationToken ct = default);

    /// <summary>
    /// Haalt de leden van een groep op.
    /// </summary>
    Task<IEnumerable<EmployeeSummaryDto>> GetGroupMembersAsync(string id, CancellationToken ct = default);

    /// <summary>
    /// Haalt een preview van gecombineerde groepen op (voor meerdere geselecteerde groepen).
    /// </summary>
    Task<GroupsPreviewDto> GetGroupsPreviewAsync(IEnumerable<string> groupIds, CancellationToken ct = default);

    // ============================================
    // DYNAMIC GROUP OPERATIONS
    // ============================================

    /// <summary>
    /// Maakt een nieuwe dynamische groep aan.
    /// </summary>
    Task<UnifiedGroupDto> CreateDynamicGroupAsync(CreateDynamicGroupDto dto, string? createdBy = null, CancellationToken ct = default);

    /// <summary>
    /// Werkt een dynamische groep bij.
    /// </summary>
    Task<UnifiedGroupDto?> UpdateDynamicGroupAsync(Guid id, UpdateDynamicGroupDto dto, CancellationToken ct = default);

    /// <summary>
    /// Verwijdert een dynamische groep (niet toegestaan voor systeemgroepen).
    /// </summary>
    Task<bool> DeleteDynamicGroupAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Evalueert de leden van een dynamische groep opnieuw op basis van de filter criteria.
    /// Retourneert het nieuwe aantal leden.
    /// </summary>
    Task<int> EvaluateDynamicGroupAsync(Guid id, CancellationToken ct = default);

    // ============================================
    // LOCAL GROUP OPERATIONS
    // ============================================

    /// <summary>
    /// Maakt een nieuwe lokale groep aan.
    /// </summary>
    Task<UnifiedGroupDto> CreateLocalGroupAsync(CreateLocalGroupDto dto, string? createdBy = null, CancellationToken ct = default);

    /// <summary>
    /// Werkt een lokale groep bij.
    /// </summary>
    Task<UnifiedGroupDto?> UpdateLocalGroupAsync(Guid id, UpdateLocalGroupDto dto, CancellationToken ct = default);

    /// <summary>
    /// Verwijdert een lokale groep.
    /// </summary>
    Task<bool> DeleteLocalGroupAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Voegt een lid toe aan een lokale groep.
    /// </summary>
    Task<bool> AddMemberToLocalGroupAsync(Guid groupId, Guid employeeId, string? addedBy = null, CancellationToken ct = default);

    /// <summary>
    /// Verwijdert een lid uit een lokale groep.
    /// </summary>
    Task<bool> RemoveMemberFromLocalGroupAsync(Guid groupId, Guid employeeId, CancellationToken ct = default);

    // ============================================
    // EXPORT OPERATIONS
    // ============================================

    /// <summary>
    /// Exporteert e-mailadressen van geselecteerde groepen als CSV string.
    /// </summary>
    Task<string> GetGroupEmailsAsCsvAsync(IEnumerable<string> groupIds, CancellationToken ct = default);

    /// <summary>
    /// Genereert een mailto: link voor de geselecteerde groepen.
    /// </summary>
    Task<EmailExportDto> GetMailtoLinkAsync(IEnumerable<string> groupIds, string? subject = null, string? body = null, CancellationToken ct = default);

    // ============================================
    // SEED OPERATIONS
    // ============================================

    /// <summary>
    /// Initialiseert de voorgedefinieerde dynamische groepen (systeemgroepen).
    /// Wordt aangeroepen bij applicatie startup.
    /// </summary>
    Task SeedPredefinedDynamicGroupsAsync(CancellationToken ct = default);
}
