# Djoppie-Hive API Documentation

## Swagger/OpenAPI Setup

De Djoppie-Hive API is volledig gedocumenteerd met **Swagger/OpenAPI 3.0** specificaties. Alle endpoints, request/response modellen, en authenticatie-eisen zijn gedocumenteerd via XML comments die automatisch worden geconverteerd naar interactieve API documentatie.

## Toegang tot Swagger UI

### Lokale Ontwikkeling

Wanneer de API in **Development mode** draait:

```bash
cd C:\Djoppie\Djoppie-Hive\src\backend\DjoppieHive.API
dotnet run
```

Swagger UI is beschikbaar op:

- **URL**: <http://localhost:5014/swagger>
- **Endpoint**: `/swagger/v1/swagger.json` (OpenAPI specificatie)

### Productie Omgeving

In **Production mode** is Swagger UI uitgeschakeld voor security redenen. Alleen de API endpoints zijn beschikbaar.

Voor productie moet je een API client gebruiken zoals:

- **Postman** (importeer de OpenAPI spec)
- **Insomnia**
- **curl** (command-line)

## Swagger UI Functionaliteit

### 1. Authenticatie

Djoppie-Hive API gebruikt **Microsoft Entra ID (Azure AD)** authenticatie met **Bearer tokens**.

#### Token verkrijgen

1. Authenticeer via MSAL (Microsoft Authentication Library)
2. Verkrijg een JWT token met scope: `api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user`
3. Gebruik het token in Swagger UI:
   - Klik op de **"Authorize"** knop (bovenaan rechts)
   - Voer je token in: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Klik **"Authorize"**

Nu worden alle API calls automatisch voorzien van de `Authorization: Bearer <token>` header.

#### Voorbeeld: Token verkrijgen met MSAL React

```typescript
import { useMsal } from "@azure/msal-react";

const { instance, accounts } = useMsal();

const request = {
  scopes: ["api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user"],
  account: accounts[0]
};

const response = await instance.acquireTokenSilent(request);
const token = response.accessToken;
```

### 2. Endpoint Grouping

Endpoints zijn gegroepeerd per functionaliteit met **Tags**:

| Tag | Beschrijving |
|-----|--------------|
| **Medewerkers** | CRUD operaties voor medewerkers, vrijwilligers en interims |
| **Gebruiker** | Ingelogde gebruiker informatie en rechten |
| **Synchronisatie** | Graph API sync van medewerkers en groepen |
| **Distributiegroepen** | MG- distributiegroepen beheer en hierarchie |
| **Audit & Compliance** | GDPR audit logs en wijzigingshistorie |
| **Rollenbeheer** | Gebruikersrollen en autorisaties (ICT Admin only) |
| **Vrijwilligers** | Vrijwilliger-specifieke endpoints |
| **Statistieken** | Dashboard KPI's en rapportage |
| **Evenementen** | Events en uitnodigingen beheer |
| **Validatie** | Validatie workflow voor wijzigingen |

### 3. Request/Response Examples

Elk endpoint documenteert:

- **HTTP Method** en **URL pattern**
- **Query parameters** met beschrijvingen
- **Request body** schema (met voorbeeld JSON)
- **Response codes** met betekenis
- **Response body** schema (met voorbeeld JSON)

#### Voorbeeld: Medewerker aanmaken

**Endpoint**: `POST /api/Employees`

**Request Body**:

```json
{
  "displayName": "Jan Janssen",
  "givenName": "Jan",
  "surname": "Janssen",
  "email": "jan.janssen@diepenbeek.be",
  "jobTitle": "Administratief medewerker",
  "department": "Burgerzaken",
  "employeeType": "Personeel",
  "arbeidsRegime": "Voltijds",
  "dienstId": "12345678-1234-1234-1234-123456789012",
  "startDatum": "2024-01-01T00:00:00Z",
  "telefoonnummer": "+32 11 123456",
  "isActive": true
}
```

**Response** (201 Created):

```json
{
  "id": "98765432-1234-1234-1234-123456789012",
  "displayName": "Jan Janssen",
  "email": "jan.janssen@diepenbeek.be",
  "employeeType": "Personeel",
  "arbeidsRegime": "Voltijds",
  "bron": "Handmatig",
  "isHandmatigToegevoegd": true,
  "validatieStatus": "Nieuw",
  "createdAt": "2024-12-01T10:30:00Z"
}
```

### 4. HTTP Status Codes

De API gebruikt standaard HTTP status codes:

