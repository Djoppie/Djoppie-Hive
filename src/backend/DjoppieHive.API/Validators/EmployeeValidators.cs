using DjoppieHive.Core.DTOs;
using DjoppieHive.Core.Enums;
using FluentValidation;

namespace DjoppieHive.API.Validators;

/// <summary>
/// Validator voor CreateEmployeeDto.
/// </summary>
public class CreateEmployeeDtoValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotEmpty().WithMessage("Weergavenaam is verplicht")
            .MaximumLength(256).WithMessage("Weergavenaam mag maximaal 256 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Weergavenaam bevat ongeldige tekens");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-mail is verplicht")
            .EmailAddress().WithMessage("Ongeldig e-mailadres")
            .MaximumLength(256).WithMessage("E-mail mag maximaal 256 tekens bevatten")
            .Must(BeValidEmailDomain).WithMessage("E-mail moet van een geldig domein zijn");

        RuleFor(x => x.GivenName)
            .MaximumLength(100).WithMessage("Voornaam mag maximaal 100 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Voornaam bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.GivenName));

        RuleFor(x => x.Surname)
            .MaximumLength(100).WithMessage("Achternaam mag maximaal 100 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Achternaam bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.Surname));

        RuleFor(x => x.JobTitle)
            .MaximumLength(200).WithMessage("Functietitel mag maximaal 200 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Functietitel bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.JobTitle));

        RuleFor(x => x.Department)
            .MaximumLength(200).WithMessage("Afdeling mag maximaal 200 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Afdeling bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.Department));

        RuleFor(x => x.MobilePhone)
            .MaximumLength(50).WithMessage("Mobiel nummer mag maximaal 50 tekens bevatten")
            .Matches(@"^[\d\s\+\-\(\)\.]*$").WithMessage("Ongeldig telefoonnummerformaat")
            .When(x => !string.IsNullOrEmpty(x.MobilePhone));

        RuleFor(x => x.Telefoonnummer)
            .MaximumLength(50).WithMessage("Telefoonnummer mag maximaal 50 tekens bevatten")
            .Matches(@"^[\d\s\+\-\(\)\.]*$").WithMessage("Ongeldig telefoonnummerformaat")
            .When(x => !string.IsNullOrEmpty(x.Telefoonnummer));

        RuleFor(x => x.PhotoUrl)
            .MaximumLength(500).WithMessage("Foto URL mag maximaal 500 tekens bevatten")
            .Must(BeValidUrlOrEmpty).WithMessage("Ongeldige URL voor foto")
            .When(x => !string.IsNullOrEmpty(x.PhotoUrl));

        RuleFor(x => x.StartDatum)
            .LessThanOrEqualTo(x => x.EindDatum).WithMessage("Startdatum moet voor of op einddatum liggen")
            .When(x => x.StartDatum.HasValue && x.EindDatum.HasValue);

        RuleFor(x => x.EindDatum)
            .GreaterThanOrEqualTo(x => x.StartDatum).WithMessage("Einddatum moet na of op startdatum liggen")
            .When(x => x.StartDatum.HasValue && x.EindDatum.HasValue);

        // Vrijwilliger validatie
        RuleFor(x => x.VrijwilligerDetails)
            .NotNull().WithMessage("Vrijwilligerdetails zijn verplicht voor vrijwilligers")
            .When(x => x.EmployeeType == EmployeeType.Vrijwilliger);

        RuleFor(x => x.ArbeidsRegime)
            .Equal(ArbeidsRegime.Vrijwilliger).WithMessage("Vrijwilligers moeten arbeidsregime 'Vrijwilliger' hebben")
            .When(x => x.EmployeeType == EmployeeType.Vrijwilliger);
    }

    private static bool NotContainDangerousCharacters(string? value)
    {
        if (string.IsNullOrEmpty(value)) return true;

        // Prevent script injection
        var dangerous = new[] { "<script", "javascript:", "onerror=", "onload=", "<iframe", "vbscript:" };
        return !dangerous.Any(d => value.Contains(d, StringComparison.OrdinalIgnoreCase));
    }

    private static bool BeValidEmailDomain(string? email)
    {
        if (string.IsNullOrEmpty(email)) return true;
        // Basic check - allow common domains
        return email.Contains('@') && email.Contains('.');
    }

    private static bool BeValidUrlOrEmpty(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
               (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}

/// <summary>
/// Validator voor UpdateEmployeeDto.
/// </summary>
public class UpdateEmployeeDtoValidator : AbstractValidator<UpdateEmployeeDto>
{
    public UpdateEmployeeDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .MaximumLength(256).WithMessage("Weergavenaam mag maximaal 256 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Weergavenaam bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.DisplayName));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Ongeldig e-mailadres")
            .MaximumLength(256).WithMessage("E-mail mag maximaal 256 tekens bevatten")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.GivenName)
            .MaximumLength(100).WithMessage("Voornaam mag maximaal 100 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Voornaam bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.GivenName));

        RuleFor(x => x.Surname)
            .MaximumLength(100).WithMessage("Achternaam mag maximaal 100 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Achternaam bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.Surname));

        RuleFor(x => x.JobTitle)
            .MaximumLength(200).WithMessage("Functietitel mag maximaal 200 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Functietitel bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.JobTitle));

        RuleFor(x => x.Department)
            .MaximumLength(200).WithMessage("Afdeling mag maximaal 200 tekens bevatten")
            .Must(NotContainDangerousCharacters).WithMessage("Afdeling bevat ongeldige tekens")
            .When(x => !string.IsNullOrEmpty(x.Department));

        RuleFor(x => x.MobilePhone)
            .MaximumLength(50).WithMessage("Mobiel nummer mag maximaal 50 tekens bevatten")
            .Matches(@"^[\d\s\+\-\(\)\.]*$").WithMessage("Ongeldig telefoonnummerformaat")
            .When(x => !string.IsNullOrEmpty(x.MobilePhone));

        RuleFor(x => x.Telefoonnummer)
            .MaximumLength(50).WithMessage("Telefoonnummer mag maximaal 50 tekens bevatten")
            .Matches(@"^[\d\s\+\-\(\)\.]*$").WithMessage("Ongeldig telefoonnummerformaat")
            .When(x => !string.IsNullOrEmpty(x.Telefoonnummer));

        RuleFor(x => x.PhotoUrl)
            .MaximumLength(500).WithMessage("Foto URL mag maximaal 500 tekens bevatten")
            .Must(BeValidUrlOrEmpty).WithMessage("Ongeldige URL voor foto")
            .When(x => !string.IsNullOrEmpty(x.PhotoUrl));

        RuleFor(x => x.StartDatum)
            .LessThanOrEqualTo(x => x.EindDatum).WithMessage("Startdatum moet voor of op einddatum liggen")
            .When(x => x.StartDatum.HasValue && x.EindDatum.HasValue);
    }

    private static bool NotContainDangerousCharacters(string? value)
    {
        if (string.IsNullOrEmpty(value)) return true;
        var dangerous = new[] { "<script", "javascript:", "onerror=", "onload=", "<iframe", "vbscript:" };
        return !dangerous.Any(d => value.Contains(d, StringComparison.OrdinalIgnoreCase));
    }

    private static bool BeValidUrlOrEmpty(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
               (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
