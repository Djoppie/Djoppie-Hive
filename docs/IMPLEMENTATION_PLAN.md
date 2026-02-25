# Djoppie-Hive - Implementatieplan naar 100% Productie

**Datum**: 2026-02-24
**Huidige Status**: ~80% compleet
**Doel**: Volledig productie-klaar systeem met security, rollen en GDPR compliance

---

## Overzicht Fases

| Fase | Prioriteit | Status | Geschatte Taken |
|------|------------|--------|-----------------|
| **Fase 1**: Rollen & Rechten | KRITIEK | VOLTOOID | 8 taken |
| **Fase 2**: Security Hardening | KRITIEK | VOLTOOID | 10 taken |
| **Fase 3**: Ontbrekende Features | HOOG | VOLTOOID | 6 taken |
| **Fase 4**: GDPR & Audit | HOOG | VOLTOOID | 5 taken |
| **Fase 5**: Testing & Documentatie | MEDIUM | Te doen | 6 taken |
| **Fase 6**: Deployment & Go-Live | MEDIUM | Te doen | 5 taken |

---

## Fase 1: Rollen & Rechten (Authorization)

**Verantwoordelijke Agents**: `backend-architect`, `frontend-architect`

### Backend Taken

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 1.1 | Role Claims configureren | `backend-architect` | App roles definiëren in Entra ID en claims mapping in JWT |
| 1.2 | Authorization Policies | `backend-architect` | Policies voor `HrAdmin`, `SectorManager`, `Diensthoofd`, `Medewerker` |
| 1.3 | Endpoint Authorization | `backend-architect` | `[Authorize(Policy = "...")]` op alle controllers |
| 1.4 | Scope-based filtering | `backend-architect` | Sectormanager ziet alleen eigen sector, diensthoofd alleen eigen dienst |
| 1.5 | Resource-based auth | `backend-architect` | IAuthorizationHandler voor employee/group ownership checks |

### Frontend Taken

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 1.6 | Role context provider | `frontend-architect` | React context voor huidige gebruiker rollen |
| 1.7 | Conditional UI rendering | `frontend-architect` | Knoppen/menu's verbergen op basis van rol |
| 1.8 | Rollen beheer pagina | `frontend-architect` | `/rollen` pagina voor ICT admin om rollen toe te kennen |

### Entra ID Configuratie

```
App Roles te definiëren in Djoppie-Hive-API:
- ict_super_admin: Volledige toegang
- hr_admin: HR beheer (alle medewerkers)
- sectormanager: Sector scope
- diensthoofd: Dienst scope
- medewerker: Alleen eigen gegevens
```

---

## Fase 2: Security Hardening

**Verantwoordelijke Agents**: `security-auditor`, `backend-architect`

### API Security

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 2.1 | Rate Limiting | `backend-architect` | AspNetCoreRateLimit package, 100 req/min per user |
| 2.2 | Input Validation | `backend-architect` | FluentValidation voor alle DTOs |
| 2.3 | SQL Injection preventie | `security-auditor` | Review alle queries (EF Core is al veilig) |
| 2.4 | XSS preventie | `security-auditor` | Output encoding verificatie |
| 2.5 | CORS hardening | `backend-architect` | Strict origins, geen wildcards in productie |

### Infrastructure Security

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 2.6 | Security Headers | `backend-architect` | CSP, X-Frame-Options, X-Content-Type-Options, HSTS |
| 2.7 | Key Vault secrets | `azure-deployment-architect` | Alle secrets naar Key Vault, geen appsettings.json |
| 2.8 | Managed Identity | `azure-deployment-architect` | App Service → Key Vault via Managed Identity |
| 2.9 | Network Security | `azure-deployment-architect` | Private endpoints waar mogelijk (budget afhankelijk) |
| 2.10 | Dependency scanning | `security-auditor` | npm audit + dotnet list package --vulnerable |

### Security Review Checklist

```
[ ] OWASP Top 10 verificatie
[ ] Authentication bypass test
[ ] Authorization bypass test
[ ] Sensitive data exposure check
[ ] Security misconfiguration audit
[ ] Component vulnerability scan
```

---

## Fase 3: Ontbrekende Features

**Verantwoordelijke Agents**: `frontend-architect`, `backend-architect`

### Pagina's Compleet Maken

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 3.1 | Rollen pagina | `frontend-architect` | Lijst gebruikers met rollen, toekennen/verwijderen |
| 3.2 | Rollen API | `backend-architect` | `GET/POST/DELETE /api/userroles` endpoints |
| 3.3 | AD Import pagina | `frontend-architect` | Preview van te importeren users, selectie, confirm |
| 3.4 | AD Import API | `backend-architect` | Bulk import endpoint met validatie |
| 3.5 | Uitnodigingen pagina | `frontend-architect` | Event management, deelnemerslijsten |
| 3.6 | Uitnodigingen API | `backend-architect` | Events CRUD + deelnemers koppeling |

---

## Fase 4: GDPR & Audit Compliance

**Verantwoordelijke Agents**: `security-auditor`, `backend-architect`

### Audit Logging

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 4.1 | AuditLog entiteit | `backend-architect` | UserId, Action, EntityType, EntityId, OldValues, NewValues, Timestamp |
| 4.2 | EF Core interceptor | `backend-architect` | Automatisch loggen van alle wijzigingen |
| 4.3 | Audit API | `backend-architect` | `GET /api/audit` met filters (datum, user, entity) |
| 4.4 | Audit UI | `frontend-architect` | Audit log viewer voor ICT admin |

### GDPR Features

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 4.5 | Data export | `backend-architect` | `GET /api/employees/{id}/export` - alle gegevens van persoon |
| 4.6 | Data retention | `backend-architect` | Automatische cleanup job voor oude gegevens |
| 4.7 | Privacy policy | `documentation-writer` | Privacy verklaring voor gebruikers |

