# Refactor Plan: HR Scope Verduidelijking

**Datum**: 25 februari 2026
**Versie**: 1.0
**Status**: Voorstel

## Executive Summary

Dit document beschrijft de benodigde refactoring om de autorisatie in Djoppie-Hive beter af te stemmen op de werkelijke scope van het systeem: **communicatie en medewerkersbeheer voor HR**, niet applicatie-toegangsbeheer voor ICT.

**Kernprobleem**: De huidige `CanManageGroups` policy is te restrictief - alleen ICT Super Admin kan groepen beheren. Dit past niet bij de use case waarin HR-medewerkers lokale groepen moeten kunnen aanmaken voor communicatiedoeleinden (evenementen, uitnodigingen).

**Oplossing**: Herdefinieer groepsbeheer-permissies zodat HR Admin ook lokale en dynamische groepen kan beheren, terwijl Exchange groepen read-only blijven.

---

## 1. Huidige Situatie Analyse

### 1.1 Authorization Policies (AuthorizationExtensions.cs)

**Locatie**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Authorization\AuthorizationExtensions.cs`

**Huidige implementatie**:

```csharp
// Manage groups - ICT admin only
options.AddPolicy(PolicyNames.CanManageGroups, policy =>
    policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin)));
```

**Probleem**:
- Alleen `IctSuperAdmin` kan groepen beheren
- HR Admin kan geen lokale groepen aanmaken voor communicatie
- Gebruik van `CanManageGroups` voor alle groep-operaties (create, update, delete)

**Gevolgen**:
- HR Admin kan geen evenementen aanmaken met custom groepen
- Lokale groepen (bijv. "Politie Diepenbeek") kunnen niet door HR beheerd worden
- Dynamische groepen kunnen niet door HR aangepast worden

### 1.2 UnifiedGroupsController Endpoints

**Locatie**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Controllers\UnifiedGroupsController.cs`

**Overzicht endpoints met autorisatie**:

| HTTP Method | Endpoint | Policy | Huidige toegang |
|-------------|----------|--------|-----------------|
| GET | `/api/unifiedgroups` | `[Authorize]` | Alle authenticated users |
| GET | `/api/unifiedgroups/{id}` | `[Authorize]` | Alle authenticated users |
| GET | `/api/unifiedgroups/{id}/members` | `[Authorize]` | Alle authenticated users |
| GET | `/api/unifiedgroups/preview` | `[Authorize]` | Alle authenticated users |
| POST | `/api/unifiedgroups/dynamic` | `CanManageGroups` | Alleen ICT Super Admin |
| PUT | `/api/unifiedgroups/dynamic/{id}` | `CanManageGroups` | Alleen ICT Super Admin |
| DELETE | `/api/unifiedgroups/dynamic/{id}` | `CanManageGroups` | Alleen ICT Super Admin |
| POST | `/api/unifiedgroups/dynamic/{id}/evaluate` | `[Authorize]` | Alle authenticated users |
| POST | `/api/unifiedgroups/local` | `CanManageGroups` | Alleen ICT Super Admin |
| PUT | `/api/unifiedgroups/local/{id}` | `CanManageGroups` | Alleen ICT Super Admin |
| DELETE | `/api/unifiedgroups/local/{id}` | `CanManageGroups` | Alleen ICT Super Admin |
| POST | `/api/unifiedgroups/local/{groupId}/members/{employeeId}` | `CanManageGroups` | Alleen ICT Super Admin |
| DELETE | `/api/unifiedgroups/local/{groupId}/members/{employeeId}` | `CanManageGroups` | Alleen ICT Super Admin |
| GET | `/api/unifiedgroups/export/emails` | `[Authorize]` | Alle authenticated users |
| GET | `/api/unifiedgroups/export/mailto` | `[Authorize]` | Alle authenticated users |

**Observaties**:
- Read endpoints zijn correct (alle authenticated users)
- Alle write endpoints gebruiken `CanManageGroups` (te restrictief)
- Exchange groepen zijn read-only via service layer (correct)
- Export endpoints zijn open (acceptabel voor communicatie use case)

### 1.3 EventsController

**Locatie**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Controllers\EventsController.cs`

**Relevante endpoints met autorisatie**:

| HTTP Method | Endpoint | Policy | Huidige toegang |
|-------------|----------|--------|-----------------|
| GET | `/api/events` | `[Authorize]` | Alle authenticated users |
| GET | `/api/events/{id}` | `[Authorize]` | Alle authenticated users |
| POST | `/api/events` | `CanEditEmployees` | ICT, HR, Sector Mgr, Diensthoofd |
| PUT | `/api/events/{id}` | `CanEditEmployees` | ICT, HR, Sector Mgr, Diensthoofd |
| POST | `/api/events/{id}/versturen` | `CanEditEmployees` | ICT, HR, Sector Mgr, Diensthoofd |
| POST | `/api/events/{id}/annuleren` | `CanEditEmployees` | ICT, HR, Sector Mgr, Diensthoofd |
| DELETE | `/api/events/{id}` | `CanDeleteEmployees` | Alleen ICT, HR Admin |
| POST | `/api/events/preview-ontvangers` | `[Authorize]` | Alle authenticated users |

**Observaties**:
- Evenementen kunnen aangemaakt worden door editor roles (correct)
- Gebruikt `CanEditEmployees` policy (pragmatisch, maar semantisch niet ideaal)
- Werkt met `DistributieGroepId` (references old DistributionGroups, mogelijk legacy?)

**Potentieel probleem**: EventsController refereert naar `DistributieGroep` en `EmployeeGroupMemberships`, wat mogelijk verwijst naar oude DistributionGroups systeem in plaats van het nieuwe UnifiedGroups systeem.

### 1.4 App Roles

**Locatie**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Authorization\AppRoles.cs`

