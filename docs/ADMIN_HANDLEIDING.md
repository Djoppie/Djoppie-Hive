# Administrator Handleiding Djoppie-Hive

**Technische Beheerhandleiding - Gemeente Diepenbeek**

Versie: 1.0
Datum: Februari 2026

---

## Inhoudsopgave

1. [Systeemoverzicht](#systeemoverzicht)
2. [Architectuur](#architectuur)
3. [Configuratie](#configuratie)
4. [Rollenbeheer](#rollenbeheer)
5. [Audit Logging](#audit-logging)
6. [Synchronisatie](#synchronisatie)
7. [Beveiliging](#beveiliging)
8. [Onderhoud](#onderhoud)
9. [Troubleshooting](#troubleshooting)
10. [Azure Resources](#azure-resources)

---

## Systeemoverzicht

### Componenten

| Component | Technologie | Hosting |
|-----------|-------------|---------|
| Frontend | React 19 + TypeScript | Azure Static Web Apps |
| Backend API | ASP.NET Core 8.0 | Azure App Service |
| Database | SQL Server | Azure SQL Database |
| Authenticatie | Microsoft Entra ID | Azure |
| Geheimen | Azure Key Vault | Azure |
| Monitoring | Application Insights | Azure |

### URL's

| Omgeving | Frontend | Backend API |
|----------|----------|-------------|
| Development | localhost:5173 | localhost:5014 |
| Azure DEV | swa-djoppie-hive-dev-ui.azurestaticapps.net | app-djoppie-hive-dev-api.azurewebsites.net |

---

## Architectuur

### Applicatie Lagen

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│            React SPA + MSAL Auth                │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────┐
│                 BACKEND API                      │
│              ASP.NET Core 8.0                   │
├─────────────────────────────────────────────────┤
│  Controllers │ Services │ Validation │ Auth    │
└──────────────────────┬──────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐              ┌──────────────────┐
│ Azure SQL DB │              │ Microsoft Graph  │
│   (Data)     │              │  (M365 Sync)     │
└──────────────┘              └──────────────────┘
```

### Data Flow

1. Gebruiker authenticates via Microsoft Entra ID
2. Frontend krijgt JWT token
3. API valideert token en controleert autorisatie
4. Data wordt opgehaald/opgeslagen in Azure SQL
5. Sync haalt data op via Microsoft Graph API

---

## Configuratie

### App Registrations (Entra ID)

**Frontend App Registration:**
- **Naam**: Djoppie-Hive-Web
- **Client ID**: 2ea8a14d-ea05-40cc-af35-dd482bf8e235
- **Type**: SPA (Single Page Application)
- **Redirect URI's**:
  - `http://localhost:5173` (dev)
  - `https://swa-djoppie-hive-dev-ui.azurestaticapps.net` (prod)

**Backend App Registration:**
- **Naam**: Djoppie-Hive-API
- **Client ID**: 2b620e06-39ee-4177-a559-76a12a79320f
- **Scope**: `api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user`

### Backend appsettings.json

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "2b620e06-39ee-4177-a559-76a12a79320f",
    "ClientSecret": "<Key Vault Reference>",
    "Audience": "api://2b620e06-39ee-4177-a559-76a12a79320f"
  },
  "ConnectionStrings": {
    "DefaultConnection": "<Key Vault Reference>"
  }
}
```

### Frontend .env

```env
VITE_API_URL=https://app-djoppie-hive-dev-api.azurewebsites.net/api
VITE_ENTRA_CLIENT_ID=2ea8a14d-ea05-40cc-af35-dd482bf8e235
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=https://swa-djoppie-hive-dev-ui.azurestaticapps.net
VITE_ENTRA_API_SCOPE=api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user
```

---

## Rollenbeheer

### Beschikbare Rollen

| Rol | Technische naam | Permissies |
|-----|-----------------|------------|
| ICT Super Admin | `ict_super_admin` | Volledige toegang, rollenbeheer |
| HR Admin | `hr_admin` | Personeelsbeheer, audit logs |
| Sectormanager | `sectormanager` | Sector-scoped toegang |
| Diensthoofd | `diensthoofd` | Dienst-scoped toegang |
| Medewerker | `medewerker` | Eigen gegevens |

### Rol toewijzen via Entra ID

1. Ga naar Azure Portal > Microsoft Entra ID
2. Ga naar Enterprise Applications > Djoppie-Hive-API
3. Klik op Users and groups
4. Klik op Add user/group
5. Selecteer de gebruiker en de rol
6. Klik op Assign

### Rol toewijzen in Djoppie-Hive

Alleen ICT Super Admins kunnen rollen toewijzen:

1. Ga naar Instellingen > Rollenbeheer
2. Zoek de gebruiker
3. Kies de gewenste rol
4. Optioneel: kies scope (sector/dienst)
5. Klik op Opslaan

---

## Audit Logging

### Wat wordt gelogd?

Alle CRUD operaties op:
- Medewerkers
- Vrijwilligers
- Distributiegroepen
- Roltoewijzingen
- Synchronisaties

### Audit Log Velden

| Veld | Beschrijving |
|------|--------------|
| Timestamp | Datum/tijd van de actie |
| UserId | Object ID van de uitvoerder |
| UserEmail | E-mailadres van de uitvoerder |
| Action | Create, Read, Update, Delete |
| EntityType | Employee, DistributionGroup, etc. |
| EntityId | ID van het betreffende record |
| OldValues | Vorige waarden (JSON) |
| NewValues | Nieuwe waarden (JSON) |
| IpAddress | IP-adres van de client |

### Audit Logs bekijken

1. Ga naar Instellingen > Audit Logs
2. Filter op:
   - Datumbereik
   - Gebruiker
   - Actie type
   - Entity type
3. Exporteer indien nodig naar CSV

### Retentie

Audit logs worden 7 jaar bewaard (GDPR compliance).

---

## Synchronisatie

### Microsoft Graph Sync

De applicatie synchroniseert automatisch met Microsoft 365:

**Gesynchroniseerde data:**
- Gebruikers uit MG-distributiegroepen
- Groepslidmaatschappen
- Gebruikersprofielen en foto's

### Sync Schema

| Onderdeel | Frequentie | Methode |
|-----------|------------|---------|
| Volledige sync | Dagelijks 02:00 | Background job |
| Incrementele sync | Elk uur | Delta query |
| Handmatige sync | On-demand | API endpoint |

### Handmatige Sync starten

**Via UI:**
1. Klik op "Sync" in de header
2. Bevestig de actie
3. Wacht tot de sync voltooid is

**Via API:**
```bash
POST /api/sync
Authorization: Bearer <token>
```

### Sync Monitoring

Bekijk sync status via:
- Dashboard widget
- Sync Geschiedenis pagina
- Application Insights

---

## Beveiliging

### Authenticatie

- Microsoft Entra ID (OAuth 2.0 / OIDC)
- JWT tokens met validatie
- Token expiratie: 1 uur
- Refresh tokens: 24 uur

### Autorisatie

- Role-based access control (RBAC)
- Resource-based authorization voor scope checking
- Policy-based authorization patterns

### Security Headers

De API stuurt de volgende security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'none'
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting

| Endpoint | Limiet | Window |
|----------|--------|--------|
| Globaal | 100 requests | 1 minuut |
| /api/sync | 5 requests | 5 minuten |
| Auth endpoints | 10 requests | 1 minuut |

### CORS

Toegestane origins:
- `https://swa-djoppie-hive-dev-ui.azurestaticapps.net`
- `http://localhost:5173` (alleen development)

---

## Onderhoud

### Database Migraties

```bash
cd src/backend
dotnet ef database update \
  --project DjoppieHive.Infrastructure \
  --startup-project DjoppieHive.API
```

### Logs bekijken

**Application Insights:**
1. Open Azure Portal
2. Ga naar appi-djoppie-hive-dev
3. Bekijk Logs of Failures

**Log Analytics:**
```kusto
AppServiceHTTPLogs
| where TimeGenerated > ago(24h)
| where ScStatus >= 400
| project TimeGenerated, CsUriStem, ScStatus, CsHost
```

### Backup & Restore

Azure SQL Database heeft automatische backups:
- Point-in-time restore: 7 dagen
- Long-term retention: 35 dagen

---

## Troubleshooting

### Veelvoorkomende Problemen

**401 Unauthorized errors:**
- Controleer of de token niet verlopen is
- Verifieer de App Registration configuratie
- Check de audience in de token

**403 Forbidden errors:**
- Gebruiker heeft niet de juiste rol
- Scope enforcement blokkeert toegang
- Controleer UserRole toewijzingen in database

**Sync faalt:**
- Controleer Graph API permissies
- Verifieer client secret geldigheid
- Check rate limiting

**Database connectie faalt:**
- Controleer connection string
- Verifieer firewall rules
- Check service health

### Diagnostische Commando's

```bash
# Check API health
curl https://app-djoppie-hive-dev-api.azurewebsites.net/health

# Test Graph API
az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/groups?$filter=startswith(displayName,'MG-')"
```

---

## Azure Resources

### Resource Group: rg-djoppie-hive

| Resource | Naam | SKU |
|----------|------|-----|
| App Service Plan | plan-djoppie-hive-dev | F1 (Free) |
| App Service | app-djoppie-hive-dev-api | - |
| Static Web App | swa-djoppie-hive-dev-ui | Free |
| SQL Database | sqldb-djoppie-hive-dev | Serverless |
| Key Vault | kv-djoppie-hive-dev | Standard |
| App Insights | appi-djoppie-hive-dev | Free |

### Kosten (geschat)

| Resource | Maandelijkse kosten |
|----------|---------------------|
| App Service | Gratis (F1) |
| Static Web App | Gratis |
| SQL Database | ~5 EUR |
| Key Vault | ~0 EUR |
| App Insights | Gratis (5GB) |
| **Totaal** | **~6-10 EUR** |

### Deployment Pipeline

1. Push naar `main` branch
2. GitHub Actions/Azure DevOps trigger
3. Build & Test
4. Deploy naar Azure

---

## Contact

**Applicatie Eigenaar:**
- Naam: Jo Wijnen
- E-mail: jo.wijnen@diepenbeek.be

**Technisch Contact:**
- ICT Helpdesk: ict@diepenbeek.be

---

*Laatst bijgewerkt: Februari 2026*
