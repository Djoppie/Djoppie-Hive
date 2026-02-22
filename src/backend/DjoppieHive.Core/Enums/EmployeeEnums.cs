namespace DjoppieHive.Core.Enums;

/// <summary>
/// Type medewerker binnen de organisatie.
/// </summary>
public enum EmployeeType
{
    /// <summary>
    /// Vast personeelslid van de gemeente.
    /// </summary>
    Personeel = 0,

    /// <summary>
    /// Vrijwilliger (vereist extra gegevens via VrijwilligerDetails).
    /// </summary>
    Vrijwilliger = 1,

    /// <summary>
    /// Interim-medewerker (tijdelijk contract).
    /// </summary>
    Interim = 2,

    /// <summary>
    /// Externe partij of consultant.
    /// </summary>
    Extern = 3,

    /// <summary>
    /// Stagiair of leerling.
    /// </summary>
    Stagiair = 4
}

/// <summary>
/// Arbeidsregime van een medewerker.
/// </summary>
public enum ArbeidsRegime
{
    /// <summary>
    /// Voltijds werknemer (38-40 uur per week).
    /// </summary>
    Voltijds = 0,

    /// <summary>
    /// Deeltijds werknemer (minder dan voltijds).
    /// </summary>
    Deeltijds = 1,

    /// <summary>
    /// Vrijwilliger (onbetaald, op beschikbaarheidsbasis).
    /// </summary>
    Vrijwilliger = 2
}
