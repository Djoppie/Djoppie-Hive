# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Djoppie-Paparazzi** (HRadmin) is an HR administration system designed for IT-support and HR managers at Gemeente Diepenbeek. The system focuses on employee management, distribution groups, and HR workflows with deep integration into Microsoft 365.

### Core Features (Planned/In Progress)

- Employee directory and management
- Distribution group management (MG- groups via Microsoft Graph)
- HR workflow automation
- Microsoft Entra ID single sign-on
- Role-based access control for HR data
- GDPR-compliant data handling

## Technology Stack

### Frontend (Current)

- **React 19** with TypeScript
- **Vite 7** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **CSS Modules** - Component styling

### Frontend (Planned)

- **MSAL React** (@azure/msal-react) - Microsoft authentication
- **TanStack Query** - Server state management
- **Axios** - HTTP client

### Backend (Planned)

- **ASP.NET Core 8.0** - Web API framework
- **C# 12** - Programming language
- **Entity Framework Core** - ORM for database access
- **Microsoft.Identity.Web** - Entra ID authentication
- **Microsoft.Graph** - SDK for Microsoft 365 integration
- **Azure Key Vault** - Secret management

### Infrastructure

- **Azure App Service** (F1 Free) - Backend API hosting
- **Azure Static Web Apps** (Free) - Frontend hosting
- **Azure SQL Database** (Serverless) - Data storage
- **Azure Key Vault** - Secret management
- **Azure Application Insights** - Monitoring
- **Bicep** - Infrastructure as Code

## Project Structure

```
Djoppie-Paparazzi/
├── .claude/                    # Claude Code configuration
│   ├── agents/                 # Specialized agent definitions
│   │   ├── project-orchestrator.md
│   │   ├── documentation-writer.md
│   │   ├── azure-deployment-architect.md
│   │   ├── backend-architect.md
│   │   ├── frontend-architect.md
│   │   ├── security-auditor.md
│   │   └── ui-design-expert.md
│   └── settings.local.json     # Local settings
├── hr-personeel/               # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   ├── config/             # MSAL and app configuration
│   │   ├── utils/              # Helper functions
│   │   └── types/              # TypeScript type definitions
│   ├── .env.development        # Local dev environment
│   ├── .env.production         # Azure production environment
│   └── vite.config.ts
├── src/backend/ (planned)      # ASP.NET Core backend
│   ├── DjoppiePaparazzi.API/
│   ├── DjoppiePaparazzi.Core/
│   └── DjoppiePaparazzi.Infrastructure/
├── infra/ (planned)            # Infrastructure as Code
│   └── bicep/
├── .azuredevops/ (planned)     # Azure DevOps pipelines
├── docs/                       # Documentation
├── CLAUDE.md                   # This file
└── README.md                   # User documentation
```

## Microsoft Entra ID Configuration

### App Registrations

| App Name | Client ID | Purpose |
|----------|-----------|---------|
| Djoppie-Paparazzi-Web | acc348be-b533-4402-8041-672c1cba1273 | Frontend SPA |
| Djoppie-Paparazzi-API | 2b620e06-39ee-4177-a559-76a12a79320f | Backend API |

### Tenant Information

- **Tenant ID**: 7db28d6f-d542-40c1-b529-5e5ed2aad545
- **Domain**: diepenbeek.onmicrosoft.com

### Authentication Flow

1. User logs in via MSAL React → Redirects to Entra ID
2. After successful auth, receives JWT access token
3. Token includes scope: `api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user`
4. Frontend includes token in API requests via Axios interceptors
5. Backend validates token using Microsoft.Identity.Web
6. Backend uses service principal to call Microsoft Graph APIs

## Azure Resources

### Naming Convention

```
{resource-type}-djoppie-paparazzi-{environment}-{suffix}
```

### Resource Group

- **Name**: rg-djoppie-paparazzi
- **Location**: West Europe

### DEV Environment Resources

| Resource | Name | SKU | Est. Cost |
|----------|------|-----|-----------|
| App Service Plan | plan-djoppie-paparazzi-dev | F1 (Free) | €0 |
| App Service | app-djoppie-paparazzi-dev-api | - | €0 |
| Static Web App | swa-djoppie-paparazzi-dev-ui | Free | €0 |
| SQL Database | sqldb-djoppie-paparazzi-dev | Serverless | €4-6 |
| Key Vault | kv-djoppie-paparazzi-dev-{suffix} | Standard | ~€0 |
| App Insights | appi-djoppie-paparazzi-dev | Free (5GB) | €0 |
| Log Analytics | log-djoppie-paparazzi-dev | Free (5GB) | €0 |

**Total Estimated Monthly Cost: €6-10**

## Development Commands

### Frontend

All commands from the `hr-personeel` directory:

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Backend (when implemented)

All commands from the `src/backend` directory:

```bash
# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run API (http://localhost:5052)
cd DjoppiePaparazzi.API
dotnet run

# Run with watch mode
dotnet watch run

# Run tests
dotnet test
```

### Database Migrations (when implemented)

```bash
# Create new migration
dotnet ef migrations add <MigrationName> \
  --project DjoppiePaparazzi.Infrastructure \
  --startup-project DjoppiePaparazzi.API

# Apply migrations
dotnet ef database update \
  --project DjoppiePaparazzi.Infrastructure \
  --startup-project DjoppiePaparazzi.API
```

## Environment Configuration

### Local Development

**Frontend** (`hr-personeel/.env.development`):
```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=acc348be-b533-4402-8041-672c1cba1273
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user
```

### Azure DEV Environment

