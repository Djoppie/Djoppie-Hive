# Gebruikershandleiding Djoppie-Hive

**HR Personeelsbeheer Systeem - Gemeente Diepenbeek**

Versie: 1.0
Datum: Februari 2026

---

## Inhoudsopgave

1. [Inleiding](#inleiding)
2. [Inloggen](#inloggen)
3. [Dashboard](#dashboard)
4. [Personeelslijst](#personeelslijst)
5. [Medewerker Details](#medewerker-details)
6. [Vrijwilligersbeheer](#vrijwilligersbeheer)
7. [Distributiegroepen](#distributiegroepen)
8. [Sync Geschiedenis](#sync-geschiedenis)
9. [Veelgestelde Vragen](#veelgestelde-vragen)

---

## Inleiding

Djoppie-Hive is het HR personeelsbeheer systeem voor Gemeente Diepenbeek. Het systeem synchroniseert automatisch met Microsoft 365 (Azure AD) en biedt een centraal overzicht van alle medewerkers, vrijwilligers en distributiegroepen.

### Belangrijke concepten

- **Azure Medewerkers**: Gesynchroniseerd vanuit Microsoft 365 (automatisch bijgewerkt)
- **Handmatige Medewerkers**: Lokaal toegevoegd (bijv. externe vrijwilligers)
- **MG-Groepen**: Distributiegroepen uit Microsoft 365 (MG-SECTOR-*, MG-*)
- **Validatie**: Het goedkeuringsproces voor wijzigingen door teamcoaches

---

## Inloggen

### Stappen

1. Open de applicatie via de URL
2. Klik op **"Aanmelden met Microsoft"**
3. Voer uw Gemeente Diepenbeek e-mailadres in
4. Voer uw wachtwoord in
5. Voltooi de eventuele MFA-verificatie

### Rollen

Na het inloggen heeft u een specifieke rol:

| Rol | Rechten |
|-----|---------|
| **ICT Super Admin** | Volledige toegang tot alle functies |
| **HR Admin** | Volledig personeelsbeheer |
| **Sectormanager** | Toegang tot eigen sector |
| **Diensthoofd** | Toegang tot eigen dienst |
| **Medewerker** | Alleen eigen gegevens bekijken |

---

## Dashboard

Het dashboard toont een overzicht van:

- Totaal aantal actieve medewerkers
- Nieuw toegevoegde medewerkers (laatste 30 dagen)
- Openstaande validatieverzoeken
- Recente synchronisaties

### Snelkoppelingen

- **Personeelslijst** - Alle medewerkers bekijken
- **Vrijwilligers** - Vrijwilligersbeheer
- **Distributiegroepen** - MG-groepen beheren
- **Sync starten** - Handmatige synchronisatie

---

## Personeelslijst

### Navigatie

1. Klik op **"Personeel"** in het hoofdmenu
2. De lijst toont alle medewerkers binnen uw bevoegdheid

### Filteren

Gebruik de filterknoppen bovenaan de lijst:

- **Actief/Inactief**: Filter op actieve status
- **Type**: Personeel, Vrijwilliger, Interim, Stagair
- **Bron**: Azure AD of Handmatig
- **Sector**: Filter op sector (indien beschikbaar)
- **Dienst**: Filter op dienst

### Zoeken

- Typ in het zoekveld om te zoeken op:
  - Naam
  - E-mailadres
  - Functie
  - Afdeling

### Kolommen

| Kolom | Beschrijving |
|-------|--------------|
| Naam | Volledige naam van de medewerker |
| E-mail | Werkmail adres |
| Functie | Functietitel |
| Dienst | Toegewezen dienst |
| Bron | Cloud (Azure) of Handmatig icoon |
| Status | Actief/Inactief badge |
| Acties | Bekijken, Bewerken, Verwijderen |

### Bron-indicator

- **Cloud icoon**: Gesynchroniseerd vanuit Azure AD
- **Gebruiker icoon**: Handmatig toegevoegd

---

## Medewerker Details

### Bekijken

1. Klik op een medewerker in de lijst
2. Het detailscherm toont alle informatie

### Secties

**Persoonlijke gegevens:**
- Naam (voornaam, achternaam)
- E-mailadres
- Telefoonnummer
- Foto (indien beschikbaar)

**Werkgegevens:**
- Functie
- Afdeling
- Kantoorlocatie
- Arbeidsregime (voltijds/deeltijds)
- Start- en einddatum

**Organisatie:**
- Toegewezen dienst
- Sector
- Groepslidmaatschappen

### Bewerken (Admin alleen)

**Voor Azure medewerkers:**
- Alleen lokale velden kunnen worden bewerkt:
  - Telefoonnummer
  - Type medewerker
  - Arbeidsregime
  - Toegewezen dienst

**Voor handmatige medewerkers:**
- Alle velden kunnen worden bewerkt

### Nieuwe medewerker toevoegen

1. Klik op **"Nieuwe Medewerker"**
2. Vul de verplichte velden in:
   - Naam
   - E-mailadres
   - Type
3. Klik op **"Opslaan"**

---

## Vrijwilligersbeheer

### Navigatie

1. Klik op **"Vrijwilligers"** in het menu
2. Of filter op Type = "Vrijwilliger" in Personeelslijst

### Vrijwilliger toevoegen

1. Klik op **"Nieuwe Vrijwilliger"**
2. Vul de gegevens in:
   - Naam en contactgegevens
   - Ingangsdatum
   - Vrijwilligerspecifieke details:
     - Rijbewijs (ja/nee)
     - Beschikbare dagen
     - Interesses
3. Klik op **"Opslaan"**

### Bijzonderheden vrijwilligers

Vrijwilligers hebben extra velden:
- Rijbewijsgegevens
- Beschikbaarheid per dag
- Interessegebieden
- Opmerkingen

---

## Distributiegroepen

### Overzicht

De pagina toont alle MG-distributiegroepen:

- **MG-iedereenpersoneel**: Rootgroep voor alle personeel
- **MG-SECTOR-***: Sectorgroepen
- **MG-***: Dienstgroepen

### Hiërarchie

```
MG-iedereenpersoneel (root)
├── MG-SECTOR-Organisatie
│   ├── MG-Burgerzaken
│   ├── MG-Ruimtelijke Ordening
│   └── MG-Milieu
├── MG-SECTOR-Vrije Tijd
│   ├── MG-Sport
│   └── MG-Cultuur
└── ...
```

### Groepsleden bekijken

1. Klik op een groep
2. Bekijk de ledenlijst
3. Zie wie sectormanager of diensthoofd is

---

## Sync Geschiedenis

### Navigatie

Klik op **"Sync Geschiedenis"** in het menu

### Overzicht

De pagina toont:

- Laatste synchronisatie datum/tijd
- Status van elke sync (succesvol/mislukt)
- Aantal toegevoegde/gewijzigde/verwijderde records
- Eventuele foutmeldingen

### Handmatige sync starten

1. Klik op **"Sync nu starten"**
2. Wacht tot de synchronisatie voltooid is
3. Bekijk de resultaten

**Let op:** Synchronisatie kan enkele minuten duren.

---

## Veelgestelde Vragen

### Waarom kan ik sommige gegevens niet bewerken?

Gegevens die gesynchroniseerd zijn vanuit Azure AD (cloud icoon) kunnen alleen worden gewijzigd in Microsoft 365. Lokale velden zoals telefoonnummer en dienst kunnen wel worden aangepast.

### Hoe lang duurt een synchronisatie?

Een volledige synchronisatie duurt gemiddeld 1-5 minuten, afhankelijk van het aantal medewerkers en groepen.

### Ik zie een medewerker niet, wat nu?

1. Controleer of de medewerker actief is
2. Controleer of u de juiste rechten heeft
3. Wacht op de volgende synchronisatie
4. Neem contact op met ICT Support

### Kan ik een Azure medewerker verwijderen?

Nee, Azure medewerkers worden beheerd via Microsoft 365. U kunt ze wel als "inactief" markeren in Djoppie-Hive.

### Hoe voeg ik iemand toe aan een distributiegroep?

Groepslidmaatschappen worden beheerd via Microsoft 365. Neem contact op met ICT Support voor wijzigingen.

---

## Contact & Support

**ICT Helpdesk:**
- E-mail: ict@diepenbeek.be
- Intern: ext. 123

**Applicatiebeheer:**
- E-mail: jo.wijnen@diepenbeek.be

---

*Dit document is laatst bijgewerkt op februari 2026*
