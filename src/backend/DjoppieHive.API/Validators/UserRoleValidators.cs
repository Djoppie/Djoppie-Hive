using DjoppieHive.Core.DTOs;
using FluentValidation;

namespace DjoppieHive.API.Validators;

/// <summary>
/// Geldige rollen in het systeem.
/// </summary>
public static class ValidRoles
{
    public static readonly string[] All =
    {
        "ict_super_admin",
        "hr_admin",
        "sectormanager",
        "diensthoofd",
        "medewerker"
    };

    public static readonly string[] SectorScoped = { "sectormanager" };
    public static readonly string[] DienstScoped = { "diensthoofd" };
}

/// <summary>
/// Validator voor CreateUserRoleDto.
/// </summary>
public class CreateUserRoleDtoValidator : AbstractValidator<CreateUserRoleDto>
{
    public CreateUserRoleDtoValidator()
    {
        RuleFor(x => x.EntraObjectId)
            .NotEmpty().WithMessage("Entra Object ID is verplicht")
            .MaximumLength(100).WithMessage("Entra Object ID mag maximaal 100 tekens bevatten")
            .Matches(@"^[a-zA-Z0-9\-]+$").WithMessage("Ongeldig Entra Object ID formaat");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-mail is verplicht")
            .EmailAddress().WithMessage("Ongeldig e-mailadres")
            .MaximumLength(256).WithMessage("E-mail mag maximaal 256 tekens bevatten");

        RuleFor(x => x.DisplayName)
            .NotEmpty().WithMessage("Weergavenaam is verplicht")
            .MaximumLength(256).WithMessage("Weergavenaam mag maximaal 256 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Weergavenaam bevat ongeldige tekens");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Rol is verplicht")
            .Must(BeValidRole).WithMessage("Ongeldige rol. Geldige rollen zijn: " + string.Join(", ", ValidRoles.All));

        // Sector is verplicht voor sectormanager
        RuleFor(x => x.SectorId)
            .NotNull().WithMessage("Sector is verplicht voor de rol sectormanager")
            .When(x => ValidRoles.SectorScoped.Contains(x.Role?.ToLowerInvariant()));

        // Dienst is verplicht voor diensthoofd
        RuleFor(x => x.DienstId)
            .NotNull().WithMessage("Dienst is verplicht voor de rol diensthoofd")
            .When(x => ValidRoles.DienstScoped.Contains(x.Role?.ToLowerInvariant()));
    }

    private static bool BeValidRole(string? role)
    {
        return !string.IsNullOrEmpty(role) &&
               ValidRoles.All.Contains(role.ToLowerInvariant());
    }

    private static bool NotContainDangerousCharacters(string? value)
    {
        if (string.IsNullOrEmpty(value)) return true;
        var dangerous = new[] { "<script", "javascript:", "onerror=", "onload=", "<iframe", "vbscript:" };
        return !dangerous.Any(d => value.Contains(d, StringComparison.OrdinalIgnoreCase));
    }
}

/// <summary>
/// Validator voor UpdateUserRoleDto.
/// </summary>
public class UpdateUserRoleDtoValidator : AbstractValidator<UpdateUserRoleDto>
{
    public UpdateUserRoleDtoValidator()
    {
        RuleFor(x => x.Role)
            .Must(BeValidRoleOrNull).WithMessage("Ongeldige rol. Geldige rollen zijn: " + string.Join(", ", ValidRoles.All))
            .When(x => !string.IsNullOrEmpty(x.Role));

        // Als de rol wordt gewijzigd naar sectormanager, moet een sector worden opgegeven
        RuleFor(x => x.SectorId)
            .NotNull().WithMessage("Sector is verplicht bij wijziging naar sectormanager rol")
            .When(x => ValidRoles.SectorScoped.Contains(x.Role?.ToLowerInvariant()));

        // Als de rol wordt gewijzigd naar diensthoofd, moet een dienst worden opgegeven
        RuleFor(x => x.DienstId)
            .NotNull().WithMessage("Dienst is verplicht bij wijziging naar diensthoofd rol")
            .When(x => ValidRoles.DienstScoped.Contains(x.Role?.ToLowerInvariant()));
    }

    private static bool BeValidRoleOrNull(string? role)
    {
        return string.IsNullOrEmpty(role) ||
               ValidRoles.All.Contains(role.ToLowerInvariant());
    }
}