**Frontend** (`hr-personeel/.env.production`):
```env
VITE_API_URL=https://app-djoppie-paparazzi-dev-api.azurewebsites.net/api
VITE_ENTRA_CLIENT_ID=acc348be-b533-4402-8041-672c1cba1273
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=https://swa-djoppie-paparazzi-dev-ui.azurestaticapps.net
VITE_ENTRA_API_SCOPE=api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user
```

## Branding & Design

### Diepenbeek Color Palette

```css
/* Primary - Diepenbeek Orange */
--primary-main: #E65100;
--primary-light: #FF833A;
--primary-dark: #AC1900;

/* Neutral */
--background-light: #FAFAFA;
--background-dark: #121212;
--surface: #FFFFFF;
--text-primary: #212121;
--text-secondary: #757575;

/* Status */
--success: #4CAF50;
--warning: #FF9800;
--error: #F44336;
--info: #2196F3;
```

### Design Principles

1. **Professional**: Convey trust and security for HR data
2. **Clean**: Minimize visual clutter for efficient daily use
3. **Accessible**: WCAG 2.1 AA compliance
4. **Responsive**: Mobile-first approach
5. **Consistent**: Apply Diepenbeek branding throughout

## Security & Compliance

### GDPR Compliance

This system handles sensitive employee data. All development must consider:

- **Data Minimization**: Only collect necessary employee data
- **Purpose Limitation**: Use data only for stated HR purposes
- **Storage Limitation**: Implement data retention policies
- **Integrity & Confidentiality**: Encryption at rest and in transit
- **Accountability**: Comprehensive audit logging
- **Data Subject Rights**: Support access, rectification, erasure

### Security Best Practices

- Never commit secrets to source control
- Use Azure Key Vault for all secrets in production
- Use .NET User Secrets for local development
- Implement proper input validation on all endpoints
- Use parameterized queries (EF Core)
- Enable HTTPS only
- Configure proper CORS policies
- Log security events for audit purposes
- Never expose raw employee data without authorization

## Agent Team

This project uses specialized Claude agents for different tasks:

| Agent | Responsibility |
|-------|---------------|
| project-orchestrator | High-level coordination, architectural guidance, tracking |
| documentation-writer | Installation guides, user manuals, admin documentation |
| azure-deployment-architect | IaC, Azure resources, CI/CD pipelines |
| backend-architect | API design, database schema, Microsoft Graph integration |
| frontend-architect | React components, MSAL integration, UI patterns |
| security-auditor | Security review, GDPR compliance, vulnerability assessment |
| ui-design-expert | Visual design, branding, UX improvements |

## Deployment Flow

```
Local Development (develop branch)
        ↓
    Push to GitHub
        ↓
    Sync to Azure DevOps
        ↓
    CI/CD Pipeline
        ↓
    Azure Infrastructure (IaC)
        ↓
    Deploy to Azure DEV
```

## Business Domain: HR & Distribution Groups

### MG- Distribution Groups

The organization uses **MG- prefixed distribution groups** in Microsoft Entra ID as the source of truth for personnel management:

- **Naming Convention**: `MG-{GroupName}` (e.g., `MG-IT-Afdeling`, `MG-HR-Team`)
- **Purpose**: These mail-enabled distribution groups contain all persons managed in Active Directory
- **Sync**: Groups are synced from on-premises AD to Entra ID
- **HR Integration**: Djoppie-Paparazzi reads and manages membership of these groups

### Group Management Features

1. **View Groups**: List all MG- distribution groups with member counts
2. **View Members**: Display all members of a specific group
3. **Add/Remove Members**: Manage group membership (with proper authorization)
4. **Group Creation**: Create new MG- groups for departments/teams
5. **Audit Trail**: Log all membership changes for compliance

### Data Flow

```
On-Premises AD ←→ Azure AD Connect ←→ Microsoft Entra ID
                                              ↓
                                    Microsoft Graph API
                                              ↓
                                    Djoppie-Paparazzi API
                                              ↓
                                    HR Management Interface
```

### Group Properties

Key properties to display/manage for each MG- group:

| Property | Graph API Field | Description |
|----------|-----------------|-------------|
| Display Name | `displayName` | Group name (MG-prefix) |
| Description | `description` | Purpose of the group |
| Mail | `mail` | Email address for distribution |
| Members | `members` | List of group members |
| Owners | `owners` | Group administrators |
| Created | `createdDateTime` | When group was created |

## Key Implementation Notes

### Microsoft Graph API Permissions

Required permissions for MG- distribution group management:

- `Group.Read.All` - Read all groups (required)
- `Group.ReadWrite.All` - Manage group membership (required for full functionality)
- `User.Read.All` - Read user profiles and photos
- `Directory.Read.All` - Read directory data
- `GroupMember.ReadWrite.All` - Add/remove group members

### Graph API Endpoints

```
# List all groups starting with MG-
GET /groups?$filter=startswith(displayName,'MG-')

# Get group details
GET /groups/{group-id}

# Get group members
GET /groups/{group-id}/members

# Add member to group
POST /groups/{group-id}/members/$ref

# Remove member from group
DELETE /groups/{group-id}/members/{member-id}/$ref
```

### CORS Configuration

The backend must allow:
- `http://localhost:5173` (local development)
- `https://swa-djoppie-paparazzi-dev-ui.azurestaticapps.net` (Azure DEV)

## Repository Information

- **GitHub**: (to be configured)
- **Azure DevOps**: (to be configured)
- **Contact**: jo.wijnen@diepenbeek.be
- **Tenant**: Diepenbeek (7db28d6f-d542-40c1-b529-5e5ed2aad545)

## Related Projects

- **Djoppie-Inventory**: Asset and inventory management system (reference architecture)
  - Location: `C:\Djoppie\Djoppie-Inventory`
  - Similar deployment patterns and Azure configuration