**Gedefinieerde rollen**:

```csharp
public const string IctSuperAdmin = "ict_super_admin";
public const string HrAdmin = "hr_admin";
public const string SectorManager = "sectormanager";
public const string Diensthoofd = "diensthoofd";
public const string Medewerker = "medewerker";

public static readonly string[] AdminRoles = { IctSuperAdmin, HrAdmin };
public static readonly string[] ValidatorRoles = { IctSuperAdmin, HrAdmin, SectorManager, Diensthoofd };
public static readonly string[] EditorRoles = { IctSuperAdmin, HrAdmin, SectorManager, Diensthoofd };
```

**Analyse**:
- `AdminRoles` bevat `IctSuperAdmin` en `HrAdmin` (correct)
- Geen specifieke rol-array voor groepsbeheer
- EditorRoles wordt gebruikt voor employee editing (correct)

---

## 2. Gewenste Situatie

### 2.1 Scope Definitie

**Djoppie-Hive is bedoeld voor**:

1. **Communicatie voor events** - Uitnodigingen versturen naar personeel
2. **Medewerkersbeheer** - Raadplegen en beheren van employees (users)
3. **Externen beheer** - Users zoals SUPPORT_ accounts

**Djoppie-Hive is NIET bedoeld voor**:

- Applicatie-toegangsbeheer (dat is ICT-taak via Entra ID App Roles)
- Microsoft 365 groepsbeheer (dat gebeurt in M365 portal)
- Security group management voor systemen

### 2.2 Groepen Taxonomie

Het Hybrid Groups System heeft drie soorten groepen met verschillende beheer-niveaus:

| Groep Type | Bron | Beheer Door | Create | Edit | Delete | Leden Beheren |
|------------|------|-------------|--------|------|--------|---------------|
| **Exchange** | Microsoft 365 (MG- groups) | M365 Admin (ICT) | Nee | Nee | Nee | Nee |
| **Dynamic** | Hive Database (filter-based) | HR Admin, ICT | Ja | Ja | Ja* | N/A (auto) |
| **Local** | Hive Database (manual) | HR Admin, ICT | Ja | Ja | Ja | Ja |

*\* System Dynamic Groups (bijv. "Alle Vrijwilligers") kunnen niet verwijderd worden.*

### 2.3 HR Admin Permissies

**HR Admin moet kunnen**:

1. **Lokale groepen** (Local Groups):
   - Aanmaken (voor specifieke communicatie, bijv. "Politie Diepenbeek")
   - Bewerken (naam, beschrijving, email wijzigen)
   - Verwijderen (indien niet meer nodig)
   - Leden toevoegen/verwijderen (handmatig membership management)

2. **Dynamische groepen** (Dynamic Groups):
   - Aanmaken (voor filter-based segmentatie, bijv. "Medewerkers Sector Organisatie")
   - Bewerken (filters aanpassen)
   - Verwijderen (behalve system groups)
   - Evalueren (herberekenen membership op basis van filters)

3. **Exchange groepen** (Exchange Groups):
   - Alleen LEZEN (read-only view)
   - Leden raadplegen
   - Gebruiken in evenementen en uitnodigingen

4. **Export operaties**:
   - Email adressen exporteren (CSV)
   - Mailto links genereren

**HR Admin kan NIET**:

- Exchange groepen aanmaken/wijzigen (gebeurt in M365)
- Entra ID App Roles toewijzen (ICT-taak)
- System settings wijzigen
- Audit logs beheren

### 2.4 Sector Manager & Diensthoofd Permissies

**Vraag voor besluitvorming**: Mogen Sector Managers en Diensthoofden ook lokale groepen aanmaken?

**Optie A - Alleen admins** (conservatief):
- Alleen ICT Super Admin en HR Admin kunnen groepen beheren
- Sector Managers/Diensthoofden kunnen groepen GEBRUIKEN in evenementen
- Eenvoudiger te onderhouden, minder risico op "groepen chaos"

**Optie B - Ook managers** (pragmatisch):
- Sector Managers kunnen lokale groepen aanmaken binnen hun sector
- Diensthoofden kunnen lokale groepen aanmaken binnen hun dienst
- Meer autonomie, sneller werken, maar meer complexiteit

