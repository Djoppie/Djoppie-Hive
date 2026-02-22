# Gebruikersrollen - Djoppie-Hive HRadmin

**Versie**: 1.0
**Laatste update**: 22 februari 2026
**Doelgroep**: Gemeente Diepenbeek - HR medewerkers en IT-ondersteuning

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Rolbeschrijvingen](#rolbeschrijvingen)
   - [HR Admin](#1-hr-admin)
   - [Sectormanager](#2-sectormanager)
   - [Diensthoofd/Teamcoach](#3-diensthoofteamcoach)
   - [Medewerker](#4-medewerker)
   - [ICT Super Admin](#5-ict-super-admin-toekomstig)
3. [Validatieworkflow](#validatieworkflow)
4. [Databronnen en Synchronisatie](#databronnen-en-synchronisatie)
5. [Sector/Dienst Hiërarchie](#sectordienst-hiërarchie)
6. [Toegangsmatrix](#toegangsmatrix)

---

## Overzicht

Djoppie-Hive gebruikt een **rolgebaseerd toegangssysteem** om ervoor te zorgen dat medewerkers alleen toegang hebben tot de gegevens die nodig zijn voor hun functie. Het systeem herkent vijf hoofdrollen, elk met specifieke rechten en verantwoordelijkheden.

### Belangrijke Principes

- **Minimale toegang**: Gebruikers krijgen alleen toegang tot wat noodzakelijk is voor hun rol
- **Hiërarchische structuur**: Toegang volgt de organisatiestructuur (Sector → Dienst → Medewerker)
- **Validatieplicht**: Wijzigingen vanuit Azure AD moeten gevalideerd worden door de juiste manager
- **Databron transparantie**: Het systeem toont duidelijk of gegevens uit Azure AD komen (☁️) of handmatig zijn ingevoerd (👤)

---

## Rolbeschrijvingen

### 1. HR Admin

**Beschrijving**
HR Admins hebben volledige administratieve toegang tot alle HR-gegevens binnen Djoppie-Hive. Deze rol is bedoeld voor medewerkers van de HR-afdeling die verantwoordelijk zijn voor het beheer van personeelsgegevens over alle sectoren en diensten heen.

#### Rechten en Permissies

| Actie | Toegang |
|-------|---------|
| **Bekijken** | Alle medewerkers, vrijwilligers, sectoren en diensten |
| **Toevoegen** | Nieuwe medewerkers, vrijwilligers, sectoren en diensten |
| **Bewerken** | Alle personeelsgegevens, inclusief functieniveau en contractgegevens |
| **Verwijderen** | Medewerkers, vrijwilligers (met bevestiging) |
| **Valideren** | Validatieverzoeken van alle sectoren en diensten |
| **Exporteren** | Volledige data-export naar Excel/CSV |
| **Rapportage** | Toegang tot alle dashboards en statistieken |
| **Groepsbeheer** | MG- distributiegroepen (toekomstig: ook bewerken) |

#### Toegankelijke Pagina's

- ✅ Dashboard (volledige statistieken)
- ✅ Personeelslijst (alle medewerkers)
- ✅ Vrijwilligerslijst (alle vrijwilligers)
- ✅ Sector Hiërarchie (alle sectoren)
- ✅ Validatieverzoeken (alle verzoeken)
- ✅ Synchronisatie Geschiedenis (alle sync logs)
- ✅ Instellingen & Configuratie
- ✅ Gebruikersbeheer (toekomstig)

#### Validatieverantwoordelijkheden

HR Admins kunnen **alle validatieverzoeken** afhandelen, ongeacht de sector of dienst. Dit is handig voor:

- Afwezigheid van een Sectormanager of Teamcoach
- Urgente wijzigingen die snelle goedkeuring vereisen
- Centrale controle op personeelsmutaties

#### Gebruiksscenario's

1. **Nieuwe medewerker aanmaken**: HR Admin voegt nieuwe medewerker toe na onboarding
2. **Functieniveau aanpassen**: HR Admin past functieniveau aan na promotie
3. **Validatie overzicht**: HR Admin bekijkt alle openstaande validatieverzoeken
4. **Jaarlijkse rapportage**: HR Admin exporteert volledige personeelsdata voor jaarrapport

---

### 2. Sectormanager

**Beschrijving**
Sectormanagers zijn verantwoordelijk voor alle medewerkers en diensten binnen hun sector. Zij hebben beheertoegang tot alle gegevens binnen hun sector, inclusief alle onderliggende diensten.

#### Rechten en Permissies

| Actie | Toegang |
|-------|---------|
| **Bekijken** | Alle medewerkers en vrijwilligers binnen eigen sector |
| **Toevoegen** | Nieuwe medewerkers/vrijwilligers binnen eigen sector |
| **Bewerken** | Personeelsgegevens binnen eigen sector |
| **Verwijderen** | Medewerkers/vrijwilligers binnen eigen sector (met bevestiging) |
| **Valideren** | Validatieverzoeken van eigen sector en alle onderliggende diensten |
| **Exporteren** | Data-export voor eigen sector |
| **Rapportage** | Dashboard en statistieken voor eigen sector |
| **Groepsbeheer** | MG-SECTOR-{Naam} groep en onderliggende MG- diensten |

#### Toegankelijke Pagina's

- ✅ Dashboard (sector-specifieke statistieken)
- ✅ Personeelslijst (gefilterd op eigen sector)
- ✅ Vrijwilligerslijst (gefilterd op eigen sector)
- ✅ Sector Hiërarchie (eigen sector uitgebreid, anderen ingeklapt)
- ✅ Validatieverzoeken (eigen sector en onderliggende diensten)
- ✅ Synchronisatie Geschiedenis (eigen sector)
- ❌ Instellingen & Configuratie (alleen lezen)
- ❌ Gebruikersbeheer

#### Validatieverantwoordelijkheden

Sectormanagers moeten valideren:

- **Nieuwe medewerkers** toegevoegd aan `MG-SECTOR-{Naam}` in Azure AD
- **Verwijderde medewerkers** uit `MG-SECTOR-{Naam}` in Azure AD
- **Wijzigingen in functiegegevens** van medewerkers binnen de sector
- **Validatieverzoeken doorgestuurd door Teamcoaches** (escalatie)

#### Voorbeeld: Sectormanager Organisatie

**Sector**: Organisatie
**Azure AD Groep**: `MG-SECTOR-Organisatie`
**Onderliggende Diensten**:

- MG-Burgerzaken
- MG-Ruimtelijke Ordening
- MG-Milieu

De Sectormanager Organisatie kan:

- Alle medewerkers in bovenstaande diensten bekijken en beheren
- Validatieverzoeken goedkeuren voor wijzigingen in één van deze diensten
- Sectorbrede rapporten genereren

---

### 3. Diensthoofd/Teamcoach

**Beschrijving**
Diensthoofden en Teamcoaches beheren een specifieke dienst binnen een sector. Zij hebben beheertoegang tot de medewerkers van hun eigen dienst, maar kunnen geen medewerkers uit andere diensten beheren.

#### Rechten en Permissies

| Actie | Toegang |
|-------|---------|
| **Bekijken** | Alle medewerkers en vrijwilligers binnen eigen dienst |
| **Toevoegen** | Nieuwe medewerkers/vrijwilligers binnen eigen dienst |
| **Bewerken** | Personeelsgegevens binnen eigen dienst |
| **Verwijderen** | Medewerkers/vrijwilligers binnen eigen dienst (met bevestiging) |
| **Valideren** | Validatieverzoeken van eigen dienst |
| **Exporteren** | Data-export voor eigen dienst |
| **Rapportage** | Dashboard en statistieken voor eigen dienst |
| **Groepsbeheer** | MG-{DienstNaam} groep (alleen eigen dienst) |

#### Toegankelijke Pagina's

- ✅ Dashboard (dienst-specifieke statistieken)
- ✅ Personeelslijst (gefilterd op eigen dienst)
- ✅ Vrijwilligerslijst (gefilterd op eigen dienst)
- ✅ Sector Hiërarchie (eigen dienst zichtbaar)
- ✅ Validatieverzoeken (alleen eigen dienst)
- ✅ Synchronisatie Geschiedenis (eigen dienst)
- ❌ Instellingen & Configuratie
- ❌ Gebruikersbeheer

#### Validatieverantwoordelijkheden

Teamcoaches moeten valideren:

- **Nieuwe medewerkers** toegevoegd aan `MG-{DienstNaam}` in Azure AD
- **Verwijderde medewerkers** uit `MG-{DienstNaam}` in Azure AD
- **Wijzigingen in functiegegevens** van medewerkers binnen de dienst

Als een wijziging te complex is of goedkeuring van de Sectormanager vereist, kan de Teamcoach het validatieverzoek **escaleren**.

#### Voorbeeld: Teamcoach Burgerzaken

**Dienst**: Burgerzaken
**Azure AD Groep**: `MG-Burgerzaken`
**Sector**: Organisatie (`MG-SECTOR-Organisatie`)

De Teamcoach Burgerzaken kan:

- Alle medewerkers van de dienst Burgerzaken beheren
- Validatieverzoeken voor wijzigingen in de groep `MG-Burgerzaken` afhandelen
- Dienstspecifieke rapporten genereren

De Teamcoach kan **niet**:

- Medewerkers van MG-Ruimtelijke Ordening of MG-Milieu bekijken of beheren
- Sectorbrede wijzigingen goedkeuren (dit is de verantwoordelijkheid van de Sectormanager)

---

### 4. Medewerker

**Beschrijving**
Medewerkers hebben beperkte, alleen-lezen toegang tot het systeem. Zij kunnen hun eigen profiel bekijken en basisinformatie over collega's binnen hun dienst of sector.

#### Rechten en Permissies

| Actie | Toegang |
|-------|---------|
| **Bekijken** | Eigen profiel + beperkte collega-informatie (naam, functie, email) |
| **Toevoegen** | ❌ Geen |
| **Bewerken** | ⚠️ Eigen profielfoto en contactvoorkeuren (toekomstig) |
| **Verwijderen** | ❌ Geen |
| **Valideren** | ❌ Geen |
| **Exporteren** | ❌ Geen |
| **Rapportage** | ❌ Geen |
| **Groepsbeheer** | ❌ Geen |

#### Toegankelijke Pagina's

- ✅ Mijn Profiel (eigen gegevens)
- ✅ Collega's (beperkte directory binnen eigen dienst)
- ❌ Dashboard
- ❌ Personeelslijst
- ❌ Vrijwilligerslijst
- ❌ Sector Hiërarchie
- ❌ Validatieverzoeken
- ❌ Synchronisatie Geschiedenis

#### Gebruiksscenario's

1. **Eigen gegevens bekijken**: Medewerker controleert eigen contactgegevens en functiebeschrijving
2. **Collega opzoeken**: Medewerker zoekt emailadres of telefoonnummer van collega binnen de dienst
3. **Profielfoto updaten**: Medewerker past eigen profielfoto aan (toekomstig)

> **Privacy waarborg**: Medewerkers kunnen GEEN gevoelige HR-gegevens (salaris, contracttype, evaluaties) van zichzelf of anderen bekijken. Dit is beperkt tot HR Admins en managers.

---

### 5. ICT Super Admin (Toekomstig)

**Beschrijving**
De ICT Super Admin rol is bedoeld voor technische beheerders die verantwoordelijk zijn voor het onderhoud van het systeem, maar geen HR-bevoegdheden hebben. Deze rol is momenteel nog niet geïmplementeerd, maar voorbereid voor toekomstig gebruik.

#### Rechten en Permissies (Geplanned)

| Actie | Toegang |
|-------|---------|
| **Bekijken** | Alle systeem logs, configuratie-instellingen, gebruikersrollen |
| **Toevoegen** | Nieuwe gebruikers, roltoewijzingen |
| **Bewerken** | Systeem configuratie, API-instellingen, Azure AD integratie |
| **Verwijderen** | Gebruikersaccounts (na HR goedkeuring) |
| **Valideren** | ❌ Geen HR validaties |
| **Exporteren** | Systeem logs, audit trails |
| **Rapportage** | Technische dashboards (uptime, API calls, performance) |
| **Groepsbeheer** | ⚠️ Technisch beheer van sync, geen HR-wijzigingen |

#### Toegankelijke Pagina's (Geplanned)

- ✅ Systeem Configuratie
- ✅ Gebruikersbeheer & Roltoewijzing
- ✅ Azure AD Sync Instellingen
- ✅ API Monitoring & Logs
- ✅ Audit Trail (volledige geschiedenis)
- ✅ Backup & Restore
- ⚠️ Personeelslijst (alleen-lezen voor troubleshooting)
- ❌ Validatieverzoeken (geen HR-rechten)

#### Belangrijke Scheiding

De ICT Super Admin heeft **geen HR-bevoegdheden**. Dit betekent:

- ❌ Kan geen functieniveaus, contracten of gevoelige HR-gegevens aanpassen
- ❌ Kan geen validatieverzoeken goedkeuren of afwijzen
- ✅ Kan wel technische sync-problemen oplossen
- ✅ Kan wel gebruikersrollen toewijzen (na HR goedkeuring)

---

## Validatieworkflow

### Wat is Validatie?

Wanneer het systeem wijzigingen detecteert in **Azure AD MG- distributiegroepen**, worden deze niet automatisch doorgevoerd in Djoppie-Hive. In plaats daarvan wordt een **validatieverzoek** aangemaakt dat goedgekeurd moet worden door de verantwoordelijke manager.

### Waarom Validatie?

1. **Controle**: Voorkomt ongewenste wijzigingen die per ongeluk in Azure AD zijn gemaakt
2. **Audit trail**: Houdt bij wie welke wijziging heeft goedgekeurd
3. **Data integriteit**: Zorgt ervoor dat Hive-data accuraat blijft en overeenkomt met de realiteit
4. **GDPR compliance**: Documenteert alle wijzigingen in personeelsgegevens

### Workflow Stappen

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Wijziging in Azure AD                                     │
│    - Medewerker toegevoegd aan MG-Burgerzaken               │
│    - Medewerker verwijderd uit MG-SECTOR-Organisatie        │
│    - Functiegegevens gewijzigd in Azure AD                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Graph API Synchronisatie (dagelijks + on-demand)         │
│    - Djoppie-Hive detecteert verschil tussen Azure en Hive  │
│    - Wijziging wordt NIET automatisch doorgevoerd           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Validatieverzoek Aangemaakt                              │
│    - Status: "In afwachting"                                │
│    - Toegewezen aan: Teamcoach of Sectormanager             │
│    - Notificatie: Email + badge in systeem                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Manager Beoordeelt Wijziging                             │
│    - Bekijkt oude vs nieuwe waarden                         │
│    - Controleert of wijziging correct is                    │
│    - Kan opmerkingen toevoegen                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
┌──────────────────────┐   ┌──────────────────────┐
│ 5a. Goedkeuren       │   │ 5b. Afwijzen         │
│ - Wijziging wordt    │   │ - Wijziging wordt    │
│   doorgevoerd        │   │   NIET doorgevoerd   │
│ - Azure data wordt   │   │ - Azure data blijft  │
│   overgenomen        │   │   genegeerd          │
│ - Audit log entry    │   │ - Audit log entry    │
└──────────────────────┘   └──────────────────────┘
```

### Wie Mag Wat Valideren?

| Wijziging Type | Teamcoach | Sectormanager | HR Admin |
|----------------|-----------|---------------|----------|
| Nieuwe medewerker in MG-{Dienst} | ✅ | ✅ | ✅ |
| Verwijderde medewerker uit MG-{Dienst} | ✅ | ✅ | ✅ |
| Functiewijziging binnen dienst | ✅ | ✅ | ✅ |
| Wijziging in MG-SECTOR-{Naam} | ❌ | ✅ | ✅ |
| Nieuwe dienst toegevoegd aan sector | ❌ | ✅ | ✅ |
| Wijziging over meerdere sectoren | ❌ | ❌ | ✅ |

### Validatieverzoek Detailscherm

Wanneer een manager een validatieverzoek opent, ziet deze:

**Basisinformatie**
- Datum/tijd van detectie
- Bron: Azure AD Sync
- Type wijziging: Nieuwe medewerker / Verwijderd / Gewijzigd
- Groep: MG-Burgerzaken

**Wijzigingsdetails**
| Veld | Oude Waarde | Nieuwe Waarde |
|------|-------------|---------------|
| Naam | - | Jan Janssen |
| Email | - | jan.janssen@diepenbeek.be |
| Functie | - | Medewerker Burgerzaken |
| Dienst | - | Burgerzaken |

**Acties**
- ✅ **Goedkeuren** (groene knop)
- ❌ **Afwijzen** (rode knop)
- 📝 **Opmerking toevoegen** (tekstveld)
- ⏸️ **Later beslissen** (sluit scherm)

### Escalatie

Als een Teamcoach twijfelt over een validatieverzoek, kan deze het verzoek **escaleren** naar de Sectormanager:

1. Teamcoach opent validatieverzoek
2. Kiest "Escaleren naar Sectormanager"
3. Voegt opmerking toe met reden voor escalatie
4. Verzoek wordt opnieuw toegewezen aan Sectormanager
5. Sectormanager ontvangt notificatie

---

## Databronnen en Synchronisatie

Djoppie-Hive werkt met **twee databronnen**. Het is cruciaal om te begrijpen welke data uit welke bron komt en hoe deze gesynchroniseerd wordt.

### Databronnen Overzicht

| Databron | Icoon | Beschrijving | Sync Richting | Bewerken? |
|----------|-------|--------------|---------------|-----------|
| **Azure AD** | ☁️ | Medewerkers uit MG- distributiegroepen | Azure → Hive (read-only) | ❌ Alleen valideren |
| **Handmatig** | 👤 | Direct in Hive aangemaakt | Alleen Hive (lokaal) | ✅ Volledig bewerken |

### Azure AD Sync (☁️ Cloud)

**Bron**: Microsoft Entra ID (Azure Active Directory)
**Synchronisatie**: Dagelijks om 02:00 + on-demand via "Nu synchroniseren" knop
**API**: Microsoft Graph API (read-only)

#### Wat Wordt Gesynchroniseerd?

- **MG-SECTOR-** groepen (sectoren)
- **MG-** groepen (diensten, zonder SECTOR in de naam)
- **Groepsleden** (medewerkers toegewezen aan deze groepen)
- **Gebruikersprofielen** (naam, email, functie, afdeling, foto)

#### Synchronisatie Proces

```
Microsoft Entra ID (Azure AD)
          ↓
   Graph API aanroep
          ↓
   Vergelijking met Hive database
          ↓
┌─────────┴─────────┐
↓                   ↓
Geen wijzigingen    Wijzigingen gedetecteerd
↓                   ↓
Log entry           Validatieverzoek aangemaakt
"Sync succesvol"    "Wijzigingen vereisen validatie"
```

#### Belangrijke Beperkingen

- ❌ **Geen write-back**: Wijzigingen in Hive worden NIET teruggezet naar Azure AD
- ❌ **Geen directe bewerking**: Azure data kan niet rechtstreeks in Hive bewerkt worden
- ✅ **Validatie verplicht**: Alle Azure wijzigingen moeten gevalideerd worden
- ⚠️ **Conflictresolutie**: Bij conflict wint Azure AD (na validatie)

### Handmatige Data (👤 User)

**Bron**: Directe invoer in Djoppie-Hive
**Synchronisatie**: Niet van toepassing (lokaal)
**API**: Hive Backend API

#### Wat Kan Handmatig Worden Toegevoegd?

- **Medewerkers** die niet in Azure AD zitten (bijv. externe consultants, tijdelijke krachten)
- **Vrijwilligers** (deze staan nooit in Azure AD)
- **Lokale groepen** (aangepast voor events, projecten, communicatie)
- **Aanvullende metadata** (notities, labels, custom fields)

#### Wanneer Handmatige Invoer Gebruiken?

| Scenario | Gebruik |
|----------|---------|
| Externe consultant zonder Azure account | 👤 Handmatig |
| Vrijwilliger voor eenmalig event | 👤 Handmatig |
| Tijdelijke medewerker (< 1 maand) | 👤 Handmatig |
| Vast personeelslid | ☁️ Azure AD (via MG- groep) |
| Projectgroep (cross-sectoraal) | 👤 Handmatig (lokale groep) |

#### Voordelen Handmatige Data

- ✅ Volledig bewerkbaar
- ✅ Geen validatie vereist (tenzij gewenst)
- ✅ Flexibel te organiseren
- ✅ Snel aan te passen

#### Nadelen Handmatige Data

- ⚠️ **Geen automatische updates** bij functiewijzigingen
- ⚠️ **Handmatig onderhoud** vereist bij vertrek medewerker
- ⚠️ **Geen koppeling met Azure AD** voor SSO

### Data Iconen in het Systeem

Overal in Djoppie-Hive zie je iconen die aangeven waar data vandaan komt:

| Locatie | Icoon | Betekenis |
|---------|-------|-----------|
| Personeelslijst | ☁️ | Medewerker uit Azure AD MG- groep |
| Personeelslijst | 👤 | Medewerker handmatig toegevoegd |
| Sectoren | ☁️ | Sector komt uit MG-SECTOR-{Naam} |
| Diensten | ☁️ | Dienst komt uit MG-{DienstNaam} |
| Vrijwilligers | 👤 | Vrijwilligers zijn altijd handmatig |
| Lokale groepen | 👤 | Groepen alleen in Hive (geen Azure sync) |

### Synchronisatie Geschiedenis

Alle synchronisaties worden gelogd in de **Synchronisatie Geschiedenis** pagina:

**Log Entry Voorbeeld**

| Datum | Tijd | Type | Status | Details | Actie |
|-------|------|------|--------|---------|-------|
| 2026-02-22 | 02:00 | Automatisch | ✅ Succesvol | 245 medewerkers gesynchroniseerd, 3 wijzigingen gedetecteerd | Bekijk |
| 2026-02-21 | 14:32 | Handmatig | ✅ Succesvol | 245 medewerkers gesynchroniseerd, 0 wijzigingen | Bekijk |
| 2026-02-21 | 02:00 | Automatisch | ⚠️ Fout | Graph API timeout na 30s | Retry |

**Toegang tot Logs**

- HR Admin: Alle logs
- Sectormanager: Logs voor eigen sector
- Teamcoach: Logs voor eigen dienst
- Medewerker: Geen toegang

---

## Sector/Dienst Hiërarchie

Gemeente Diepenbeek gebruikt een **tweelaagse hiërarchie** voor organisatie-indeling:

```
Gemeente Diepenbeek
    ↓
Sectoren (MG-SECTOR-{Naam})
    ↓
Diensten (MG-{DienstNaam})
    ↓
Medewerkers
```

### Sectoroverzicht

Gemeente Diepenbeek heeft **5 hoofdsectoren**:

#### 1. Sector Organisatie

**Azure AD Groep**: `MG-SECTOR-Organisatie`
**Sectormanager**: [Naam Sectormanager]

**Onderliggende Diensten**:

- **MG-Burgerzaken** - Burgerzaken en bevolkingsregister
- **MG-Ruimtelijke Ordening** - Vergunningen en omgevingsbeleid
- **MG-Milieu** - Milieubeheer en duurzaamheid

#### 2. Sector Vrije Tijd

**Azure AD Groep**: `MG-SECTOR-Vrije Tijd`
**Sectormanager**: [Naam Sectormanager]

**Onderliggende Diensten**:

- **MG-Sport** - Sportinfrastructuur en -activiteiten
- **MG-Cultuur** - Culturele activiteiten en evenementen
- **MG-Jeugd** - Jeugdwerking en speelpleinwerking

#### 3. Sector Facility

**Azure AD Groep**: `MG-SECTOR-Facility`
**Sectormanager**: [Naam Sectormanager]

**Onderliggende Diensten**:

- **MG-ICT** - IT-ondersteuning en digitalisering
- **MG-Technische Dienst** - Gebouwbeheer en onderhoud
- **MG-Logistiek** - Magazijn en materiaalverwerking

#### 4. Sector Financiën

**Azure AD Groep**: `MG-SECTOR-Financiën`
**Sectormanager**: [Naam Sectormanager]

**Onderliggende Diensten**:

- **MG-Boekhouding** - Financiële administratie
- **MG-Belastingen** - Gemeentelijke belastingen
- **MG-Aankoop** - Aankoopbeheer en contracten

#### 5. Sector Personeel & Organisatie

**Azure AD Groep**: `MG-SECTOR-Personeel`
**Sectormanager**: [Naam Sectormanager]

**Onderliggende Diensten**:

- **MG-HR** - Human Resources en personeelsbeheer
- **MG-Payroll** - Salarisadministratie
- **MG-Vorming** - Opleidingen en ontwikkeling

### Hiërarchische Toegangsregels

#### Voorbeeld 1: Sectormanager Organisatie

**Kan beheren**:

- Alle medewerkers van MG-Burgerzaken
- Alle medewerkers van MG-Ruimtelijke Ordening
- Alle medewerkers van MG-Milieu
- Sectorbrede groep `MG-SECTOR-Organisatie`

**Kan NIET beheren**:

- Medewerkers van Sector Vrije Tijd (MG-Sport, MG-Cultuur, MG-Jeugd)
- Medewerkers van andere sectoren

#### Voorbeeld 2: Teamcoach Burgerzaken

**Kan beheren**:

- Alle medewerkers van MG-Burgerzaken
- Groep `MG-Burgerzaken`

**Kan NIET beheren**:

- Medewerkers van MG-Ruimtelijke Ordening (andere dienst, zelfde sector)
- Medewerkers van MG-Sport (andere dienst, andere sector)
- Sectorbrede groep `MG-SECTOR-Organisatie` (dit is verantwoordelijkheid Sectormanager)

### Visualisatie in het Systeem

Op de **Sector Hiërarchie** pagina zie je de structuur als een uitklapbare boom:

```
📂 MG-SECTOR-Organisatie (32 medewerkers) ☁️
  ├── 📂 MG-Burgerzaken (12 medewerkers) ☁️
  │     ├── 👤 Jan Janssen - Medewerker Burgerzaken
  │     ├── 👤 Sara Smets - Teamcoach Burgerzaken
  │     └── ... (10 meer)
  ├── 📂 MG-Ruimtelijke Ordening (15 medewerkers) ☁️
  │     └── ...
  └── 📂 MG-Milieu (5 medewerkers) ☁️
        └── ...

📂 MG-SECTOR-Vrije Tijd (28 medewerkers) ☁️
  ├── 📂 MG-Sport (10 medewerkers) ☁️
  ├── 📂 MG-Cultuur (12 medewerkers) ☁️
  └── 📂 MG-Jeugd (6 medewerkers) ☁️

... (3 meer sectoren)
```

**Filtermogelijkheden**:

- HR Admin ziet alle sectoren uitgebreid
- Sectormanager ziet eigen sector uitgebreid, andere sectoren ingeklapt
- Teamcoach ziet alleen eigen dienst

---

## Toegangsmatrix

### Overzicht per Pagina

| Pagina | HR Admin | Sectormanager | Teamcoach | Medewerker | ICT Admin |
|--------|----------|---------------|-----------|------------|-----------|
| Dashboard | ✅ Volledig | ✅ Sector | ✅ Dienst | ❌ | ✅ Technisch |
| Personeelslijst | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ⚠️ Alleen-lezen |
| Vrijwilligerslijst | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ⚠️ Alleen-lezen |
| Sector Hiërarchie | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ⚠️ Alleen-lezen |
| Validatieverzoeken | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ❌ |
| Sync Geschiedenis | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ✅ Allen |
| Mijn Profiel | ✅ | ✅ | ✅ | ✅ | ✅ |
| Collega's | ✅ Allen | ✅ Sector | ✅ Dienst | ⚠️ Beperkt | ⚠️ Beperkt |
| Instellingen | ✅ | ⚠️ Lezen | ❌ | ❌ | ✅ |
| Gebruikersbeheer | ✅ | ❌ | ❌ | ❌ | ✅ |

### Overzicht per Actie

| Actie | HR Admin | Sectormanager | Teamcoach | Medewerker | ICT Admin |
|-------|----------|---------------|-----------|------------|-----------|
| **Medewerker toevoegen** | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ❌ |
| **Medewerker bewerken** | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ❌ |
| **Medewerker verwijderen** | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ❌ |
| **Azure data bewerken** | ❌ Valideren | ❌ Valideren | ❌ Valideren | ❌ | ❌ |
| **Handmatige data bewerken** | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ❌ |
| **Valideren** | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ❌ |
| **Exporteren** | ✅ Allen | ✅ Sector | ✅ Dienst | ❌ | ✅ |
| **Sync starten** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Rol toewijzen** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Systeem configureren** | ⚠️ Beperkt | ❌ | ❌ | ❌ | ✅ |

---

## Roltoewijzing

### Hoe Worden Rollen Toegewezen?

Rollen worden toegewezen op basis van **functietitel** in Azure AD. Het systeem detecteert automatisch de rol op basis van specifieke zoekwoorden in de functietitel.

| Functietitel (jobTitle in Azure AD) | Toegewezen Rol |
|--------------------------------------|----------------|
| HR Manager, HR Medewerker, Personeelsdienst | HR Admin |
| Sectormanager, Sector Manager | Sectormanager |
| Teamcoach, Diensthoofd, Coördinator | Teamcoach |
| ICT Beheerder, Systeembeheerder | ICT Super Admin (toekomstig) |
| *Anders* | Medewerker |

### Handmatige Roltoewijzing (Toekomstig)

In de toekomst kunnen HR Admins en ICT Admins rollen handmatig toewijzen via de **Gebruikersbeheer** pagina, ongeacht de functietitel in Azure AD.

---

## Veelgestelde Vragen

### Q: Kan ik als Teamcoach medewerkers uit andere diensten zien?

**A**: Nee, Teamcoaches kunnen alleen medewerkers binnen hun eigen dienst bekijken en beheren. Als je medewerkers uit andere diensten moet zien, neem contact op met de Sectormanager of HR Admin.

### Q: Waarom kan ik een medewerker uit Azure AD niet bewerken?

**A**: Medewerkers die gesynchroniseerd zijn vanuit Azure AD (☁️ icoon) kunnen niet direct bewerkt worden. Wijzigingen moeten eerst goedgekeurd worden via het validatieproces. Dit voorkomt dat Hive-data afwijkt van de bron (Azure AD).

### Q: Wat gebeurt er als ik een validatieverzoek afwijs?

**A**: Als je een validatieverzoek afwijst, wordt de wijziging NIET doorgevoerd in Djoppie-Hive. De data blijft zoals deze was vóór de Azure AD sync. De afwijzing wordt gelogd in de audit trail.

### Q: Kan ik als Sectormanager ook validatieverzoeken van andere sectoren zien?

**A**: Nee, Sectormanagers zien alleen validatieverzoeken voor hun eigen sector en onderliggende diensten. Alleen HR Admins kunnen validatieverzoeken van alle sectoren zien en afhandelen.

### Q: Hoe weet ik of een medewerker uit Azure AD of handmatig is toegevoegd?

**A**: Kijk naar het icoon naast de naam:
- ☁️ = Azure AD (gesynchroniseerd)
- 👤 = Handmatig (alleen in Hive)

### Q: Wat is het verschil tussen een MG-SECTOR groep en een MG- dienst groep?

**A**:
- **MG-SECTOR-{Naam}**: Sectorniveau groep die alle diensten van een sector omvat
- **MG-{DienstNaam}**: Dienstniveau groep voor een specifieke dienst binnen een sector

Een sector kan meerdere diensten bevatten, maar een dienst hoort bij één sector.

### Q: Kan ik als HR Admin wijzigingen direct doorvoeren zonder validatie?

**A**: Nee, ook HR Admins moeten Azure AD wijzigingen valideren. Dit is een veiligheidsmaatregel om ongewenste synchronisaties te voorkomen. Alleen handmatig toegevoegde data kan direct bewerkt worden zonder validatie.

### Q: Hoe vaak wordt er gesynchroniseerd met Azure AD?

**A**: Er is een automatische synchronisatie dagelijks om 02:00 uur. Daarnaast kan elke manager (Teamcoach, Sectormanager, HR Admin) op elk moment een handmatige sync starten via de knop "Nu synchroniseren".

---

## Contact & Ondersteuning

### Bij Vragen Over Rollen en Toegang

- **HR Admin**: <hr@diepenbeek.be>
- **ICT Ondersteuning**: <ict@diepenbeek.be>
- **Systeembeheerder**: <jo.wijnen@diepenbeek.be>

### Feedback en Suggesties

Heb je suggesties voor verbeteringen aan de rollen en toegangsstructuur? Laat het ons weten via <djoppie-hive-feedback@diepenbeek.be>.

---

**Document Versie**: 1.0
**Laatste Update**: 22 februari 2026
**Auteur**: Djoppie-Hive Team
**Status**: Definitief
