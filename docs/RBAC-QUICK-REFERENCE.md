# RBAC Quick Reference Card

Print this page or save as PDF for quick lookup while coding.

---

## 🔐 Role Permissions At-A-Glance

```
┌─────────────────────┬──────┬────────┬─────┬─────────┬──────────────┐
│ Role                │ Read │ Create │Edit │ Delete  │ Manage Grps  │
├─────────────────────┼──────┼────────┼─────┼─────────┼──────────────┤
│ SystemAdmin         │ ✅*  │ ✅*    │✅*  │ ✅*     │ ✅*          │
│ HR.Manager          │ ✅*  │ ✅*    │✅*  │ ❌      │ ✅           │
│ HR.Coordinator      │ ✅*  │ ✅*    │✅*  │ ❌      │ ❌           │
│ HR.Specialist       │ ✅#  │ ❌     │✅#  │ ❌      │ ❌           │
│ Viewer              │ ✅#  │ ❌     │❌   │ ❌      │ ❌           │
│ User (Self-Service) │ ✅ᵒ  │ ❌     │✅ᵒ  │ ❌      │ ❌           │
└─────────────────────┴──────┴────────┴─────┴─────────┴──────────────┘

Legend: * = Full system | # = Department only | ᵒ = Own record only
```

---

## 🎯 Authorization Attributes

### Endpoint-Level Authorization

```csharp
// Allow authenticated users (any role)
[Authorize]
public IActionResult GetData() { }

// Specific roles
[Authorize(Roles = "HR.Manager,HR.Coordinator")]
public IActionResult CreateEmployee() { }

// Admin-only
[Authorize(Roles = "SystemAdmin")]
public IActionResult DeleteEmployee(Guid id) { }

// Anonymous (no auth required)
[AllowAnonymous]
public IActionResult GetPublicInfo() { }

// Custom policy
[Authorize(Policy = "DepartmentAccess")]
public IActionResult GetEmployeesByDept() { }
```

---

## 🔑 Extracting User Claims

```csharp
// Get the current user's Object ID (from Entra ID)
var userId = User.FindFirst("oid")?.Value;

// Get user's roles
var roles = User.FindAll(ClaimTypes.Role);

// Get user's department
var department = User.FindFirst("department")?.Value;

// Get user principal name
var upn = User.FindFirst("preferred_username")?.Value;

// Check if user has role
bool isManager = User.IsInRole("HR.Manager");
```

---

## 🗄️ Database Query Reference

```sql
-- Get user with roles
SELECT u.*, r.Name as RoleName
FROM Users u
LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
LEFT JOIN Roles r ON ur.RoleId = r.RoleId
WHERE u.ObjectId = @objectId;

-- Get role permissions
SELECT p.Name, p.Resource, p.Action
FROM Roles r
JOIN RolePermissions rp ON r.RoleId = rp.RoleId
JOIN Permissions p ON rp.PermissionId = p.PermissionId
WHERE r.Name = 'HR.Manager';

-- Get user's groups
SELECT g.*
FROM Groups g
JOIN UserGroups ug ON g.GroupId = ug.GroupId
WHERE ug.UserId = @userId;

-- Get audit logs for user
SELECT * FROM AuditLogs
WHERE UserId = @userId
ORDER BY Timestamp DESC;
```

---

## 🔗 Token Structure

### In JWT Token Payload
```json
{
  "oid": "3c43f6-8ec9-4f5d-b5d0...",     // User's Entra ID
  "upn": "john.doe@diepenbeek.onmicrosoft.com",
  "roles": ["HR.Manager", "HR.Coordinator"],
  "department": "HR",
  "scp": "access_as_user",                // Scope
  "aud": "api://2b620e06-39ee-4177...",   // API ID
  "exp": 1234571490,                      // Expiration time
  "iat": 1234567890                       // Issued at
}
```

---

## 🚦 Authorization Decision Tree

```
Request arrives with Bearer token
    ↓
Has valid signature? → NO → 401 Unauthorized
    ↓ YES
Has not expired? → NO → 401 Unauthorized
    ↓ YES
Extract claims (oid, roles)
    ↓
User exists in DB? → NO → 403 Forbidden
    ↓ YES
Load user's roles
    ↓
Endpoint requires role? → YES → User has role? → NO → 403 Forbidden
    ↓ NO                           ↓ YES
    ↓                              ↓
Can access resource? → NO → 404 Not Found
    ↓ YES
✅ 200 OK - Execute endpoint
```