**Aanbeveling**: Start met **Optie A**. Evalueer na 3 maanden of uitbreiding naar Optie B nodig is op basis van feedback.

---

## 3. Refactor Plan

### 3.1 Fase 1: Authorization Policy Updates

**Bestand**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Authorization\AuthorizationExtensions.cs`

**Wijziging 1**: Hernoem en herdefinieer `CanManageGroups`

**VOOR**:
```csharp
// Manage groups - ICT admin only
options.AddPolicy(PolicyNames.CanManageGroups, policy =>
    policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin)));
```

**NA** (Optie A - conservatief):
```csharp
// Manage local and dynamic groups - admins only
// Exchange groups remain read-only (managed via M365)
options.AddPolicy(PolicyNames.CanManageLocalGroups, policy =>
    policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin, AppRoles.HrAdmin)));
```

**NA** (Optie B - pragmatisch):
```csharp
// Manage local and dynamic groups - editors with scope restrictions
// Exchange groups remain read-only (managed via M365)
options.AddPolicy(PolicyNames.CanManageLocalGroups, policy =>
    policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.EditorRoles)));
```

**Wijziging 2**: Voeg nieuwe policy toe voor group scope enforcement (optioneel, toekomst)

```csharp
// Future: Enforce group management scope based on user's sector/dienst
// This would use GroupScopeAuthorizationHandler to check if user can manage
// groups within their organizational scope
options.AddPolicy(PolicyNames.CanManageGroupsWithScope, policy =>
{
    policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.EditorRoles));
    policy.Requirements.Add(new GroupScopeRequirement()); // To be implemented
});
```

**Rationale**:
- Scheidt read-only Exchange groepen van beheerbare lokale/dynamische groepen
- HR Admin krijgt voldoende permissies voor communicatie use case
- Policy naam reflecteert doel beter (`CanManageLocalGroups` vs generieke `CanManageGroups`)

### 3.2 Fase 2: PolicyNames Constants Update

**Bestand**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Authorization\PolicyNames.cs`

**Wijzigingen**:

```csharp
// OUDE NAAM (deprecate)
[Obsolete("Use CanManageLocalGroups instead. Exchange groups are read-only.")]
public const string CanManageGroups = "CanManageGroups";

// NIEUWE NAAM
/// <summary>Can manage local and dynamic groups (Exchange groups remain read-only)</summary>
public const string CanManageLocalGroups = "CanManageLocalGroups";
```

**Rationale**:
- Backward compatibility via `[Obsolete]` attribute
- Duidelijke naamgeving voor toekomstige ontwikkelaars

### 3.3 Fase 3: UnifiedGroupsController Updates

**Bestand**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Controllers\UnifiedGroupsController.cs`

**Wijzigingen**: Vervang alle `PolicyNames.CanManageGroups` door `PolicyNames.CanManageLocalGroups`

**Te wijzigen regels**:

```csharp
// Regel 108
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups

// Regel 133
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups

// Regel 158
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups

// Regel 209
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups

// Regel 234
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups

// Regel 259
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups

// Regel 281
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups

// Regel 307
[Authorize(Policy = PolicyNames.CanManageLocalGroups)] // was CanManageGroups
```

**Geen wijzigingen** voor:
- Read endpoints (GET requests) - blijven `[Authorize]`
- Export endpoints - blijven `[Authorize]`
- Evaluate endpoint (regel 184) - blijft `[Authorize]` (lezen, geen schrijven)

**Rationale**:
- HR Admin kan nu lokale en dynamische groepen beheren
- Exchange groepen blijven read-only via service layer (guard in UnifiedGroupService)
- Evaluate is een read-operatie (berekent members zonder te wijzigen)

### 3.4 Fase 4: Service Layer Guards (Preventief)

**Bestand**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.Infrastructure\Services\UnifiedGroupService.cs`

**Controle**: Verifieer dat Exchange groepen NOOIT gewijzigd kunnen worden, zelfs als controller-autorisatie gefaald zou hebben.

**Huidige implementatie analyse**:

| Methode | Exchange Support | Status |
|---------|-----------------|--------|
| `GetAllGroupsAsync` | Ja (read) | OK - read-only |
| `GetGroupByIdAsync` | Ja (read) | OK - read-only |
| `GetGroupMembersAsync` | Ja (read) | OK - delegates to IDistributionGroupService |
| `CreateDynamicGroupAsync` | Nee | OK - alleen database groups |
| `UpdateDynamicGroupAsync` | Nee | OK - alleen database groups |
| `DeleteDynamicGroupAsync` | Nee | OK - alleen database groups |
| `CreateLocalGroupAsync` | Nee | OK - alleen database groups |
| `UpdateLocalGroupAsync` | Nee | OK - alleen database groups |
| `DeleteLocalGroupAsync` | Nee | OK - alleen database groups |
| `AddMemberToLocalGroupAsync` | Nee | OK - alleen local groups |
| `RemoveMemberFromLocalGroupAsync` | Nee | OK - alleen local groups |