| Code | Betekenis | Gebruik |
|------|-----------|---------|
| **200 OK** | Succesvol (GET, PUT) | Data opgehaald of bijgewerkt |
| **201 Created** | Resource aangemaakt (POST) | Nieuwe medewerker, rol, event, etc. |
| **204 No Content** | Succesvol zonder response body (DELETE) | Resource verwijderd |
| **400 Bad Request** | Validatiefout | Ongeldige input data |
| **401 Unauthorized** | Niet geauthenticeerd | Ontbrekend of ongeldig token |
| **403 Forbidden** | Geen toestemming | Onvoldoende rechten voor actie |
| **404 Not Found** | Resource niet gevonden | ID bestaat niet |
| **409 Conflict** | Conflict | Sync al bezig, duplicate entry |
| **429 Too Many Requests** | Rate limit | Te veel verzoeken (zie rate limiting) |
| **500 Internal Server Error** | Serverfout | Onverwachte fout |

### 5. Rate Limiting

De API implementeert rate limiting om misbruik te voorkomen:

| Limiet | Beschrijving |
|--------|--------------|
| **Global** | 100 requests per minuut per gebruiker/IP |
| **Sync** | 5 requests per 5 minuten |
| **Auth** | 10 requests per minuut |

Bij overschrijding krijg je een **429 Too Many Requests** met `Retry-After` header.

## API Endpoints Overzicht

### Medewerkers (`/api/Employees`)

| Endpoint | Method | Beschrijving | Auth |
|----------|--------|--------------|------|
| `/api/Employees` | GET | Alle medewerkers (met filters) | Authenticated |
| `/api/Employees/{id}` | GET | Specifieke medewerker | Authenticated |
| `/api/Employees` | POST | Nieuwe medewerker aanmaken | CanEditEmployees |
| `/api/Employees/{id}` | PUT | Medewerker bijwerken | CanEditEmployees |
| `/api/Employees/{id}` | DELETE | Medewerker verwijderen (soft delete) | CanDeleteEmployees |
| `/api/Employees/{id}/export` | GET | GDPR data export | CanViewAuditLogs |
| `/api/Employees/{id}/validatie` | PUT | Validatiestatus bijwerken | CanEditEmployees |
| `/api/Employees/search` | GET | Zoeken op naam/email | Authenticated |

**Query Parameters** (voor GET `/api/Employees`):

- `type`: EmployeeType filter (Personeel, Vrijwilliger, Interim, Extern, Stagiair)
- `regime`: ArbeidsRegime filter (Voltijds, Deeltijds, Vrijwilliger)
- `isActive`: true/false voor actief/inactief
- `dienstId`: Filter op dienst (GUID)
- `sectorId`: Filter op sector (GUID)
- `searchTerm`: Zoekterm voor naam/email
- `bron`: Gegevensbron filter (AzureAD, Handmatig)

### Synchronisatie (`/api/Sync`)

| Endpoint | Method | Beschrijving | Auth |
|----------|--------|--------------|------|
| `/api/Sync/uitvoeren` | POST | Start handmatige sync | CanSync |
| `/api/Sync/status` | GET | Sync status opvragen | Authenticated |
| `/api/Sync/geschiedenis` | GET | Sync geschiedenis | Authenticated |
| `/api/Sync/preview` | GET | Preview van te syncen data | CanSync |

### Distributiegroepen (`/api/DistributionGroups`)

| Endpoint | Method | Beschrijving | Auth |
|----------|--------|--------------|------|
| `/api/DistributionGroups` | GET | Alle MG- groepen | Authenticated |
| `/api/DistributionGroups/hierarchy` | GET | Volledige organisatiehierarchie | Authenticated |
| `/api/DistributionGroups/{id}` | GET | Specifieke groep | Authenticated |
| `/api/DistributionGroups/{id}/members` | GET | Groepsleden | Authenticated |
| `/api/DistributionGroups/{id}/members/{userId}` | POST | Lid toevoegen | CanManageGroups |
| `/api/DistributionGroups/{id}/members/{userId}` | DELETE | Lid verwijderen | CanManageGroups |

### Audit Logs (`/api/Audit`)

| Endpoint | Method | Beschrijving | Auth |
|----------|--------|--------------|------|
| `/api/Audit` | GET | Audit logs (gefilterd + gepagineerd) | CanViewAuditLogs |
| `/api/Audit/entity/{entityType}/{entityId}` | GET | Geschiedenis van specifieke entiteit | CanViewAuditLogs |
| `/api/Audit/options` | GET | Beschikbare filter opties | CanViewAuditLogs |

### Rollenbeheer (`/api/UserRoles`)

