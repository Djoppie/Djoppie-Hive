# Backend Cleanup Report

## Djoppie-Hive Backend Codebase Analysis

**Generated:** 2026-03-03
**Codebase:** .NET 8.0 Web API
**Architecture:** Clean Architecture (API / Core / Infrastructure)

---

## Executive Summary

The Djoppie-Hive backend is a well-structured .NET 8 Web API following Clean Architecture principles. The codebase is generally clean with proper separation of concerns. This report identifies several areas for improvement including dead code, potential issues, and consolidation opportunities.

### Quick Stats
- **Controllers:** 16
- **Services:** 16
- **Entities:** 17
- **DTOs:** 17 files
- **Migrations:** 12
- **Test Files:** 11

---

## 1. Critical Issues

### 1.1 Missing Service Registration for ILicenseService (HIGH)

**Location:** `DjoppieHive.Infrastructure/DependencyInjection.cs:81`

**Issue:** `ILicenseService` is only registered when `GraphServiceClient` is available, but `LicensesController` always requires it. This will cause runtime exceptions in development mode without Graph credentials.

**Impact:** Application crash when accessing license endpoints without Graph configuration.

**Recommendation:** Create a `StubLicenseService` for non-Graph scenarios:

```csharp
// In DependencyInjection.cs, add to else block:
services.AddScoped<ILicenseService, StubLicenseService>();
```

Or mark the controller to be excluded when Graph is not available.

---

## 2. Deprecated Code

### 2.1 Deprecated Methods in EmployeeService

**Location:** `DjoppieHive.Infrastructure/Services/EmployeeService.cs:32-38`

**Methods:**
- `GetAllEmployeesAsync()` - Logs warning, recommends using `GetAllAsync()` with filters
- `GetEmployeeByIdAsync(string)` - Logs warning, recommends using `GetByIdAsync(Guid)`

**Impact:** Low - Methods still work but log warnings.

**Recommendation:**
1. Mark methods with `[Obsolete]` attribute for compile-time warnings
2. Update any remaining callers (likely in `GraphEmployeeService` or sync operations)
3. Schedule removal in next major version

---

## 3. Dead Code / Stub Implementations

### 3.1 GraphEmployeeService NotImplementedException Methods

**Location:** `DjoppieHive.Infrastructure/Services/GraphEmployeeService.cs:211-260`

**Issue:** 10 methods throw `NotImplementedException`. This class implements `IEmployeeService` but is only used for sync operations, not as the primary service.

**Methods affected:**
- `GetAllAsync`
- `GetByIdAsync`
- `CreateAsync`
- `UpdateAsync`
- `DeleteAsync`
- `UpdateValidatieStatusAsync`
- `GetByDienstAsync`
- `GetVolunteersAsync`
- `ExportPersonalDataAsync`
- `GetValidatieAantalAsync`

**Recommendation:**
1. Consider splitting `IEmployeeService` interface into:
   - `IEmployeeQueryService` - Read operations (both implementations)
   - `IEmployeeCrudService` - CRUD operations (only EmployeeService)
2. Or create a separate `IGraphEmployeeSyncService` interface for sync-only operations

### 3.2 IMPLEMENTATION_SUMMARY.md

**Location:** `src/backend/IMPLEMENTATION_SUMMARY.md`

**Issue:** Development documentation file committed to repository.

**Recommendation:** Move to `docs/` folder or remove if outdated. Consider using ADRs (Architecture Decision Records) instead.

---

## 4. Artifacts to Remove

### 4.1 Build Artifacts in Repository

**Location:** `src/backend/`

| File/Folder | Size | Action |
|-------------|------|--------|
| `deploy.zip` | 30 MB | Remove - CI/CD artifact |
| `publish/` | Directory | Remove - Build output |

**Recommendation:** Add to `.gitignore`:
```
src/backend/deploy.zip
src/backend/publish/
```

### 4.2 Duplicate Configuration Files

**Locations:**
- `src/backend/DjoppieHive.API/appsettings.Development.json`
- `src/backend/DjoppieHive.API/bin/Debug/net8.0/appsettings.Development.json`
- `src/backend/DjoppieHive.API/bin/Release/net8.0/appsettings.Development.json`
- `src/backend/DjoppieHive.Tests/bin/Debug/net8.0/appsettings.Development.json`
- `src/backend/publish/appsettings.Development.json`

**Impact:** None (these are build outputs).

**Recommendation:** Ensure `bin/` and `publish/` are in `.gitignore`.

---

## 5. Code Duplication Opportunities

### 5.1 User Context Extraction Pattern

**Pattern found in multiple controllers:**
```csharp
var currentUser = User.Identity?.Name ?? User.Claims
    .FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? "Onbekend";
```

**Locations:**
- `EventsController.cs:98, 225`
- `UserRolesController.cs:83, 115, 148`
- `SyncController.cs:89`
- `ValidatieVerzoekenController.cs:80`
- `OnboardingProcessesController.cs:130, 156, 183, 210`
- `OnboardingTasksController.cs:87, 114, 141, 174`
- `OnboardingTemplatesController.cs:73, 101, 127`
- `JobTitleRoleMappingsController.cs:255`

**Recommendation:** This is already abstracted in `IUserContextService.GetCurrentUserEmail()` and `GetCurrentUserName()`. Update these controllers to use the existing service consistently:
```csharp
var currentUser = _userContext.GetCurrentUserName() ?? _userContext.GetCurrentUserEmail() ?? "Unknown";
```

