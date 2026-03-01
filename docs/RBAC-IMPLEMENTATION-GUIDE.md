# RBAC Implementation Guide - Djoppie-Hive

## Quick Reference: Role-to-Permission Mapping

### System Admin (Full Control)
```
✓ View all employees (system-wide)
✓ Create new employees
✓ Edit any employee record
✓ Delete employees
✓ Manage all distribution groups
✓ Manage user roles/permissions
✓ View audit logs
✓ Access all reports
✓ System configuration
```

**API Usage:**
```csharp
[Authorize(Roles = "SystemAdmin")]
public async Task<IActionResult> GetAllEmployees() { }
```

---

### HR Manager (Department Management)
```
✓ View employees (own department + reports)
✓ Create new employees (own department)
✓ Edit employees (own department)
✗ Delete employees
✓ Manage distribution groups (own department)
✓ Approve workflows
✓ View department reports
```

**API Usage:**
```csharp
[Authorize(Roles = "HR.Manager")]
[DepartmentFilter]  // Custom policy
public async Task<IActionResult> GetEmployees() { }
```

---

### HR Coordinator (Data Management)
```
✓ View employees (assigned department)
✓ Create new employees (assigned department)
✓ Edit employees (assigned department)
✗ Delete employees
✓ Sync distribution groups
✓ Bulk import data
```

**API Usage:**
```csharp
[Authorize(Roles = "HR.Coordinator")]
[DepartmentFilter]
public async Task<IActionResult> UpdateEmployee(Guid id, UpdateEmployeeDto dto) { }
```

---

### HR Specialist (Limited Edit)
```
✓ View employees (assigned department)
✗ Create employees
✓ Edit specific fields only
✗ Delete employees
✗ Manage groups
✓ View limited reports
```

**API Usage:**
```csharp
[Authorize(Roles = "HR.Specialist")]
[FieldLevelSecurity("Phone,Email,Address")]
public async Task<IActionResult> UpdateEmployeeContact(Guid id, UpdateContactDto dto) { }
```

---

### Viewer (Read-Only)
```
✓ View employees (assigned department, limited fields)
✗ Create
✗ Edit
✗ Delete
✗ Manage groups
✓ View reports
```

**API Usage:**
```csharp
[Authorize(Roles = "Viewer")]
[ReadOnlyPolicy]
public async Task<IActionResult> GetEmployee(Guid id) { }
```

---

### Self-Service User (Own Data Only)
```
✓ View own profile
✓ Edit own profile (limited fields)
✗ View others
✗ Create/Edit/Delete others
```

**API Usage:**
```csharp
[Authorize]
[SelfServicePolicy]  // Can only access own data
public async Task<IActionResult> GetMyProfile() { }
```

---

## Implementation Checklist

### Phase 1: Database Schema & Models

- [ ] Create `Users` table
  - [ ] ObjectId (Entra ID mapping)
  - [ ] Email, Name, Department
  - [ ] IsActive flag

- [ ] Create `Roles` table
  - [ ] RoleId, Name (e.g., "HR.Manager")
  - [ ] Description

- [ ] Create `UserRoles` join table
  - [ ] UserId FK, RoleId FK
  - [ ] AssignedAt, AssignedBy

- [ ] Create `Permissions` table
  - [ ] Resource (e.g., "Employee", "Group")
  - [ ] Action (e.g., "Create", "Edit", "Delete")

- [ ] Create `RolePermissions` join table
  - [ ] RoleId FK, PermissionId FK

- [ ] Create `Groups` table
  - [ ] GroupId, DisplayName, ExternalId
  - [ ] GroupType (Security/Distribution)
  - [ ] SyncedAt

- [ ] Create `GroupMembers` join table
  - [ ] GroupId FK, UserId FK, MemberRole

- [ ] Create `AuditLogs` table
  - [ ] UserId, Action, ResourceType, ResourceId
  - [ ] OldValues, NewValues (JSON)
  - [ ] Timestamp, IpAddress