| Endpoint | Method | Beschrijving | Auth |
|----------|--------|--------------|------|
| `/api/UserRoles` | GET | Alle roltoekennningen | CanManageRoles |
| `/api/UserRoles/{id}` | GET | Specifieke roltoekennning | CanManageRoles |
| `/api/UserRoles/user/{entraObjectId}` | GET | Rollen voor gebruiker | CanManageRoles |
| `/api/UserRoles` | POST | Nieuwe rol toekennen | CanManageRoles |
| `/api/UserRoles/{id}` | PUT | Rol bijwerken | CanManageRoles |
| `/api/UserRoles/{id}` | DELETE | Rol verwijderen | CanManageRoles |
| `/api/UserRoles/search/users` | GET | Gebruikers zoeken | CanManageRoles |
| `/api/UserRoles/definitions` | GET | Beschikbare rollen | AllowAnonymous |

### Huidige Gebruiker (`/api/Me`)

| Endpoint | Method | Beschrijving | Auth |
|----------|--------|--------------|------|
| `/api/Me` | GET | Ingelogde gebruiker info + rechten | Authenticated |

**Response voorbeeld**:

```json
{
  "id": "abc123-def456",
  "email": "jan.janssen@diepenbeek.be",
  "displayName": "Jan Janssen",
  "roles": ["HrAdmin", "SectorManager"],
  "permissions": [
    "view_all_employees",
    "edit_employees",
    "validate_changes",
    "export_data",
    "view_audit_logs"
  ],
  "isAdmin": true,
  "sectorId": "12345678-1234-1234-1234-123456789012",
  "dienstId": null,
  "employeeId": "98765432-1234-1234-1234-123456789012"
}
```

### Validatieverzoeken (`/api/ValidatieVerzoeken`)

| Endpoint | Method | Beschrijving | Auth |
|----------|--------|--------------|------|
| `/api/ValidatieVerzoeken` | GET | Openstaande verzoeken | CanValidate |
| `/api/ValidatieVerzoeken/{id}` | GET | Specifiek verzoek | CanValidate |
| `/api/ValidatieVerzoeken/{id}/afhandelen` | POST | Verzoek afhandelen | CanValidate |
| `/api/ValidatieVerzoeken/aantal` | GET | Aantal openstaande verzoeken | CanValidate |

## Autorisatie Policies

De API gebruikt **policy-based authorization** met scoped toegang:

| Policy | Rollen | Beschrijving |
|--------|--------|--------------|
| **CanEditEmployees** | ICT Admin, HR Admin, Sector Manager, Diensthoofd | Medewerkers bewerken |
| **CanDeleteEmployees** | ICT Admin, HR Admin | Medewerkers verwijderen |
| **CanManageGroups** | ICT Admin | Distributiegroepen beheren |
| **CanSync** | ICT Admin, HR Admin | Synchronisatie uitvoeren |
| **CanViewAuditLogs** | ICT Admin, HR Admin | Audit logs bekijken |
| **CanManageRoles** | ICT Super Admin | Rollen beheren |
| **CanValidate** | ICT Admin, HR Admin, Sector Manager, Diensthoofd | Wijzigingen valideren |

### Scoped Toegang

Niet-admin gebruikers krijgen **automatisch gefilterde data** op basis van hun rol:

- **Sector Manager**: Alleen medewerkers in eigen sector
- **Diensthoofd**: Alleen medewerkers in eigen dienst
- **Medewerker**: Alleen eigen profiel

Dit wordt **server-side afgedwongen** - geen client-side filtering!

## GDPR Compliance

### Data Export

Endpoint: `GET /api/Employees/{id}/export`

Exporteert **alle** persoonlijke data van een medewerker in JSON formaat (GDPR Artikel 15 - Right of Access).

**Audit Logging**: Elke export wordt gelogd met:

- Wie heeft geëxporteerd
- Wanneer
- Voor welke medewerker

### Audit Trail

Alle wijzigingen worden gelogd in `AuditLogs` tabel:

- CRUD operaties
- Validatie status wijzigingen
- Roltoekennningen
- Synchronisatie acties

Audit logs zijn **onveranderbaar** (append-only) en bevatten:

- Old values (JSON)
- New values (JSON)
- User info (ID, email, naam)
- IP address
- Timestamp

## XML Documentation Coverage

Alle endpoints, DTOs en enums zijn gedocumenteerd met **XML comments**:

### Controllers