**Conclusie**: Service layer heeft al correcte guards. Alle write operaties werken alleen op database groups (Dynamic/Local). Exchange groepen zijn inherent read-only omdat ze via `IDistributionGroupService` komen.

**Geen wijzigingen nodig**.

### 3.5 Fase 5: EventsController Review (Optioneel)

**Bestand**: `C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API\Controllers\EventsController.cs`

**Probleem**: EventsController gebruikt `CanEditEmployees` policy voor evenement-beheer. Dit werkt, maar is semantisch niet ideaal.

**Analyse**:

```csharp
// Regel 91
[Authorize(Policy = PolicyNames.CanEditEmployees)]
public async Task<ActionResult<EventDto>> Create(...)

// Regel 150
[Authorize(Policy = PolicyNames.CanEditEmployees)]
public async Task<ActionResult<EventDto>> Update(...)

// Regel 219
[Authorize(Policy = PolicyNames.CanEditEmployees)]
public async Task<ActionResult<EventDto>> Versturen(...)

// Regel 272
[Authorize(Policy = PolicyNames.CanEditEmployees)]
public async Task<ActionResult<EventDto>> Annuleren(...)

// Regel 299
[Authorize(Policy = PolicyNames.CanDeleteEmployees)]
public async Task<IActionResult> Delete(...)
```

**Aanbeveling**: Creëer optioneel een nieuwe policy `CanManageEvents` voor betere semantiek.

**Nieuwe policy** (voeg toe aan `AuthorizationExtensions.cs`):

```csharp
// Manage events and invitations - editor roles
options.AddPolicy(PolicyNames.CanManageEvents, policy =>
    policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.EditorRoles)));
```

**Nieuwe constant** (voeg toe aan `PolicyNames.cs`):

```csharp
/// <summary>Can create and manage events and invitations</summary>
public const string CanManageEvents = "CanManageEvents";
```

**Wijzigingen in EventsController**:

```csharp
// Vervang alle CanEditEmployees door CanManageEvents (behalve Delete)
[Authorize(Policy = PolicyNames.CanManageEvents)]

// Delete blijft CanDeleteEmployees (of CanManageEvents - beide werken)
```

**Prioriteit**: **Lage prioriteit**. Huidige implementatie werkt functioneel correct. Dit is alleen voor semantische verbetering. Kan gedaan worden in aparte cleanup sprint.

### 3.6 Fase 6: Frontend Permissies (Optioneel)

**Bestand**: `C:\Djoppie\Djoppie-Hive\hr-personeel\src\config\authConfig.ts` (indien aanwezig)

**Controle**: Verifieer of frontend role-based UI rendering moet aangepast worden.

**Zoek naar**:
- Knoppen om groepen aan te maken (Create Group buttons)
- Conditionele rendering op basis van `ict_super_admin` role
- Permission checks in React components

**Aanbeveling**: Voer een grep uit naar hardcoded role checks:

```bash
# Zoek naar ICT role checks in frontend
grep -r "ict_super_admin" hr-personeel/src

# Zoek naar groep-management UI
grep -r "CreateGroup\|NewGroup\|ManageGroup" hr-personeel/src
```

**Wijzigingen** (indien nodig):

```typescript
// VOOR
const canManageGroups = userRoles.includes('ict_super_admin');

// NA
const canManageGroups = userRoles.includes('ict_super_admin') || userRoles.includes('hr_admin');
```

**Prioriteit**: **Gemiddelde prioriteit**. Frontend zou al moeten werken als backend correct is (API errors tonen indien geen toegang). Dit is vooral voor UX verbetering (knoppen tonen/verbergen).

---

## 4. Implementatie Stappenplan

### Stap 1: Backend Authorization (Kritisch)

**Prioriteit**: Hoog - Blokkeert HR gebruik
**Geschatte tijd**: 1 uur
**Risk**: Laag (read-only blijft read-only via service layer)

1. Update `AuthorizationExtensions.cs`:
   - Voeg `CanManageLocalGroups` policy toe
   - Kies tussen Optie A (admins only) of Optie B (editors)

2. Update `PolicyNames.cs`:
   - Voeg `CanManageLocalGroups` constant toe
   - Markeer oude `CanManageGroups` als `[Obsolete]` (backward compatibility)

3. Update `UnifiedGroupsController.cs`:
   - Vervang alle 8 instances van `CanManageGroups` door `CanManageLocalGroups`

4. Compile en run backend:
   ```bash
   cd src/backend/DjoppieHive.API
   dotnet build
   dotnet run
   ```

