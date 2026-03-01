# Copilot Instructions for Djoppie-Hive

## Quick Start

**Frontend** (React + TypeScript + Vite):

```bash
cd hr-personeel
npm run dev       # Start at http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint check
npm run test      # Watch mode (vitest)
npm run test:run  # Single run
npm test -- filename.test.ts  # Single test file
```

**Backend** (ASP.NET Core 8.0, C#):

```bash
cd src/backend
dotnet restore                # Restore packages
dotnet build                  # Build solution
cd DjoppieHive.API
dotnet run                    # Start at http://localhost:5014
dotnet watch run              # Watch mode
dotnet test                   # Run tests
```

## Architecture Overview

### Project Structure

- **hr-personeel/** - Frontend (React 19 + TypeScript)
  - `src/components/` - Reusable UI components
  - `src/pages/` - Page-level components (Dashboard, PersoneelLijst, Validatie, etc.)
  - `src/services/` - API client layer
  - `src/auth/` - MSAL React authentication
  - `src/context/` - React context (UserRoleContext)
  - `src/utils/` - Helpers (employeeMapper, data transformations)
  - `src/types/` - TypeScript type definitions

- **src/backend/** - Backend API (ASP.NET Core)
  - `DjoppieHive.API/` - Web API entry point, Controllers
  - `DjoppieHive.Core/` - Domain models, business logic
  - `DjoppieHive.Infrastructure/` - Database access, external integrations (Microsoft Graph)
  - `DjoppieHive.Tests/` - Test suite

- **infra/bicep/** - Infrastructure as Code (Azure resources)

### High-Level Flow

1. User authenticates via MSAL React → Microsoft Entra ID (7db28d6f-d542-40c1-b529-5e5ed2aad545)
2. Frontend receives JWT token with scope: `api://2b620e06-39ee-4177-a559-76a12a79320f/access_as_user`
3. Frontend sends API requests with token header
4. Backend validates token with Microsoft.Identity.Web
5. Backend uses Microsoft Graph SDK to access M365 data (distribution groups, users)
6. Data flows through EF Core to SQL Database

### Authentication Details

- **Frontend Client ID**: 2ea8a14d-ea05-40cc-af35-dd482bf8e235
- **Backend API ID**: 2b620e06-39ee-4177-a559-76a12a79320f
- **Dev Frontend**: http://localhost:5173
- **Dev Backend**: http://localhost:5014/api
- **Prod Frontend**: https://swa-djoppie-hive-dev-ui.azurestaticapps.net
- **Prod Backend**: https://app-djoppie-hive-dev-api.azurewebsites.net/api

### Database

- SQL Server (Serverless) in Azure
- Entity Framework Core for ORM
- Migrations in `DjoppieHive.Infrastructure`
- Schema: Employees, ValidatieStatusHistory, Sectors, Rollen, etc.

### Key Features

- **Employee Directory** - Search, filter, sort, export CSV
- **Validation Workflow** - Sectie managers validate employee data
- **Distribution Groups** - Microsoft 365 group management (MG- prefix)
- **Azure AD Import** - Sync users from Entra ID or CSV
- **Role-Based Access** - HR, IT-support, Sectie managers
- **Audit Logging** - Track validation changes

## Code Conventions

### Frontend (React/TypeScript)

- **Styling**: CSS Modules (filename.module.css)
- **Icons**: Lucide React (`import { CheckCircle } from 'lucide-react'`)
- **Authentication**: MSAL React context, check `useAuth()` hook
- **API Calls**: Service layer in `src/services/api.ts` with typed endpoints
- **Data Mapping**: Employee↔Medewerker transformations in `src/utils/employeeMapper.ts`
- **Naming**: Components PascalCase, utilities camelCase, CSS classes kebab-case
- **Testing**: Vitest + React Testing Library, colocate tests with components (e.g., `Component.test.tsx`)

### Backend (ASP.NET Core)

- **Controllers**: RESTful endpoints, return ActionResult<T>
- **Validation**: FluentValidation attributes on DTOs
- **Authorization**: `[Authorize]` attributes, custom policies for roles
- **Rate Limiting**: Global 100 req/min per user, sync operations limited to 5 per 5min
- **Security**: Input validation, parameterized queries (EF Core), HTTPS enforced, CORS configured
- **Swagger**: Auto-generated from XML documentation (`<summary>` tags)
- **Exceptions**: Custom exception middleware in `Middleware/`

### Data Models (Frontend → Backend)

- **Medewerker** (Frontend) ↔ **Employee** (API contract)
- **PersoneelType** → `personeel | vrijwilliger | interim | extern`
- **ArbeidsRegime** → `fulltime | parttime | flex`
- **ValidatieStatus** → `niet_gevalideerd | geverifieerd | afgekeurd`

## Testing Patterns

### Frontend Tests

```typescript
// Vitest + React Testing Library
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('Component', () => {
  it('should render content', () => {
    render(<Component />);
    expect(screen.getByText(/text/i)).toBeInTheDocument();
  });
});
```

Run single test: `npm test -- BronIndicator.test.tsx`

### Backend Tests

```csharp
// xUnit or NUnit, use mock database
[Fact]
public async Task GetEmployees_ReturnsOkResult() {
    // Arrange
    var controller = new EmployeeController(mockService);
    // Act
    var result = await controller.GetEmployees();
    // Assert
    Assert.IsType<OkObjectResult>(result.Result);
}
```

Run tests: `dotnet test DjoppieHive.Tests`

## Environment Configuration

### Frontend

- **Development** (.env.development): Local API at http://localhost:5014
- **Production** (.env.production): Azure-hosted API
- Variables prefixed with `VITE_` are accessible in code

### Backend

- **Development** (appsettings.Development.json): Local SQL, test auth disabled
- **Production** (appsettings.json): Azure SQL, Key Vault secrets
- Connection strings from environment or Key Vault

### Required Environment Variables

```
VITE_API_URL=http://localhost:5014/api
VITE_ENTRA_CLIENT_ID=2ea8a14d-ea05-40cc-af35-dd482bf8e235
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
```

## Important Patterns & Gotchas

### Frontend

- **Authentication**: Always check `useAuth()` before accessing user roles
- **State Management**: Use React Context (UserRoleContext) for app-wide state; use `useState` for local state
- **API Calls**: All API calls must include auth token (handled by interceptors in api.ts)
- **Routing**: Pages are lazy-loaded via React Router; check routes in `App.tsx`
- **CSS Modules**: Import as `import styles from './Component.module.css'` then use `className={styles.containerClass}`

### Backend

- **DbContext**: Single AppDbContext, use `_context.SaveChangesAsync()` after mutations
- **Authorization**: Policies: `HR`, `ITSupport`, `SectieManager` - check `Authorization/Policies.cs`
- **Microsoft Graph**: Service principal auth (not user delegation); cache Graph client
- **Error Handling**: Return Problem() results with proper status codes; don't throw unhandled exceptions
- **Migrations**: Always create migrations before pushing to prod; test locally first

## Performance Notes

- **Frontend**: Vite provides fast HMR; no code-splitting config needed yet
- **Backend**: Rate limiting configured; sync operations are expensive (limited to 5/5min)
- **Database**: Use `.AsNoTracking()` for read-only queries; indexes on Employee.Email, ValidatieStatus

## Debugging Tips

- **Frontend**: Check browser DevTools → Application tab for tokens; Network tab for API calls
- **Backend**: Use `dotnet watch run` for fast recompilation; breakpoints work in VS Code with C# extension
- **Auth Issues**: Verify token scope in browser console (`sessionStorage` under MSAL); check Entra ID app permissions

## Azure Deployment

- **Frontend**: Azure Static Web Apps (auto-deploy on push to `main`)
- **Backend**: Azure App Service (F1 Free tier)
- **Database**: Azure SQL Database (Serverless)
- **Infrastructure**: Bicep templates in `infra/bicep/`
- **Naming**: `{resource-type}-djoppie-hive-{env}-{suffix}` (e.g., `app-djoppie-hive-dev-api`)

## Related Documentation

- See `CLAUDE.md` for project overview, tech stack details, and Entra ID configuration
- See `docs/` for API docs, guides, and implementation details
- See `.claude/agents/` for specialized agent configurations