### Phase 2: Entity Framework Configuration

- [ ] Define entities in DbContext
  - [ ] User, Role, Permission, Group, AuditLog classes
  - [ ] Navigation properties
  - [ ] Relationships (one-to-many, many-to-many)

- [ ] Create initial migration
  - [ ] `dotnet ef migrations add InitialRbacSchema`

- [ ] Seed initial roles
  ```sql
  INSERT INTO Roles VALUES 
    ('SystemAdmin', 'System Administrator'),
    ('HR.Manager', 'HR Manager'),
    ('HR.Coordinator', 'HR Coordinator'),
    ('HR.Specialist', 'HR Specialist'),
    ('Viewer', 'Viewer'),
    ('User', 'Self-Service User')
  ```

- [ ] Seed permissions
  ```sql
  INSERT INTO Permissions VALUES
    ('Employee', 'View'),
    ('Employee', 'Create'),
    ('Employee', 'Edit'),
    ('Employee', 'Delete'),
    ('Group', 'Manage')
  ```

### Phase 3: Authentication Middleware (Startup)

- [ ] Configure MSAL in `Startup.cs`
  ```csharp
  services.AddMicrosoftIdentityWebApiAuthentication(Configuration);
  ```

- [ ] Configure token validation
  ```csharp
  services.Configure<JwtBearerOptions>(
    JwtBearerDefaults.AuthenticationScheme,
    options =>
    {
        options.TokenValidationParameters.NameClaimType = "preferred_username";
        options.TokenValidationParameters.RoleClaimType = "roles";
    }
  );
  ```

- [ ] Add authorization policies
  ```csharp
  services.AddAuthorization(options =>
  {
      options.AddPolicy("HR.Manager", policy =>
          policy.RequireRole("HR.Manager", "SystemAdmin"));
      
      options.AddPolicy("DepartmentAccess", policy =>
          policy.Requirements.Add(new DepartmentAccessRequirement()));
  });
  ```

### Phase 4: Custom Authorization Policies

- [ ] Create `DepartmentAccessRequirement`
  - [ ] Validates user's department access
  - [ ] Implements `IAuthorizationRequirement`

- [ ] Create `DepartmentAccessHandler`
  - [ ] Checks if user can access resource's department
  - [ ] Implements `AuthorizationHandler<DepartmentAccessRequirement>`

- [ ] Create `FieldLevelSecurityHandler`
  - [ ] Allows editing only specific fields
  - [ ] Validates UpdateDto against allowed fields

- [ ] Create `SelfServiceHandler`
  - [ ] Ensures user can only access their own data
  - [ ] Validates UserId in token matches resource owner

### Phase 5: Middleware & Logging

- [ ] Create `AuditLoggingMiddleware`
  - [ ] Captures request details (IP, User, Path)
  - [ ] Logs response status and duration
  - [ ] Records data changes (for write operations)

- [ ] Create `ErrorHandlingMiddleware`
  - [ ] Catches exceptions
  - [ ] Returns appropriate HTTP status codes
  - [ ] Logs errors securely (no PII in logs)

- [ ] Implement audit logging in service layer
  ```csharp
  await _auditService.LogAsync(new AuditLog
  {
      UserId = userId,
      Action = "Update",
      ResourceType = "Employee",
      ResourceId = employeeId,
      OldValues = JsonConvert.SerializeObject(oldEmployee),
      NewValues = JsonConvert.SerializeObject(newEmployee),
      Timestamp = DateTime.UtcNow
  });
  ```

### Phase 6: API Endpoints with Authorization

- [ ] Implement GET /api/employees
  - [ ] Apply `[Authorize(Roles = "HR.Manager,HR.Coordinator")]`
  - [ ] Apply `[DepartmentFilter]` policy
  - [ ] Filter results by department