- ✅ **EmployeesController** - Volledig gedocumenteerd
- ✅ **MeController** - Volledig gedocumenteerd
- ✅ **SyncController** - Volledig gedocumenteerd
- ✅ **DistributionGroupsController** - Volledig gedocumenteerd
- ✅ **AuditController** - Volledig gedocumenteerd
- ✅ **UserRolesController** - Volledig gedocumenteerd
- ✅ **VrijwilligersController** - Volledig gedocumenteerd
- ✅ **StatisticsController** - Volledig gedocumenteerd
- ✅ **EventsController** - Volledig gedocumenteerd
- ✅ **ValidatieVerzoekenController** - Volledig gedocumenteerd

### DTOs (Core Project)

- ✅ **EmployeeDto** - Volledig gedocumenteerd met alle properties
- ✅ **CreateEmployeeDto** - Beschrijvingen voor alle velden
- ✅ **UpdateEmployeeDto** - Beschrijvingen voor alle velden
- ✅ Alle andere DTOs hebben XML comments

### Enums

- ✅ **EmployeeType** - Alle waarden gedocumenteerd
- ✅ **ArbeidsRegime** - Alle waarden gedocumenteerd
- ✅ **ValidatieStatus** - Alle waarden gedocumenteerd
- ✅ **AuditAction** - Alle waarden gedocumenteerd
- ✅ **EventType**, **EventStatus**, etc.

## Toegang tot OpenAPI Specificatie

De volledige OpenAPI 3.0 specificatie is beschikbaar als JSON:

**URL**: `http://localhost:5014/swagger/v1/swagger.json`

Deze specificatie kan worden geïmporteerd in:

- **Postman** (Collection import)
- **Insomnia** (Design Document)
- **Azure API Management**
- **Code generators** (NSwag, OpenAPI Generator)

### Voorbeeld: Importeren in Postman

1. Open Postman
2. **Import** → **Link**
3. Voer in: `http://localhost:5014/swagger/v1/swagger.json`
4. Klik **Continue** → **Import**
5. Alle endpoints worden automatisch toegevoegd als Postman collectie

## Best Practices voor API Gebruik

### 1. Authenticatie Token Vernieuwen

JWT tokens verlopen na een bepaalde tijd. Gebruik **silent token renewal**:

```typescript
try {
  const response = await instance.acquireTokenSilent(request);
  return response.accessToken;
} catch (error) {
  // Token verlopen - interactieve login vereist
  const response = await instance.acquireTokenPopup(request);
  return response.accessToken;
}
```

### 2. Error Handling

Alle errors volgen het **RFC 7807 Problem Details** formaat:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validatiefout",
  "status": 400,
  "detail": "Email is verplicht",
  "errors": {
    "email": ["Email field is required"]
  }
}
```

### 3. Rate Limiting

Monitor de response headers:

- `X-RateLimit-Limit`: Maximum aantal requests
- `X-RateLimit-Remaining`: Overgebleven requests
- `Retry-After`: Wacht tijd bij 429 (seconds)

### 4. Paginering

Voor grote datasets (audit logs):

- Gebruik `pageNumber` en `pageSize` query parameters
- Standaard: `pageSize=20`, `pageNumber=1`
- Response bevat `totalCount`, `totalPages`, `currentPage`

## Troubleshooting

### Swagger UI laadt niet

**Probleem**: `/swagger` geeft 404

**Oplossing**:

```bash
# Verificeer dat de app in Development mode draait
echo $ASPNETCORE_ENVIRONMENT  # Moet "Development" zijn
```

### XML Comments verschijnen niet

**Probleem**: Swagger toont geen beschrijvingen

**Oplossing**:

1. Controleer `DjoppieHive.API.csproj`:

   ```xml
   <GenerateDocumentationFile>true</GenerateDocumentationFile>
   ```

2. Rebuild project: `dotnet build`
3. Controleer of XML files bestaan:

   ```bash
   ls bin/Debug/net8.0/*.xml
   # Verwacht: DjoppieHive.API.xml, DjoppieHive.Core.xml
   ```

### Authenticatie werkt niet

**Probleem**: Elke API call geeft 401 Unauthorized

**Oplossing**:

1. Klik **Authorize** in Swagger UI
2. Voer **volledig** Bearer token in (niet alleen "Bearer ...")
3. Verificeer token scope: moet `access_as_user` bevatten
4. Check token expiry: `jwt.io` → decode token → check `exp` claim

## Contact & Support

**ICT Diepenbeek**

- Email: <ict@diepenbeek.be>
- Website: <https://www.diepenbeek.be>

**Tenant Info**:

- Tenant ID: `7db28d6f-d542-40c1-b529-5e5ed2aad545`
- API Client ID: `2b620e06-39ee-4177-a559-76a12a79320f`
- SPA Client ID: `2ea8a14d-ea05-40cc-af35-dd482bf8e235`