### 5.2 Find User Claim Pattern

**Pattern found in Onboarding controllers:**
```csharp
var userEmail = User.FindFirst("preferred_username")?.Value
    ?? User.FindFirst("email")?.Value
    ?? "unknown";
```

**Recommendation:** Same as above - use `IUserContextService`.

---

## 6. Unused Dependencies Check

### 6.1 NuGet Packages Analysis

**DjoppieHive.API.csproj:**
All packages appear to be in use.

**DjoppieHive.Core.csproj:**
Minimal - no external dependencies (by design for Clean Architecture).

**DjoppieHive.Infrastructure.csproj:**
All packages appear to be in use.

**DjoppieHive.Tests.csproj:**
All packages appear to be in use.

---

## 7. Database Model Review

### 7.1 All Entities in Use

All entities in `DjoppieHive.Core/Entities/` are:
- Registered in `ApplicationDbContext`
- Have corresponding migrations
- Are used by services

**Entities:**
1. `Employee` - Core entity
2. `DistributionGroup` - Organization structure
3. `EmployeeGroupMembership` - Many-to-many
4. `SyncLogboek` - Sync history
5. `ValidatieVerzoek` - Validation workflow
6. `VrijwilligerDetails` - Volunteer extension
7. `UserRole` - Authorization
8. `Event` - Events/invitations
9. `EventParticipant` - Event participants
10. `AuditLog` - Audit trail
11. `DynamicGroup` - Hybrid groups
12. `LocalGroup` - Hybrid groups
13. `LocalGroupMember` - Hybrid groups membership
14. `JobTitleRoleMapping` - Auto role assignment
15. `OnboardingProcess` - Onboarding workflow
16. `OnboardingTask` - Onboarding tasks
17. `OnboardingTemplate` - Onboarding templates

### 7.2 Migration Health

All migrations are sequential and properly chained. No orphaned migrations found.

---

## 8. API Endpoint Analysis

### 8.1 Potentially Redundant Endpoints

**VrijwilligersController duplicates EmployeesController functionality:**

| VrijwilligersController | EmployeesController Equivalent |
|-------------------------|-------------------------------|
| `GET /api/vrijwilligers` | `GET /api/employees?type=Vrijwilliger` |
| `GET /api/vrijwilligers/{id}` | `GET /api/employees/{id}` + type check |
| `GET /api/vrijwilligers/dienst/{dienstId}` | `GET /api/employees?type=Vrijwilliger&dienstId={id}` |
| `GET /api/vrijwilligers/search` | `GET /api/employees/search` + type filter |

**Recommendation:** Keep `VrijwilligersController` for semantic API design and specialized volunteer operations like `PUT /{id}/details`. Consider documenting this as intentional duplication for API clarity.

### 8.2 Development-Only Endpoints

**SyncController:**
- `POST /api/sync/dev/uitvoeren` - AllowAnonymous, hidden from Swagger
- `GET /api/sync/dev/preview` - AllowAnonymous, hidden from Swagger

These are properly protected with `_environment.IsDevelopment()` check. Consider using conditional compilation or separate dev controller.

---

## 9. Test Coverage Gaps

### 9.1 Missing Tests

| Module | Has Tests | Coverage |
|--------|-----------|----------|
| EmployeesController | Yes | Partial |
| EmployeeService | Yes | Partial |
| AuditController | Yes (Integration) | Basic |
| AuditService | Yes | Basic |
| OnboardingController | No | None |
| OnboardingService | No | None |
| UnifiedGroupsController | No | None |
| LicensesController | No | None |
| EventsController | No | None |
| ValidatieVerzoekenController | No | None |
| JobTitleRoleMappingsController | No | None |

**Priority for test coverage:**
1. OnboardingService (complex business logic)
2. UnifiedGroupService (multiple group sources)
3. JobTitleRoleMappingService (auto-assignment logic)

---

## 10. Recommended Actions

### Immediate (High Priority)

1. **Create StubLicenseService** - Prevent runtime crashes in dev mode
2. **Remove deploy.zip from repository** - 30MB artifact
3. **Remove publish/ folder from repository** - Build output

### Short-term (Medium Priority)

4. **Update controllers to use IUserContextService consistently**
5. **Mark deprecated methods with [Obsolete] attribute**
6. **Move IMPLEMENTATION_SUMMARY.md to docs/ folder**
7. **Update .gitignore** for build artifacts

### Long-term (Low Priority)

8. **Refactor IEmployeeService interface** - Split read/write concerns
9. **Add missing unit tests** - Prioritize OnboardingService
10. **Consider removing VrijwilligersController** if API simplification is desired

---

## 11. Cleanup Commands

```bash
# Remove build artifacts from git tracking
git rm --cached src/backend/deploy.zip
git rm -r --cached src/backend/publish/

# Add to .gitignore
echo "src/backend/deploy.zip" >> .gitignore
echo "src/backend/publish/" >> .gitignore

# Move implementation summary
mv src/backend/IMPLEMENTATION_SUMMARY.md docs/archive/

# Commit cleanup
git add .
git commit -m "chore: Clean up build artifacts and reorganize documentation"
```

---

## Appendix: File Inventory

### Source Files (excluding bin/obj)
- **API Layer:** 29 files
- **Core Layer:** 37 files
- **Infrastructure Layer:** 40 files
- **Tests:** 11 files

**Total:** 117 source files

### Migrations: 12 (all valid)