- [ ] Implement POST /api/employees
  - [ ] Apply `[Authorize(Roles = "HR.Manager,HR.Coordinator")]`
  - [ ] Validate user can create in that department
  - [ ] Audit log creation

- [ ] Implement PUT /api/employees/{id}
  - [ ] Apply `[Authorize(Roles = "HR.Manager,HR.Coordinator")]`
  - [ ] Apply field-level security checks
  - [ ] Audit log before/after values

- [ ] Implement DELETE /api/employees/{id}
  - [ ] Apply `[Authorize(Roles = "SystemAdmin")]`
  - [ ] Require approval workflow
  - [ ] Soft delete (set IsDeleted = true)

- [ ] Implement GET /api/me (current user)
  - [ ] Apply `[Authorize]`
  - [ ] Return authenticated user's profile
  - [ ] Load user roles and groups

### Phase 7: Group Synchronization Service

- [ ] Create `GroupSyncService`
  - [ ] Fetches distribution groups from Microsoft Graph
  - [ ] Stores in local database
  - [ ] Handles pagination

- [ ] Implement scheduled job
  - [ ] Runs daily at off-peak time
  - [ ] Uses `IHostedService` or Azure Functions
  - [ ] Logs sync results

- [ ] Implement Graph API client
  ```csharp
  var groups = await _graphClient.Groups
      .Request()
      .Filter("startswith(displayName, 'MG-')")
      .GetAsync();
  ```

### Phase 8: Frontend Integration (React + MSAL)

- [ ] Configure MSAL in React
  ```typescript
  const msalConfig = {
      auth: {
          clientId: "2ea8a14d-ea05-40cc-af35-dd482bf8e235",
          authority: "https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545",
          redirectUri: window.location.origin
      },
      cache: { cacheLocation: "localStorage" }
  };
  ```

- [ ] Setup Axios interceptor
  ```typescript
  axiosInstance.interceptors.request.use(async (config) => {
      const token = await acquireToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
  });
  ```

- [ ] Implement role-based route guards
  ```typescript
  <ProtectedRoute 
    path="/employees" 
    requiredRoles={["HR.Manager", "HR.Coordinator"]}
  />
  ```

- [ ] Create hook for role checking
  ```typescript
  const useRole = (requiredRoles: string[]) => {
      const { roles } = useContext(AuthContext);
      return requiredRoles.some(r => roles.includes(r));
  };
  ```

### Phase 9: Testing

- [ ] Unit tests for authorization handlers
  - [ ] Test `DepartmentAccessHandler` with same/different dept
  - [ ] Test `SelfServiceHandler` with own/other data

- [ ] Integration tests for endpoints
  - [ ] Test with different roles
  - [ ] Test with valid/invalid tokens
  - [ ] Test department filtering

- [ ] API tests with Postman/Thunder Client
  - [ ] Valid role/permission → 200
  - [ ] Missing role → 403
  - [ ] Expired token → 401
  - [ ] Department mismatch → 404

### Phase 10: Security Hardening

- [ ] Enable HTTPS for all endpoints
- [ ] Configure CORS policy
  ```csharp
  services.AddCors(options =>
  {
      options.AddPolicy("AllowFrontend", builder =>
          builder.WithOrigins("https://djoppie-hive-dev.azurestaticapps.net")
                 .AllowAnyMethod()
                 .AllowAnyHeader()
                 .AllowCredentials());
  });
  ```

- [ ] Add security headers middleware
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Strict-Transport-Security (HSTS)

- [ ] Implement rate limiting
  ```csharp
  services.AddRateLimiter(options =>
  {
      options.AddFixedWindowLimiter("default", opt =>
          opt.PermitLimit = 100
             .Window = TimeSpan.FromMinutes(1));
  });
  ```

- [ ] Configure Azure Key Vault
  - [ ] Store connection strings
  - [ ] Store JWT signing keys
  - [ ] Store Graph API credentials

---

## Code Examples