5. Test met Swagger (http://localhost:5014/swagger):
   - Authenticeer als HR Admin
   - Probeer lokale groep aan te maken (POST /api/unifiedgroups/local)
   - Verificeer success response (201 Created)

### Stap 2: Manual Testing (Kritisch)

**Prioriteit**: Hoog - Validatie
**Geschatte tijd**: 30 minuten

**Test Scenario's**:

| Scenario | User | Action | Expected Result |
|----------|------|--------|-----------------|
| 1 | HR Admin | GET /api/unifiedgroups | 200 OK - alle groepen zichtbaar |
| 2 | HR Admin | POST /api/unifiedgroups/local | 201 Created - groep aangemaakt |
| 3 | HR Admin | PUT /api/unifiedgroups/local/{id} | 200 OK - groep gewijzigd |
| 4 | HR Admin | DELETE /api/unifiedgroups/local/{id} | 204 No Content - groep verwijderd |
| 5 | HR Admin | POST /api/unifiedgroups/dynamic | 201 Created - dynamic groep aangemaakt |
| 6 | HR Admin | GET /api/unifiedgroups/{exchangeId}/members | 200 OK - Exchange leden zichtbaar |
| 7 | Medewerker | POST /api/unifiedgroups/local | 403 Forbidden - geen toegang |
| 8 | Diensthoofd | POST /api/unifiedgroups/local | Optie A: 403, Optie B: 201 |

**Test Data**:

```json
// POST /api/unifiedgroups/local
{
  "displayName": "Test Lokale Groep HR",
  "description": "Test groep aangemaakt door HR Admin",
  "email": "test-hr@diepenbeek.be",
  "initialMemberIds": []
}

// POST /api/unifiedgroups/dynamic
{
  "displayName": "Test Dynamische Groep HR",
  "description": "Test groep met filters",
  "filterCriteria": {
    "employeeTypes": ["Personeel"],
    "alleenActief": true
  }
}
```

### Stap 3: Events Integration Test (Gemiddeld)

**Prioriteit**: Gemiddeld - Verifieert end-to-end flow
**Geschatte tijd**: 30 minuten

1. Login als HR Admin
2. Navigeer naar Events pagina
3. Maak een nieuw evenement aan:
   - Selecteer meerdere groepen (Exchange + Local + Dynamic)
   - Gebruik preview functie
   - Sla op als concept
4. Verificeer dat alle groepen correct getoond worden
5. Verstuur evenement
6. Controleer dat ontvangers correct berekend zijn

### Stap 4: Frontend UI Improvements (Optioneel)

**Prioriteit**: Laag - UX verbetering
**Geschatte tijd**: 1 uur

1. Zoek naar role checks in frontend:
   ```bash
   cd hr-personeel
   grep -rn "ict_super_admin" src/
   grep -rn "canManage" src/
   ```

2. Update permission checks om `hr_admin` te includeren

3. Test in browser:
   - Login als HR Admin
   - Verificeer dat "Nieuwe Groep" knoppen zichtbaar zijn
   - Verificeer dat groep management UI toegankelijk is

### Stap 5: EventsController Semantic Cleanup (Optioneel)

**Prioriteit**: Laag - Code kwaliteit
**Geschatte tijd**: 30 minuten

1. Voeg `CanManageEvents` policy toe (zie Fase 5)
2. Update EventsController om nieuwe policy te gebruiken
3. Update tests (indien aanwezig)
4. Compile, test, commit

### Stap 6: Documentation Updates

**Prioriteit**: Gemiddeld - Kennisoverdracht
**Geschatte tijd**: 30 minuten

Update de volgende bestanden:

1. **CLAUDE.md**:
   ```markdown
   ## Authorization Policies

   - `CanManageLocalGroups` - HR Admin en ICT Admin kunnen lokale en dynamische groepen beheren
   - `CanManageGroups` - [DEPRECATED] Gebruik `CanManageLocalGroups`
   ```

2. **GEBRUIKERSROLLEN.md**:
   - Update HR Admin permissies sectie
   - Voeg groepsbeheer toe aan HR Admin capabilities
   - Verduidelijk Exchange vs Local vs Dynamic groups

3. **API_DOCUMENTATION.md**:
   - Update UnifiedGroups endpoints met nieuwe policy naam
   - Voeg security note toe over Exchange read-only

### Stap 7: Deployment

**Prioriteit**: Hoog - Productie rollout
**Geschatte tijd**: 1 uur

1. Commit changes met duidelijke message:
   ```bash
   git add .
   git commit -m "Refactor: Enable HR Admin to manage local and dynamic groups

   - Changed CanManageGroups policy to CanManageLocalGroups
   - Added HR Admin to group management permissions
   - Exchange groups remain read-only (managed via M365)
   - Updated UnifiedGroupsController authorization

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

2. Push naar develop branch
3. Test in Azure DEV environment
4. Merge naar main
5. Deploy naar productie

---

## 5. Risk Assessment & Mitigations

### 5.1 Risico: HR Admin wijzigt Exchange groepen

**Waarschijnlijkheid**: Zeer laag
**Impact**: Gemiddeld (zou moeten falen via service layer)

**Mitigatie**:
- Service layer heeft geen write methods voor Exchange groepen
- `IDistributionGroupService` is inherent read-only
- Controller heeft geen endpoints voor Exchange write operations
- Zelfs met verkeerde autorisatie policy zou write operatie falen in service layer

**Preventieve maatregel**: Add explicit guard in UnifiedGroupService (defensief):

```csharp
// In UnifiedGroupService.cs - preventieve check
private void ThrowIfExchangeGroup(string groupId)
{
    var (source, _) = ParseGroupId(groupId);
    if (source == "Exchange")
    {
        throw new InvalidOperationException(
            "Exchange groups are read-only and managed via Microsoft 365. " +
            "Only local and dynamic groups can be modified in Djoppie-Hive.");
    }
}

// Gebruik in write methods
public async Task<UnifiedGroupDto?> UpdateLocalGroupAsync(Guid id, ...)
{
    ThrowIfExchangeGroup($"local:{id}"); // Preventieve check
    // ... rest van methode
}
```

**Prioriteit**: Laag (nice-to-have, niet kritisch)

### 5.2 Risico: Sector Manager creëert te veel groepen (chaos)

**Waarschijnlijkheid**: Laag (alleen als Optie B gekozen wordt)
**Impact**: Laag (administratieve overhead)

**Mitigatie**:
- Start met Optie A (alleen admins)
- Implementeer naming conventions (bijv. "SECTOR-Organisatie-Groep X")
- Voeg audit logging toe voor groep creatie
- Periodieke review van aangemaakte groepen door HR Admin

**Monitoring**:
```sql
-- Query om nieuwe groepen te monitoren
SELECT DisplayName, CreatedBy, CreatedAt
FROM LocalGroups
WHERE CreatedAt > DATEADD(month, -1, GETUTCDATE())
ORDER BY CreatedAt DESC;
```

### 5.3 Risico: Frontend toont verkeerde knoppen

**Waarschijnlijkheid**: Gemiddeld (als frontend niet geüpdatet wordt)
**Impact**: Laag (gebruiker krijgt API error, geen data loss)

**Mitigatie**:
- Backend authorizatie is leidend (defense in depth)
- Frontend UI is alleen voor UX, niet voor security
- API errors worden correct getoond aan gebruiker

**Preventieve maatregel**: Update frontend in dezelfde sprint als backend

### 5.4 Risico: Bestaande dynamische groepen verdwijnen

**Waarschijnlijkheid**: Zeer laag
**Impact**: Gemiddeld (system groups zijn beschermd)

**Mitigatie**:
- System groups (IsSystemGroup = true) kunnen niet verwijderd worden
- Delete endpoint heeft guard in service layer (regel 233-237)
- Database constraint zou toegevoegd kunnen worden

**Preventieve maatregel**: Add database check constraint (optioneel):

```sql
-- Voeg check constraint toe aan DynamicGroups tabel
ALTER TABLE DynamicGroups
ADD CONSTRAINT CK_DynamicGroups_SystemGroupProtection
CHECK (IsSystemGroup = 0 OR (IsSystemGroup = 1 AND IsDeleted = 0));
```

---

## 6. Testing Checklist

### Unit Tests (Optioneel, indien test suite aanwezig is)

- [ ] `DatabaseRoleAuthorizationHandler` test met `CanManageLocalGroups` policy
- [ ] `UnifiedGroupService` tests blijven groen (geen service layer wijzigingen)
- [ ] Authorization policy registration test

### Integration Tests (Swagger/Postman)

- [ ] HR Admin kan lokale groep aanmaken
- [ ] HR Admin kan dynamische groep aanmaken
- [ ] HR Admin kan lokale groep wijzigen
- [ ] HR Admin kan dynamische groep wijzigen
- [ ] HR Admin kan lokale groep verwijderen
- [ ] HR Admin kan dynamische groep verwijderen (non-system)
- [ ] HR Admin kan NIET system dynamische groep verwijderen
- [ ] HR Admin kan leden toevoegen aan lokale groep
- [ ] HR Admin kan leden verwijderen uit lokale groep
- [ ] HR Admin kan Exchange groepen LEZEN
- [ ] HR Admin kan GEEN Exchange groepen wijzigen (endpoint bestaat niet)
- [ ] Medewerker kan GEEN groepen aanmaken (403 Forbidden)
- [ ] Diensthoofd gedrag correct (afhankelijk van Optie A/B keuze)

### UI Tests (Manual)

- [ ] HR Admin ziet "Nieuwe Groep" knop (indien frontend geüpdatet)
- [ ] HR Admin kan groep aanmaken via UI
- [ ] HR Admin kan groep bewerken via UI
- [ ] Exchange groepen tonen read-only indicator (cloud icon)
- [ ] Lokale groepen tonen edit/delete knoppen
- [ ] Events pagina kan alle groep-types gebruiken
- [ ] Preview functie werkt met mixed group selection

### Regression Tests

- [ ] ICT Super Admin kan nog steeds alles beheren
- [ ] Read endpoints werken voor alle authenticated users
- [ ] Export endpoints werken correct
- [ ] Evenementen kunnen verstuurd worden naar groepen
- [ ] Audit logging werkt correct voor groep operaties

---

## 7. Rollback Plan

Indien refactoring onverwachte problemen veroorzaakt:

### Scenario 1: Backend compilatie fout

**Actie**: Fix syntax errors, hercompile, redeploy

### Scenario 2: Authorization werkt niet correct

**Rollback stappen**:

1. Revert `AuthorizationExtensions.cs`:
   ```csharp
   // Zet terug naar oude policy
   options.AddPolicy(PolicyNames.CanManageGroups, policy =>
       policy.Requirements.Add(new DatabaseRoleRequirement(AppRoles.IctSuperAdmin)));
   ```

2. Revert `UnifiedGroupsController.cs`:
   ```bash
   git checkout HEAD~1 -- src/backend/DjoppieHive.API/Controllers/UnifiedGroupsController.cs
   ```

3. Redeploy backend

### Scenario 3: HR Admin heeft te veel permissies

**Actie**: Change policy van `HrAdmin` terug naar alleen `IctSuperAdmin`, redeploy

### Scenario 4: Productie issues

**Full rollback**:

```bash
git revert HEAD
git push origin develop
# Trigger Azure DevOps pipeline redeploy
```

---

## 8. Future Considerations

### 8.1 Scope-Based Group Management

**Idee**: Sector Managers kunnen alleen groepen beheren binnen hun sector.

**Implementatie**:

1. Voeg `SectorId` toe aan `LocalGroup` en `DynamicGroup` entities
2. Implementeer `GroupScopeAuthorizationHandler` (analog aan `EmployeeScopeAuthorizationHandler`)
3. Voeg `CanManageGroupsWithScope` policy toe
4. Update controllers om scope te valideren

**Database wijziging**:

```sql
ALTER TABLE LocalGroups
ADD SectorId uniqueidentifier NULL,
    DienstId uniqueidentifier NULL;

ALTER TABLE DynamicGroups
ADD SectorId uniqueidentifier NULL,
    DienstId uniqueidentifier NULL;
```

**Prioriteit**: Lage prioriteit, alleen nodig als Optie B gekozen wordt en er te veel groepen ontstaan.

### 8.2 Group Templates

**Idee**: Voorgedefinieerde templates voor veelvoorkomende groep-types.

**Voorbeelden**:
- "Alle Medewerkers Sector X"
- "Verjaardagen Deze Maand"
- "Nieuwe Instroom Dit Jaar"

**Implementatie**: Voeg `GroupTemplate` tabel toe met predefined filter criteria.

### 8.3 Group Approval Workflow

**Idee**: Nieuwe groepen moeten goedgekeurd worden door HR Admin voordat ze actief zijn.

**Status flow**:
```
Concept → PendingApproval → Active → Archived
```

**Rationale**: Voorkomt wildgroei, maar voegt administratieve overhead toe.

**Aanbeveling**: Alleen implementeren als er daadwerkelijk wildgroei optreedt in productie.

### 8.4 Integration met Microsoft 365

**Idee**: Write-back naar Microsoft 365 (creëer M365 groups vanuit Hive).

**Waarschuwing**: Zeer complex, veel edge cases, hoge risk. Alleen overwegen als er zeer sterke business case is.

**Alternatieven**:
- Gebruik mailto: links (al geïmplementeerd)
- Gebruik Power Automate voor automatische M365 group creatie
- Blijf bij huidige workflow (ICT maakt M365 groups, Hive toont ze)

---

## 9. Beslissingen Voor Product Owner

### Beslissing 1: Optie A vs Optie B

**Vraag**: Wie mag lokale en dynamische groepen beheren?

| Optie | Rollen | Voor | Tegen |
|-------|--------|------|-------|
| **A** | ICT + HR Admin | Controle, eenvoud | Minder autonoom |
| **B** | ICT + HR + Sector Mgr + Diensthoofd | Autonomie, snelheid | Meer groepen, overhead |

**Aanbeveling**: **Optie A** (conservatief). Evalueer na 3 maanden.

**Keuze**: [ ] Optie A  [ ] Optie B

---

### Beslissing 2: EventsController Policy

**Vraag**: Moeten we `CanManageEvents` policy toevoegen voor semantische verbetering?

| Optie | Voor | Tegen |
|-------|------|-------|
| **Ja** | Betere semantiek, duidelijkere code | Extra werk, meer policies |
| **Nee** | Werkt nu al, minder werk | Minder duidelijke code |

**Aanbeveling**: **Nee** voor nu. Kan later in cleanup sprint.

**Keuze**: [ ] Ja, nu  [ ] Nee, later  [ ] Nee, never

---

### Beslissing 3: Preventieve Service Layer Guards

**Vraag**: Moeten we expliciete `ThrowIfExchangeGroup()` guards toevoegen?

| Optie | Voor | Tegen |
|-------|------|-------|
| **Ja** | Defense in depth, duidelijke errors | Redundant (geen Exchange write endpoints) |
| **Nee** | Eenvoudiger, minder code | Minder defensief |

**Aanbeveling**: **Nee**, huidige guards zijn voldoende. Write endpoints voor Exchange bestaan niet.

**Keuze**: [ ] Ja  [ ] Nee

---

## 10. Conclusie

### Samenvatting

Deze refactoring is een **low-risk, high-value** verbetering:

- **Minimal code changes**: Slechts 3 bestanden wijzigen (AuthorizationExtensions, PolicyNames, UnifiedGroupsController)
- **No service layer changes**: Alle guards zijn al aanwezig
- **Clear rollback path**: Simpele revert mogelijk
- **Immediate business value**: HR Admin kan direct werken met groepen voor communicatie

### Geschatte Effort

| Fase | Tijd | Prioriteit |
|------|------|-----------|
| Backend Authorization (Fase 1-3) | 1 uur | Hoog |
| Testing (Stap 2-3) | 1 uur | Hoog |
| Documentation (Stap 6) | 30 min | Gemiddeld |
| Frontend UI (Stap 4) | 1 uur | Laag |
| Events Cleanup (Stap 5) | 30 min | Laag |

**Totaal (kritisch pad)**: 2-3 uur
**Totaal (inclusief optioneel)**: 4-5 uur

### Go/No-Go Criteria

**GO** als:
- [ ] Product Owner keurt Optie A of B goed
- [ ] HR Admin use case is duidelijk (communicatie, niet security)
- [ ] Test environment beschikbaar is
- [ ] Rollback plan geaccepteerd

**NO-GO** als:
- [ ] Er onduidelijkheid is over scope (communicatie vs security)
- [ ] Er geen test-account voor HR Admin is
- [ ] Er zorgen zijn over Exchange groep security

### Next Steps

1. **Product Owner**: Beslis over Optie A vs Optie B
2. **Development**: Implement Fase 1-3 (backend authorization)
3. **Testing**: Execute test checklist (Stap 2-3)
4. **Deployment**: Deploy naar DEV environment
5. **Validation**: HR Admin test in DEV
6. **Production**: Deploy naar productie
7. **Monitor**: Check audit logs voor 1 week
8. **Evaluate**: Review na 1 maand, besluit over Optie B indien nodig

---

## Bijlagen

### Bijlage A: Relevante Bestanden

```
src/backend/DjoppieHive.API/
├── Authorization/
│   ├── AuthorizationExtensions.cs      [WIJZIGEN]
│   ├── PolicyNames.cs                  [WIJZIGEN]
│   ├── AppRoles.cs                     [LEZEN]
│   ├── DatabaseRoleAuthorizationHandler.cs
│   └── GroupScopeAuthorizationHandler.cs
├── Controllers/
│   ├── UnifiedGroupsController.cs      [WIJZIGEN]
│   └── EventsController.cs             [OPTIONEEL WIJZIGEN]

src/backend/DjoppieHive.Core/
├── Interfaces/
│   └── IUnifiedGroupService.cs         [LEZEN]

src/backend/DjoppieHive.Infrastructure/
├── Services/
│   ├── UnifiedGroupService.cs          [LEZEN - guards verifiëren]
│   └── DistributionGroupService.cs     [LEZEN - read-only verifiëren]

docs/
├── refactor-hr-scope.md                [DIT DOCUMENT]
├── GEBRUIKERSROLLEN.md                 [UPDATEN]
├── API_DOCUMENTATION.md                [UPDATEN]
└── CLAUDE.md                           [UPDATEN]
```

### Bijlage B: Test Accounts

Voor testing heb je nodig:

| Rol | Account | Gebruik |
|-----|---------|---------|
| ICT Super Admin | jo.wijnen@diepenbeek.be | Control group (moet alles kunnen) |
| HR Admin | [HR admin account] | Test subject (nieuwe permissies) |
| Sector Manager | [Sector manager account] | Test Optie B indien gekozen |
| Medewerker | [Regular employee] | Negative test (mag niets) |

### Bijlage C: API Endpoints Quick Reference

**Read Endpoints** (blijven `[Authorize]`):
- GET /api/unifiedgroups
- GET /api/unifiedgroups/{id}
- GET /api/unifiedgroups/{id}/members
- GET /api/unifiedgroups/preview
- GET /api/unifiedgroups/export/emails
- GET /api/unifiedgroups/export/mailto
- POST /api/unifiedgroups/dynamic/{id}/evaluate

**Write Endpoints** (wijzigen naar `[Authorize(Policy = PolicyNames.CanManageLocalGroups)]`):
- POST /api/unifiedgroups/dynamic
- PUT /api/unifiedgroups/dynamic/{id}
- DELETE /api/unifiedgroups/dynamic/{id}
- POST /api/unifiedgroups/local
- PUT /api/unifiedgroups/local/{id}
- DELETE /api/unifiedgroups/local/{id}
- POST /api/unifiedgroups/local/{groupId}/members/{employeeId}
- DELETE /api/unifiedgroups/local/{groupId}/members/{employeeId}

---

**Document Eigenaar**: Project Orchestrator (Claude Code)
**Review**: Product Owner (Jo Wijnen)
**Implementatie**: Backend Architect
**Laatste Update**: 25 februari 2026