---

## Fase 5: Testing & Documentatie

**Verantwoordelijke Agents**: `security-auditor`, `documentation-writer`

### Testing

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 5.1 | Unit tests backend | `backend-architect` | xUnit tests voor services en controllers |
| 5.2 | Integration tests | `backend-architect` | API tests met TestServer |
| 5.3 | Security tests | `security-auditor` | Penetration testing checklist |
| 5.4 | Frontend tests | `frontend-architect` | Vitest + React Testing Library |

### Documentatie

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 5.5 | Gebruikershandleiding | `documentation-writer` | Stap-voor-stap voor HR medewerkers |
| 5.6 | Admin handleiding | `documentation-writer` | ICT beheer, rollen, sync, troubleshooting |
| 5.7 | API documentatie | `backend-architect` | Swagger/OpenAPI met voorbeelden |

---

## Fase 6: Deployment & Go-Live

**Verantwoordelijke Agents**: `azure-deployment-architect`, `project-orchestrator`

### CI/CD Pipeline

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 6.1 | Azure DevOps pipeline | `azure-deployment-architect` | Build, test, deploy stages |
| 6.2 | Environment configs | `azure-deployment-architect` | DEV, ACC, PROD configuraties |
| 6.3 | Database migrations | `azure-deployment-architect` | EF migrations in pipeline |

### Go-Live

| # | Taak | Agent | Beschrijving |
|---|------|-------|--------------|
| 6.4 | Production deployment | `azure-deployment-architect` | Bicep deploy naar PROD resource group |
| 6.5 | Monitoring setup | `azure-deployment-architect` | Application Insights dashboards, alerts |
| 6.6 | Go-live checklist | `project-orchestrator` | Finale verificatie voor livegang |

---

## Taakverdeling per Agent

### `backend-architect` (18 taken)
```
Fase 1: 1.1, 1.2, 1.3, 1.4, 1.5
Fase 2: 2.1, 2.2, 2.5, 2.6
Fase 3: 3.2, 3.4, 3.6
Fase 4: 4.1, 4.2, 4.3, 4.5, 4.6
Fase 5: 5.1, 5.2, 5.7
```

### `frontend-architect` (8 taken)
```
Fase 1: 1.6, 1.7, 1.8
Fase 3: 3.1, 3.3, 3.5
Fase 4: 4.4
Fase 5: 5.4
```

### `security-auditor` (6 taken)
```
Fase 2: 2.3, 2.4, 2.10
Fase 4: (review alle GDPR implementaties)
Fase 5: 5.3
```

### `azure-deployment-architect` (6 taken)
```
Fase 2: 2.7, 2.8, 2.9
Fase 6: 6.1, 6.2, 6.3, 6.4, 6.5
```

### `documentation-writer` (3 taken)
```
Fase 4: 4.7
Fase 5: 5.5, 5.6
```

### `project-orchestrator` (1 taak)
```
Fase 6: 6.6
```

---

## Aanbevolen Volgorde van Uitvoering

```
Week 1-2:  Fase 1 (Rollen & Rechten) - KRITIEK
           Start met backend authorization, dan frontend

Week 3:    Fase 2 (Security Hardening) - KRITIEK
           Rate limiting, input validation, security headers

Week 4:    Fase 3 (Ontbrekende Features)
           Rollen pagina, AD Import

Week 5:    Fase 4 (GDPR & Audit)
           Audit logging, data export

Week 6:    Fase 5 (Testing & Documentatie)
           Tests schrijven, handleidingen

Week 7:    Fase 6 (Deployment)
           CI/CD, go-live
```

---

## Direct te Starten

### Prioriteit 1: Backend Authorization (Taak 1.1 - 1.5)

Start met `backend-architect` voor:
1. App Roles configureren in Entra ID
2. Authorization policies in ASP.NET Core
3. `[Authorize]` attributes op controllers
4. Scope-filtering (sector/dienst)

### Prioriteit 2: Security Headers (Taak 2.6)

Parallel kan `backend-architect` security headers toevoegen:
```csharp
app.UseSecurityHeaders(policies =>
    policies
        .AddContentSecurityPolicy(...)
        .AddStrictTransportSecurity(...)
        .AddXContentTypeOptionsNoSniff()
        .AddXFrameOptionsDeny()
);
```

---

## Voortgang Tracking

| Fase | Totaal | Voltooid | % |
|------|--------|----------|---|
| Fase 1 | 8 | 8 | 100% |
| Fase 2 | 10 | 10 | 100% |
| Fase 3 | 6 | 6 | 100% |
| Fase 4 | 5 | 5 | 100% |
| Fase 5 | 7 | 2 | 29% |
| Fase 6 | 6 | 3 | 50% |
| **Totaal** | **42** | **34** | **81%** |

### Fase 5 Details
- [x] 5.4 Frontend tests (Vitest + React Testing Library)
- [x] 5.7 API documentatie (Swagger/OpenAPI)
- [ ] 5.1 Unit tests backend
- [ ] 5.2 Integration tests
- [ ] 5.3 Security tests
- [ ] 5.5 Gebruikershandleiding
- [ ] 5.6 Admin handleiding

### Fase 6 Details
- [x] 6.1 Azure DevOps pipeline (CI/CD pipelines exist)
- [x] 6.3 Database migrations (EF migrations in CD pipeline)
- [x] 6.5 Monitoring setup (App Insights dashboards + alerts in Bicep)
- [ ] 6.2 Environment configs (ACC/PROD nog te doen)
- [ ] 6.4 Production deployment (PROD Bicep nog te doen)
- [ ] 6.6 Go-live checklist

---

*Laatst bijgewerkt: 2026-02-25*