### Example 1: Custom Authorization Policy

```csharp
// Authorization/DepartmentAccessRequirement.cs
public class DepartmentAccessRequirement : IAuthorizationRequirement { }

// Authorization/DepartmentAccessHandler.cs
public class DepartmentAccessHandler : 
    AuthorizationHandler<DepartmentAccessRequirement>
{
    private readonly IUserService _userService;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        DepartmentAccessRequirement requirement)
    {
        var userId = context.User.FindFirst("oid")?.Value;
        var resourceDepartment = context.Resource as string;

        if (string.IsNullOrEmpty(userId))
        {
            context.Fail();
            return;
        }

        var user = await _userService.GetUserByObjectIdAsync(userId);
        
        if (user?.Department == resourceDepartment || user?.IsSystemAdmin)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }
    }
}
```

### Example 2: API Controller with Authorization

```csharp
// Controllers/EmployeesController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IAuditService _auditService;

    [HttpGet]
    [Authorize(Roles = "HR.Manager,HR.Coordinator,HR.Specialist,Viewer")]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees(
        [FromQuery] string department = null)
    {
        var userId = User.FindFirst("oid")?.Value;
        var userDepartment = User.FindFirst("department")?.Value;
        
        var employees = await _employeeService
            .GetEmployeesByDepartmentAsync(userDepartment);
        
        await _auditService.LogAccessAsync(userId, "View", "Employee", null);
        
        return Ok(employees);
    }

    [HttpPost]
    [Authorize(Roles = "HR.Manager,HR.Coordinator")]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee(
        CreateEmployeeDto dto)
    {
        var userId = User.FindFirst("oid")?.Value;
        
        var employee = await _employeeService.CreateEmployeeAsync(dto);
        
        await _auditService.LogAsync(new AuditLog
        {
            UserId = Guid.Parse(userId),
            Action = "Create",
            ResourceType = "Employee",
            ResourceId = employee.Id,
            NewValues = JsonConvert.SerializeObject(employee),
            Timestamp = DateTime.UtcNow
        });
        
        return CreatedAtAction(nameof(GetEmployee), 
            new { id = employee.Id }, employee);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "HR.Manager,HR.Coordinator,HR.Specialist,Viewer")]
    public async Task<ActionResult<EmployeeDto>> GetEmployee(Guid id)
    {
        var userId = User.FindFirst("oid")?.Value;
        var userDepartment = User.FindFirst("department")?.Value;
        
        var employee = await _employeeService.GetEmployeeAsync(id);
        
        // Row-level security: ensure user can access this employee
        if (employee.Department != userDepartment && 
            !User.IsInRole("SystemAdmin"))
        {
            return NotFound(); // Hide the fact resource exists
        }
        
        return Ok(employee);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "HR.Manager,HR.Coordinator")]
    public async Task<IActionResult> UpdateEmployee(
        Guid id, UpdateEmployeeDto dto)
    {
        var userId = User.FindFirst("oid")?.Value;
        var user = await _userService.GetUserByObjectIdAsync(userId);
        var existingEmployee = await _employeeService.GetEmployeeAsync(id);
        
        // RLS check
        if (existingEmployee.Department != user.Department && !user.IsSystemAdmin)
            return Forbid();
        
        // Field-level security: HR.Specialist can only edit certain fields
        if (user.Roles.Contains("HR.Specialist"))
        {
            var allowedFields = new[] { "Phone", "Email", "Address" };
            ValidateUpdateDto(dto, allowedFields);
        }
        
        var oldValues = JsonConvert.SerializeObject(existingEmployee);
        var updatedEmployee = await _employeeService
            .UpdateEmployeeAsync(id, dto);
        
        await _auditService.LogAsync(new AuditLog
        {
            UserId = Guid.Parse(userId),
            Action = "Update",
            ResourceType = "Employee",
            ResourceId = id,
            OldValues = oldValues,
            NewValues = JsonConvert.SerializeObject(updatedEmployee),
            Timestamp = DateTime.UtcNow
        });
        
        return Ok(updatedEmployee);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SystemAdmin")]
    public async Task<IActionResult> DeleteEmployee(Guid id)
    {
        var userId = User.FindFirst("oid")?.Value;
        var employee = await _employeeService.GetEmployeeAsync(id);
        
        await _employeeService.SoftDeleteEmployeeAsync(id);
        
        await _auditService.LogAsync(new AuditLog
        {
            UserId = Guid.Parse(userId),
            Action = "Delete",
            ResourceType = "Employee",
            ResourceId = id,
            OldValues = JsonConvert.SerializeObject(employee),
            Timestamp = DateTime.UtcNow
        });
        
        return NoContent();
    }
}
```

