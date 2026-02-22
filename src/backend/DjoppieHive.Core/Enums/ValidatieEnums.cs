namespace DjoppieHive.Core.Enums;

/// <summary>
/// Type van validatieverzoek.
/// </summary>
public enum ValidatieVerzoekType
{
    /// <summary>
    /// Lid is verwijderd uit een groep in Azure AD.
    /// </summary>
    LidVerwijderd = 0,

    /// <summary>
    /// Medewerkeraccount is gedeactiveerd in Azure AD.
    /// </summary>
    MedewerkerGedeactiveerd = 1,

    /// <summary>
    /// Gehele groep is verwijderd uit Azure AD.
    /// </summary>
    GroepVerwijderd = 2,

    /// <summary>
    /// Handmatige invoer conflicteert met Azure AD gegevens.
    /// </summary>
    GegevensConflict = 3
}

/// <summary>
/// Status van een validatieverzoek.
/// </summary>
public enum ValidatieVerzoekStatus
{
    /// <summary>
    /// Wacht op beoordeling door teamcoach/sector manager.
    /// </summary>
    InAfwachting = 0,

    /// <summary>
    /// Wordt momenteel beoordeeld.
    /// </summary>
    InBehandeling = 1,

    /// <summary>
    /// Verzoek is goedgekeurd/afgehandeld.
    /// </summary>
    Goedgekeurd = 2,

    /// <summary>
    /// Verzoek is afgekeurd.
    /// </summary>
    Afgekeurd = 3,

    /// <summary>
    /// Verzoek is geëscaleerd naar sector manager.
    /// </summary>
    Geescaleerd = 4
}

/// <summary>
/// Afhandelingsactie voor een validatieverzoek.
/// </summary>
public enum ValidatieAfhandeling
{
    /// <summary>
    /// Bevestig dat de Azure AD verwijdering correct is. Lidmaatschap definitief verwijderen.
    /// </summary>
    BevestigVerwijdering = 0,

    /// <summary>
    /// Opnieuw toevoegen als handmatige invoer (behouden in lokaal systeem ondanks AD verwijdering).
    /// </summary>
    HandmatigHertoevoegen = 1,

    /// <summary>
    /// Negeer dit verzoek (vals positief).
    /// </summary>
    Negeren = 2,

    /// <summary>
    /// Escaleer naar sector manager voor beslissing.
    /// </summary>
    Escaleren = 3
}