---

## 📋 Checklist: Adding New Endpoint

```
☐ 1. Determine required roles
☐ 2. Add [Authorize(Roles = "...")] attribute
☐ 3. Extract userId from claims
☐ 4. Implement row-level security check
☐ 5. Apply department/field filters as needed
☐ 6. Add audit logging
☐ 7. Add try-catch with proper error handling
☐ 8. Write unit tests with different roles
☐ 9. Test with Postman (valid + invalid tokens)
☐ 10. Update API documentation/Swagger
```

---

## 🛡️ Security Best Practices

### DO ✅
```csharp
// DO: Use [Authorize] on all protected endpoints
[Authorize(Roles = "HR.Manager")]
public IActionResult UpdateEmployee(Guid id) { }

// DO: Perform RLS checks before returning data
if (employee.Department != userDepartment && !user.IsSystemAdmin)
    return NotFound();

// DO: Audit all data modifications
await _auditService.LogAsync(new AuditLog { ... });

// DO: Return 404 for unauthorized resources
// (hide that the resource exists)

// DO: Use Azure Key Vault for secrets
var secret = await _keyVault.GetSecretAsync("connection-string");

// DO: Validate and sanitize input
if (!ModelState.IsValid) return BadRequest(ModelState);
```

### DON'T ❌
```csharp
// DON'T: Return 403 for missing resources
if (employee == null) return Forbid(); // BAD: reveals existence

// DON'T: Store secrets in code
var connStr = "Server=...; Password=actual_password"; // BAD

// DON'T: Trust client-side role checks
// Always validate on server: if (!User.IsInRole("..."))

// DON'T: Log sensitive data
logger.LogInformation($"Password: {password}"); // BAD

// DON'T: Use role-based auth alone for sensitive data
// Combine with RLS: check both role AND record ownership

// DON'T: Skip audit logging
// Every modification must be logged
```

---

## 🔄 Authentication Flow (Quick Version)

```
1. User clicks Login
2. MSAL redirects to Entra ID login page
3. User enters credentials
4. Entra ID returns authorization code
5. MSAL exchanges code for JWT token
6. Token stored in browser (localStorage)
7. Frontend makes API call with Bearer token
8. Backend validates token signature
9. Backend extracts user info and roles
10. Backend executes request (or denies if unauthorized)
```

---

## 📞 API Endpoints Reference

```
GET    /api/employees                      # Get all (filtered by role)
GET    /api/employees/{id}                 # Get one (RLS check)
POST   /api/employees                      # Create (role-based)
PUT    /api/employees/{id}                 # Update (FLS + RLS)
DELETE /api/employees/{id}                 # Delete (admin only)

GET    /api/groups                         # List groups
POST   /api/groups                         # Create group (admin/manager)
PUT    /api/groups/{id}                    # Update group
DELETE /api/groups/{id}                    # Delete group

GET    /api/me                             # Get current user profile
GET    /api/users/{id}/roles               # Get user's roles

GET    /api/audit-logs                     # View audit trail (admin)
```

---

## 🧪 Testing Checklist

```sql
-- Test Case 1: System Admin can see all employees
-- User Role: SystemAdmin, Expected: 200 OK, all records

-- Test Case 2: HR Manager sees only own department
-- User Role: HR.Manager, Dept: HR, Expected: 200 OK, HR only

-- Test Case 3: HR Specialist cannot create employees
-- User Role: HR.Specialist, Action: POST, Expected: 403 Forbidden

-- Test Case 4: Viewer cannot modify records
-- User Role: Viewer, Action: PUT, Expected: 403 Forbidden

-- Test Case 5: Self-Service user can only edit own record
-- User Role: User, Resource: Other's record, Expected: 404 Not Found

-- Test Case 6: Expired token is rejected
-- Token Expired: true, Expected: 401 Unauthorized

-- Test Case 7: Invalid token signature is rejected
-- Token Valid: false, Expected: 401 Unauthorized

-- Test Case 8: All changes are audited
-- Action: Modify employee, Expected: AuditLog entry created
```

---

## 💾 Entity Framework Models (Template)

