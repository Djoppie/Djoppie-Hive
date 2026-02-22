using DjoppieHive.Core.Enums;

namespace DjoppieHive.Core.Entities;

/// <summary>
/// Join-entiteit voor Employee en DistributionGroup veel-op-veel relatie.
/// </summary>
public class EmployeeGroupMembership
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public Guid DistributionGroupId { get; set; }
    public DistributionGroup DistributionGroup { get; set; } = null!;

    /// <summary>
    /// Wanneer het lidmaatschap is gestart.
    /// </summary>
    public DateTime ToegevoegdOp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Bron van dit lidmaatschap (Azure AD of Handmatig).
    /// </summary>
    public GegevensBron Bron { get; set; } = GegevensBron.AzureAD;

    /// <summary>
    /// Wanneer het lidmaatschap is verwijderd (soft delete voor validatie).
    /// </summary>
    public DateTime? VerwijderdOp { get; set; }

    /// <summary>
    /// Of dit lidmaatschap actief is.
    /// </summary>
    public bool IsActief { get; set; } = true;
}
