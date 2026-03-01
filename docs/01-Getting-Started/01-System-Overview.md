# System Overview - Djoppie-Hive

**Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Final

---

## What is Djoppie-Hive?

Djoppie-Hive is a comprehensive **HR Personnel Management System** for Gemeente Diepenbeek. It provides centralized management of:

- **Employee Directory** - Complete overview of all staff with searchable, filterable records
- **Volunteer Management** - Track and manage volunteers and external staff
- **Distribution Groups** - Manage Microsoft 365 distribution groups and organizational hierarchies
- **Synchronization** - Automatic and manual sync with Azure AD/Microsoft 365
- **Role-Based Access** - Granular permissions based on organizational roles
- **Audit & Compliance** - Full GDPR-compliant audit trail and data protection

---

## Key Features

### 🔍 **Employee Directory**
- Search, filter, and sort employees by name, email, department, role
- Export employee data to CSV/Excel
- View detailed employee information and organizational hierarchy
- Cloud sync indicator (Azure AD) vs. manually added employees

### 🤝 **Distribution Groups**
- View Microsoft 365 distribution groups (MG-groups)
- Hierarchical view of sectors and departments
- Group membership management
- Automatic sync from Azure AD

### ✅ **Validation Workflow**
- Review and approve changes from Azure AD
- Maintain data integrity and accuracy
- Audit trail of all approvals and changes
- Escalation workflow for complex decisions

### 📊 **Dashboard & Reporting**
- Key performance indicators (KPIs)
- Employee statistics and trends
- Sync history and status monitoring
- Real-time notifications

### 🔐 **Security & Compliance**
- Microsoft Entra ID authentication (SSO)
- Role-based access control (RBAC)
- Full audit logging (GDPR Article 15, 17, 18)
- Rate limiting and DDoS protection

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                  │
│          Azure Static Web Apps (SPA)                │
│  - Dashboard, Employee List, Distribution Groups   │
│  - Validation Workflow, Audit Logs                 │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────────┐
│              BACKEND API (ASP.NET Core)             │
│          Azure App Service (Web API)                │
│  - Controllers, Services, Validation               │
│  - Authorization, Rate Limiting                    │
└──────────────────────┬──────────────────────────────┘
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼─────────┐        ┌────────▼──────────┐
    │ Azure SQL DB │        │ Microsoft Graph   │
    │ (Data Store) │        │ API (M365 Sync)   │
    └──────────────┘        └───────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | User interface |
| **Frontend Build** | Vite 7 | Fast build and dev server |
| **Frontend Hosting** | Azure Static Web Apps | Global CDN hosting |
| **Backend** | ASP.NET Core 8.0 | REST API |
| **Backend Hosting** | Azure App Service | Scalable web hosting |
| **Database** | SQL Server (Serverless) | Data persistence |
| **Authentication** | Microsoft Entra ID (Azure AD) | Single sign-on |
| **Graph API** | Microsoft Graph SDK | Microsoft 365 integration |
| **Secrets** | Azure Key Vault | Secure credential storage |
| **Monitoring** | Application Insights | Performance monitoring |

---

## Key Concepts

### Azure AD Synchronization (Cloud ☁️)
Data synchronized from Microsoft Entra ID (Azure Active Directory):
- Employee information from MG-distribution groups
- Read-only in Djoppie-Hive (validated before integration)
- Automatic daily sync + on-demand sync

### Manual Data (User 👤)
Data entered directly into Djoppie-Hive:
- External consultants and volunteers (not in Azure AD)
- Fully editable and flexible
- No sync required

### Validation Process
All Azure AD changes require approval before integration:
1. Change detected in Azure AD
2. Validation request created
3. Manager reviews and approves/rejects
4. Change applied or rejected based on decision
5. Audit log entry recorded

### Role-Based Access
Five organizational roles with hierarchical permissions:
- **HR Admin** - Full system access
- **Sector Manager** - Sector-level access
- **Team Coach/Diensthoofd** - Department-level access
- **Employee** - Self-service access only
- **ICT Admin** - Technical management (future)

---

## Organizational Hierarchy

Gemeente Diepenbeek uses a two-level structure:

```
Gemeente Diepenbeek
    ↓
Sector (MG-SECTOR-{Name})
    ↓
Department/Service (MG-{DeptName})
    ↓
Employees
```

### Main Sectors

1. **Sector Organisatie** - Administration, permits, environment
2. **Sector Vrije Tijd** - Sports, culture, youth
3. **Sector Facility** - IT, facilities, logistics
4. **Sector Financiën** - Finance, taxes, procurement
5. **Sector Personeel & Organisatie** - HR, payroll, training

---

## Data Sources

### Primary Sources
- **Azure AD (Microsoft Entra ID)** - Authoritative source for employees
- **Microsoft 365** - Distribution groups and team memberships
- **Djoppie-Hive Database** - Local records and manual entries

### Sync Direction
- **Azure → Djoppie-Hive**: Validated read-only sync
- **Djoppie-Hive → Azure**: Not supported (Azure is authoritative)
- **Manual Data**: Managed entirely within Djoppie-Hive

---

## Access Points

### Frontend URLs
- **Development**: http://localhost:5173
- **Production**: https://swa-djoppie-hive-dev-ui.azurestaticapps.net

### API URLs
- **Development**: http://localhost:5014/api
- **Production**: https://app-djoppie-hive-dev-api.azurewebsites.net/api
- **Swagger/OpenAPI**: `/swagger` (development only)

---

## Key Statistics

| Metric | Value |
|--------|-------|
| **Frontend Performance** | < 2s load time |
| **API Response Time** | < 200ms average |
| **Uptime SLA** | 99.9% |
| **Data Retention** | 7 years (GDPR) |
| **Rate Limit** | 100 req/min per user |

---

## Compliance

- **GDPR** - Full compliance with data protection regulations
- **Audit Trail** - All changes logged with user, timestamp, IP
- **Data Export** - GDPR Article 15 (Right of Access) implemented
- **Data Deletion** - Soft delete with audit trail
- **Security** - Rate limiting, input validation, HTTPS enforcement

---

## Support & Contact

**Primary Contact**: ICT Diepenbeek  
**Email**: ict@diepenbeek.be  
**Application Owner**: Jo Wijnen

---

**Next Steps**:
- New users: See [Quick Start Guide](02-Quick-Start-Guide.md)
- Detailed info: See [User Roles](../02-User-Guide/01-User-Roles.md)
- Developers: See [API Documentation](../04-Developer-Guide/01-API-Documentation.md)