### Example 3: Frontend Role-Based Route

```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
    path: string;
    requiredRoles: string[];
    component: React.ComponentType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    path,
    requiredRoles,
    component: Component
}) => {
    const { user } = useMsal();
    const [userRoles, setUserRoles] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            // Load user roles from API or token
            fetchUserRoles(user.localAccountId).then(setUserRoles);
        }
    }, [user]);

    const hasAccess = requiredRoles.some(role => 
        userRoles.includes(role)
    );

    return (
        <Route
            path={path}
            element={
                hasAccess ? (
                    <Component />
                ) : (
                    <AccessDenied />
                )
            }
        />
    );
};

// usage
<ProtectedRoute
    path="/employees"
    requiredRoles={["HR.Manager", "HR.Coordinator"]}
    component={EmployeeList}
/>
```

---

## Testing Examples

### Unit Test: Authorization Handler

```csharp
[TestClass]
public class DepartmentAccessHandlerTests
{
    [TestMethod]
    public async Task HandleAsync_SameDepartment_Succeeds()
    {
        // Arrange
        var handler = new DepartmentAccessHandler(mockUserService);
        var context = new AuthorizationHandlerContext(
            new[] { new DepartmentAccessRequirement() },
            CreateClaimsPrincipal("user-id"),
            "HR"
        );

        mockUserService
            .Setup(x => x.GetUserByObjectIdAsync("user-id"))
            .ReturnsAsync(new User { Department = "HR" });

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.IsTrue(context.HasSucceeded);
    }

    [TestMethod]
    public async Task HandleAsync_DifferentDepartment_Fails()
    {
        // Arrange
        var handler = new DepartmentAccessHandler(mockUserService);
        var context = new AuthorizationHandlerContext(
            new[] { new DepartmentAccessRequirement() },
            CreateClaimsPrincipal("user-id"),
            "Finance"  // Trying to access Finance, but user is in HR
        );

        mockUserService
            .Setup(x => x.GetUserByObjectIdAsync("user-id"))
            .ReturnsAsync(new User { Department = "HR" });

        // Act
        await handler.HandleAsync(context);

        // Assert
        Assert.IsFalse(context.HasSucceeded);
    }

    private ClaimsPrincipal CreateClaimsPrincipal(string userId)
    {
        var claims = new[]
        {
            new Claim("oid", userId),
            new Claim("preferred_username", $"{userId}@diepenbeek.onmicrosoft.com")
        };
        return new ClaimsPrincipal(new ClaimsIdentity(claims));
    }
}
```

---

## Migration Path

1. **Week 1**: Database schema + Entity Framework migrations
2. **Week 2**: Authentication middleware + token validation
3. **Week 3**: Authorization policies + custom handlers
4. **Week 4**: API endpoints with [Authorize] attributes
5. **Week 5**: Group synchronization service
6. **Week 6**: Frontend MSAL integration + role-based routes
7. **Week 7**: Audit logging + security hardening
8. **Week 8**: Testing + deployment

---

**Last Updated**: 2026-02-26  
**Status**: Ready for Development  
**Contact**: Project Orchestrator