```csharp
public class User
{
    public Guid UserId { get; set; }
    public string ObjectId { get; set; }      // Entra ID
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Department { get; set; }
    public bool IsActive { get; set; }
    
    public ICollection<UserRole> UserRoles { get; set; }
    public ICollection<UserGroup> UserGroups { get; set; }
}

public class Role
{
    public Guid RoleId { get; set; }
    public string Name { get; set; }          // e.g., "HR.Manager"
    public string DisplayName { get; set; }
    public string Description { get; set; }
    
    public ICollection<UserRole> UserRoles { get; set; }
    public ICollection<RolePermission> RolePermissions { get; set; }
}

public class Group
{
    public Guid GroupId { get; set; }
    public string DisplayName { get; set; }
    public string GroupType { get; set; }    // "Security" or "Distribution"
    public string ExternalId { get; set; }   // From Microsoft Graph
    public string Mail { get; set; }
    
    public ICollection<UserGroup> UserGroups { get; set; }
}

public class AuditLog
{
    public Guid AuditLogId { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; }        // CREATE, UPDATE, DELETE, READ
    public string ResourceType { get; set; }  // "Employee", "Group"
    public Guid ResourceId { get; set; }
    public string OldValues { get; set; }     // JSON
    public string NewValues { get; set; }     // JSON
    public DateTime Timestamp { get; set; }
}
```

---

## 🌐 Microsoft Graph API Quick Reference

```csharp
// Get all groups
var groups = await _graphClient.Groups
    .Request()
    .Filter("startswith(displayName, 'MG-')")
    .GetAsync();

// Add member to group
await _graphClient.Groups[groupId].Members.References
    .Request()
    .AddAsync(user);

// Remove member from group
await _graphClient.Groups[groupId].Members[userId].Reference
    .Request()
    .DeleteAsync();

// Get group members
var members = await _graphClient.Groups[groupId].Members
    .Request()
    .GetAsync();

// Create new group
var group = new Group
{
    DisplayName = "MG-NewGroup",
    GroupTypes = new List<string> { "Unified" },
    MailEnabled = true,
    SecurityEnabled = false,
    MailNickname = "MG-NewGroup"
};
await _graphClient.Groups.Request().AddAsync(group);
```

---

## 🎓 Key Terms Glossary

| Term | Definition |
|------|-----------|
| **RBAC** | Role-Based Access Control - permissions based on user roles |
| **RLS** | Row-Level Security - filtering data based on user's department |
| **FLS** | Field-Level Security - restricting which fields can be edited |
| **JWT** | JSON Web Token - secure token containing user claims |
| **Bearer Token** | JWT token sent in Authorization header for API calls |
| **Entra ID** | Microsoft Azure Active Directory - identity provider |
| **MSAL** | Microsoft Authentication Library - handles login/token |
| **Service Principal** | Application identity for server-to-server auth |
| **Scope** | Permissions requested in OAuth token |
| **Claim** | Information in JWT token (oid, roles, department, etc.) |
| **Audit Log** | Record of who did what, when, and why |
| **GDPR** | General Data Protection Regulation - data privacy rules |

---

## 📊 Performance Considerations

```
Cache Invalidation Strategy:
├─ User roles: Cache 1 hour (or on login)
├─ Group membership: Sync daily + cache 24 hours
├─ Permissions: Cache 1 hour
└─ Audit logs: No caching (real-time writes)

Rate Limiting:
├─ Global: 100 req/min per user
├─ Sync API: 5 requests per 5 minutes
└─ Login: 5 attempts per 15 minutes

Database Indexing:
├─ Users(ObjectId) - for Entra ID lookup
├─ UserRoles(UserId) - for permission checking
├─ AuditLogs(UserId, Timestamp) - for audit trail queries
└─ GroupMembers(GroupId) - for group queries
```

---

## ✅ Pre-Deployment Checklist

- [ ] All [Authorize] attributes applied
- [ ] RLS implemented for all data queries
- [ ] Audit logging added to all write operations
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] HTTPS enabled in production
- [ ] CORS policy configured
- [ ] Secrets in Azure Key Vault
- [ ] Rate limiting enabled
- [ ] Security headers added
- [ ] Token refresh logic tested
- [ ] Error messages don't leak sensitive info
- [ ] Expired tokens return 401, not 403
- [ ] Performance: DB queries optimized
- [ ] Load testing completed

---

**Print & Keep Handy** 📌

Version: 1.0 | Last Updated: 2026-02-26
