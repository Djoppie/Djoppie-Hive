# Djoppie-Hive Architecture Schematics

## Authentication & Authorization Flow

### 1. Complete Auth Flow (MSAL → Entra ID → API → Microsoft Graph)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION & AUTHORIZATION FLOW                  │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: USER LOGIN
─────────────────────
    User                 Browser              MSAL React           Entra ID
      │                     │                     │                    │
      │ Click Login         │                     │                    │
      ├────────────────────>│                     │                    │
      │                     │ initializeAuthApp() │                    │
      │                     ├────────────────────>│                    │
      │                     │                     │ Redirect to        │
      │                     │                     │ /authorize         │
      │                     │                     ├───────────────────>│
      │                     │                     │                    │ User
      │                     │                     │                    │ Logs In
      │                     │                     │<───────────────────┤
      │                     │                     │ (username/password)│
      │                     │                     │                    │
      │                     │  Auth Code + ID    │                    │
      │                     │<───────────────────┤                    │
      │                     │                    │                    │
      │<──────────────────────────────────────────┤                    │
      │  Logged in! Token cached                  │                    │
      │


PHASE 2: API REQUEST WITH TOKEN
────────────────────────────────
    Frontend             MSAL React            Interceptor          Backend API
      │                     │                     │                    │
      │ Call API            │                     │                    │
      ├────────────────────>│                     │                    │
      │                     │ getAccessToken()    │                    │
      │                     ├────────────────────>│                    │
      │                     │<────────────────────┤                    │
      │                     │  Access Token       │                    │
      │                     │                     │ Authorization      │
      │                     │                     │ Bearer: <token>    │
      │                     │                     ├───────────────────>│
      │                     │                     │                    │ Validate Token
      │                     │                     │                    │ Extract Claims
      │                     │                     │                    │ (User ID, Roles)
      │                     │                     │                    │
      │                     │                     │<───────────────────┤
      │                     │                     │  Response + Data   │
      │                     │                     │  (role-filtered)   │
      │<────────────────────────────────────────────────────────────────┤
      │  Data (filtered by role)                                         │
      │


PHASE 3: MICROSOFT GRAPH API (Service-to-Service)
──────────────────────────────────────────────────
    Backend API            Service Principal       Microsoft Graph      Microsoft 365
      │                          │                      │                    │
      │ Need Distribution Groups  │                      │                    │
      ├─────────────────────────> │                      │                    │
      │                           │ Token (using         │                    │
      │                           │  app credentials)    │                    │
      │                           ├─────────────────────>│                    │
      │                           │<─────────────────────┤                    │
      │                           │   Access Token       │                    │
      │                           │                      │ GET /groups        │
      │                           │                      │ (filter MG-)       │
      │                           ├─────────────────────>│                    │
      │                           │                      │ Query M365         │
      │                           │                      ├───────────────────>│
      │                           │                      │<───────────────────┤
      │                           │                      │   Distribution     │
      │                           │                      │   Groups Data      │
      │                           │<─────────────────────┤                    │
      │<─────────────────────────────────────────────────┤                    │
      │   Group Data                                      │                    │
      │   (cached in DB)                                  │                    │

```

---

## 2. Role-Based Access Control (RBAC) Model

### Role Hierarchy

```
┌────────────────────────────────────────────────────────────────────┐
│                         ROLE HIERARCHY                              │
│                      (Pyramid Model)                                │
└────────────────────────────────────────────────────────────────────┘

                            System Admin
                                 △
                                / \
                               /   \
                              /     \
                             /       \
                            /         \
                    HR Manager      HR Coordinator
                        △                △
                       / \              / \
                      /   \            /   \
                     /     \          /     \
                    /       \        /       \
                   /         \      /         \
              HR Specialist   Viewer      Viewer
                   △                         △
                  /|\                       /|\
                 / | \                     / | \
              Reports  Self-Service    Reports  Reports
              (limited)                (limited) (limited)


PERMISSIONS MATRIX
─────────────────────────────────────────────────────────────────

Role                  │ View   │ Create │ Edit   │ Delete │ Manage │ Graph API
                      │ Empl.  │ Empl.  │ Empl.  │ Empl.  │ Groups │ Access
──────────────────────┼────────┼────────┼────────┼────────┼────────┼──────────
System Admin          │  ✓ *   │  ✓ *   │  ✓ *   │  ✓ *   │  ✓ *  │   ✓ *
HR Manager            │  ✓ *   │  ✓ *   │  ✓ *   │  ✗     │  ✓    │   ✓
HR Coordinator        │  ✓ *   │  ✓ *   │  ✓ *   │  ✗     │  ✗    │   ✓
HR Specialist         │  ✓ #   │  ✗     │  ✓ #   │  ✗     │  ✗    │   ✗
Viewer                │  ✓ #   │  ✗     │  ✗     │  ✗     │  ✗    │   ✗
User (Self-Service)   │  ✓ own │  ✗     │  ✓ own │  ✗     │  ✗    │   ✗

Legend:  * = Full system access
         # = Department/limited access
         own = Only own record
         ✓ = Allowed | ✗ = Denied

```

### Permission Scopes

```
┌──────────────────────────────────────────────────────────┐
│              PERMISSION SCOPES (OAuth 2.0)               │
└──────────────────────────────────────────────────────────┘

api://2b620e06-39ee-4177-a559-76a12a79320f/
│
├── access_as_user           [READ, CREATE, UPDATE]
│   └── Authenticated user operations
│
├── admin.read              [READ ONLY]
│   └── View all employees (admin scope)
│
├── admin.write             [READ, CREATE, UPDATE, DELETE]
│   └── Modify employees (admin scope)
│
├── group.manage            [READ, CREATE, UPDATE, DELETE]
│   └── Manage distribution groups
│
└── graph.api.admin         [GRAPH API ACCESS]
    └── Call Microsoft Graph with elevated privileges

```

---

## 3. User Groups & Distribution Groups Architecture

### User Group Model

```
┌────────────────────────────────────────────────────────────────────┐
│                    USER GROUPS ARCHITECTURE                         │
└────────────────────────────────────────────────────────────────────┘

ENTRA ID GROUPS (Security Groups)
─────────────────────────────────
    ┌─────────────────────────────────────────┐
    │    Gemeente Diepenbeek Tenant            │
    │    Tenant ID: 7db28d6f-d542-40c1...      │
    └─────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    IT Support      HR Managers      HR Coordinators
    Group ID:       Group ID:        Group ID:
    [guid-1]        [guid-2]         [guid-3]
        │                │                │
        ├─ User1         ├─ User2         ├─ User4
        ├─ User2         └─ User3         └─ User5
        └─ User3


MICROSOFT 365 DISTRIBUTION GROUPS (MG- prefix)
────────────────────────────────────────────────
    In Microsoft Graph:
    GET /groups?$filter=startswith(displayName, 'MG-')
    
    Response Example:
    ┌──────────────────────────────────────────────┐
    │ MG-HR-All (All HR Staff)                     │
    │ - displayName: "MG-HR-All"                   │
    │ - mail: "MG-HR-All@diepenbeek.onmicrosoft.com"
    │ - members: [User2, User3, User4, User5, ...]│
    └──────────────────────────────────────────────┘
    
    ┌──────────────────────────────────────────────┐
    │ MG-HR-Managers (HR Managers Only)            │
    │ - displayName: "MG-HR-Managers"              │
    │ - mail: "MG-HR-Managers@..."                 │
    │ - members: [User2, User3]                    │
    └──────────────────────────────────────────────┘

```

### Group Membership Flow

```
┌────────────────────────────────────────────────────────────────────┐
│            GROUP MEMBERSHIP SYNC & MANAGEMENT FLOW                 │
└────────────────────────────────────────────────────────────────────┘

INITIAL SYNC (Scheduled Job - daily)
──────────────────────────────────────
    Entra ID Groups              Backend Database         Frontend Cache
    (Security Groups)            (Djoppie-Hive DB)        (Local Storage)
            │                             │                      │
            │ GET /groups                 │                      │
            │ (with members)              │                      │
            ├────────────────────────────>│                      │
            │                             │ Store/Update        │
            │                             │ Groups + Members     │
            │                             ├─────────────────────>│
            │                             │                      │
            │                    API: /api/groups                │
            │<───────────────────────────────────────────────────┤
            │                   (paginated, cached)               │


REAL-TIME GROUP MANAGEMENT (Manual)
────────────────────────────────────
    User (HR Manager)          Frontend            API             Microsoft Graph
            │                      │                │                    │
            │ Modify Group         │                │                    │
            │ (add/remove member)  │                │                    │
            ├─────────────────────>│                │                    │
            │                      │ PUT /groups    │                    │
            │                      │ /update        │                    │
            │                      ├───────────────>│                    │
            │                      │                │ Validate           │
            │                      │                │ - Check permission │
            │                      │                │ - Audit log        │
            │                      │                │                    │
            │                      │                │ PATCH /groups/..   │
            │                      │                ├───────────────────>│
            │                      │                │                    │ Update
            │                      │                │                    │ in M365
            │                      │                │<───────────────────┤
            │                      │                │                    │
            │                      │<───────────────┤                    │
            │                      │ Success +      │                    │
            │                      │ Updated Data   │                    │
            │<─────────────────────┤                │                    │
            │ ✓ Member added       │                │                    │
            │ (refresh cache)       │                │                    │


GROUP TYPES IN DATABASE
─────────────────────────
Table: Groups
  ├── GroupId (PK)
  ├── DisplayName
  ├── GroupType: "SecurityGroup" | "DistributionGroup"
  ├── Source: "EntraID" | "Manual"
  ├── ExternalId (for Graph integration)
  ├── Mail (for distribution groups)
  ├── CreatedAt
  ├── ModifiedAt
  └── Metadata: JSON


Table: GroupMembers (Join Table)
  ├── GroupId (FK)
  ├── UserId (FK)
  ├── MemberRole: "Member" | "Owner"
  ├── AddedAt
  └── AddedBy (UserID of who added)

```

---

## 4. Authorization Check Flow (Per Request)

```
┌────────────────────────────────────────────────────────────────────┐
│          API REQUEST AUTHORIZATION CHECK PIPELINE                  │
└────────────────────────────────────────────────────────────────────┘

HTTP Request arrives at Backend API
         │
         ▼
    ┌─────────────────────────────────┐
    │  1. Extract Bearer Token        │
    │     from Authorization header   │
    └─────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────┐
    │  2. Validate Token Signature    │
    │     (using public key from      │
    │      Entra ID metadata)         │
    └─────────────────────────────────┘
         │
         ├─── NO ───────────> 401 Unauthorized
         │
         ▼ YES
    ┌─────────────────────────────────┐
    │  3. Extract Claims from Token   │
    │     - oid (Object ID)           │
    │     - upn (User Principal Name) │
    │     - appid (App ID)            │
    │     - roles (from AD groups)    │
    └─────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────┐
    │  4. Load User & Roles from DB   │
    │     based on oid                │
    └─────────────────────────────────┘
         │
         ├─── NOT FOUND ────> 403 Forbidden
         │
         ▼ FOUND
    ┌─────────────────────────────────┐
    │  5. Check Endpoint Authorization│
    │     [Authorize(Roles="...")]    │
    └─────────────────────────────────┘
         │
         ├─── DENIED ────────> 403 Forbidden
         │
         ▼ ALLOWED
    ┌─────────────────────────────────┐
    │  6. Load Resource (if needed)   │
    │     e.g., Employee record       │
    └─────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────┐
    │  7. Check Row-Level Security    │
    │     - Can user see this data?   │
    │     - Is it in their dept?      │
    └─────────────────────────────────┘
         │
         ├─── DENIED ────────> 404 Not Found
         │                     (hide resource)
         │
         ▼ ALLOWED
    ┌─────────────────────────────────┐
    │  8. Execute Endpoint Handler    │
    │     and Return Data             │
    └─────────────────────────────────┘
         │
         ▼
      200 OK with filtered data

```

---

## 5. Database Schema (RBAC Core)

```
┌────────────────────────────────────────────────────────────────────┐
│              DATABASE SCHEMA - RBAC ENTITIES                        │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      Users           │
├──────────────────────┤
│ UserId (PK)          │  ◄─────┐
│ ObjectId (Entra ID)  │        │ (one-to-many)
│ Email                │        │
│ FirstName            │        │
│ LastName             │        ├──────────┐
│ Department           │        │          │
│ CreatedAt            │        │          │
│ ModifiedAt           │        │          │
└──────────────────────┘        │          │
         │                      │          │
         │ (many-to-many)       │          │
         │                      │          │
    ┌────▼──────────────┐   ┌───┴─────────┴──────────┐
    │  UserRoles       │   │  UserGroups            │
    ├──────────────────┤   ├──────────────────────┐  │
    │ UserId (FK)      │   │ UserId (FK)       │◄─┘
    │ RoleId (FK)  ◄───┼───│ GroupId (FK)   ◄──┴────┐
    │ AssignedAt       │   │ AssignedAt             │
    └──────────────────┘   └──────────────────────┘  │
         △                          △                 │
         │                          │                 │
         │                          └─────────────────┼─────┐
         │                                            │     │
    ┌────┴────────────────┐                   ┌──────┴──┐  │
    │   Roles             │                   │ Groups   │  │
    ├─────────────────────┤                   ├─────────┤  │
    │ RoleId (PK)         │                   │ GroupId  │  │
    │ Name                │                   │ Name     │  │
    │ DisplayName         │                   │ Type     │  │
    │ Description         │                   │ ExternalId
    │ CreatedAt           │                   │ CreatedAt   │
    └─────────────────────┘                   └─────────────┘
           │                                         │
           │ (one-to-many)                          │
           │                                    (many-to-many)
           │                                        │
    ┌──────▼─────────────────┐         ┌────────────▼─────┐
    │  RolePermissions       │         │  GroupMembers    │
    ├────────────────────────┤         ├──────────────────┤
    │ RoleId (FK)            │         │ GroupId (FK)     │
    │ PermissionId (FK)  ◄───┼─────┬───│ UserId (FK)      │
    │ GrantedAt              │     │   │ MemberRole       │
    └────────────────────────┘     │   │ AddedAt          │
                                   │   │ AddedBy (FK)     │
                              ┌────┴───┴──────┐           │
                              │ Permissions   │           │
                              ├───────────────┤           │
                              │ PermissionId  │           │
                              │ Name          │           │
                              │ Resource      │           │
                              │ Action        │           │
                              │ Description   │           │
                              └───────────────┘           │
                                                          │
                              ┌───────────────────────────┘
                              │
                              ▼
                         Audit Trail
                         - Who modified what
                         - When
                         - Why (reason)

```

---

## 6. Token Claims & Scopes

```
┌────────────────────────────────────────────────────────────────────┐
│              ID TOKEN vs ACCESS TOKEN STRUCTURE                     │
└────────────────────────────────────────────────────────────────────┘

ID TOKEN (from login, stored in browser)
────────────────────────────────────────
{
  "aud": "2ea8a14d-ea05-40cc-af35-dd482bf8e235",    // App ID
  "iss": "https://login.microsoftonline.com/{tenantId}/v2.0",
  "iat": 1234567890,
  "exp": 1234571490,
  "sub": "3c43f6-8ec9-4f5d-b5d0...",                 // Subject (user's oid)
  "oid": "3c43f6-8ec9-4f5d-b5d0...",                 // Object ID (Entra ID)
  "upn": "john.doe@diepenbeek.onmicrosoft.com",     // User Principal Name
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john.doe@diepenbeek.onmicrosoft.com",
  "email_verified": true,
  "groups": [
    "3c43f6-8ec9-4f5d-b5d0...",  // Group ObjectIDs from Entra
    "4d54f7-9fd0-4g6e-c6e1...",
    "5e65f8-0ge1-5h7f-d7f2..."
  ]
}


ACCESS TOKEN (sent to backend API)
──────────────────────────────────
{
  "aud": "api://2b620e06-39ee-4177-a559-76a12a79320f",  // Backend API ID
  "iss": "https://login.microsoftonline.com/{tenantId}/v2.0",
  "iat": 1234567890,
  "exp": 1234571490,
  "sub": "3c43f6-8ec9-4f5d-b5d0...",
  "oid": "3c43f6-8ec9-4f5d-b5d0...",
  "upn": "john.doe@diepenbeek.onmicrosoft.com",
  "appid": "2ea8a14d-ea05-40cc-af35-dd482bf8e235",     // Client App ID
  "scp": "access_as_user",                             // Scope
  "roles": [                                            // Roles from groups
    "HR.Manager",
    "HR.Coordinator"
  ],
  "department": "HR"                                     // Optional custom claim
}


SCOPE DEFINITIONS (in Backend App Registration)
────────────────────────────────────────────────
api://2b620e06-39ee-4177-a559-76a12a79320f/
  │
  ├── access_as_user
  │   │ Admin consent: Not required
  │   │ User consent: Allowed
  │   │ Description: "Access Djoppie-Hive on your behalf"
  │   └── Used in: User API calls
  │
  ├── admin.read
  │   │ Admin consent: Required
  │   │ User consent: Not allowed
  │   │ Description: "Read all employee records (admin only)"
  │   └── Used in: Admin endpoints
  │
  ├── admin.write
  │   │ Admin consent: Required
  │   │ User consent: Not allowed
  │   │ Description: "Modify employee records (admin only)"
  │   └── Used in: Admin modification endpoints
  │
  └── group.manage
      │ Admin consent: Required
      │ User consent: Not allowed
      │ Description: "Manage distribution groups"
      └── Used in: Group management endpoints

```

---

## 7. CORS & Security Boundaries

```
┌────────────────────────────────────────────────────────────────────┐
│            CORS & SECURITY BOUNDARIES                              │
└────────────────────────────────────────────────────────────────────┘

FRONTEND <-> API COMMUNICATION
──────────────────────────────
Request from: https://djoppie-hive-dev.azurestaticapps.net
    │
    ├─ Origin: https://djoppie-hive-dev.azurestaticapps.net
    │
    ▼
Backend API (https://app-djoppie-hive-dev-api.azurewebsites.net)
    │
    ├─ Check CORS Policy
    │
    ├─── ALLOWED_ORIGINS = [
    │      "https://djoppie-hive-dev.azurestaticapps.net",     (Dev)
    │      "https://djoppie-hive-prod.azurestaticapps.net"     (Prod)
    │    ]
    │
    ├─ ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    │
    ├─ ALLOWED_HEADERS = ["Authorization", "Content-Type"]
    │
    └─ ALLOWED_CREDENTIALS = true
       (allows sending auth cookies/tokens)


CREDENTIALS HANDLING
────────────────────
Development (.env.development):
  VITE_API_BASE_URL=http://localhost:5014
  (local development, no CORS issues)

Production (.env.production):
  VITE_API_BASE_URL=https://app-djoppie-hive-dev-api.azurewebsites.net
  Axios configured with:
    - withCredentials: true
    - Headers: Authorization: Bearer {token}


SECRET MANAGEMENT
─────────────────
Local Development:
  ├── .env.development (public config)
  └── User Secrets (dotnet user-secrets)
      ├── ConnectionStrings__DefaultConnection
      ├── Jwt:SigningKey
      ├── AzureAd:ClientSecret
      └── GraphAPI:Credentials

Azure Production:
  └── Azure Key Vault (kv-djoppie-hive-dev-*)
      ├── db-connection-string
      ├── jwt-signing-key
      ├── aad-client-secret
      ├── graph-service-principal-password
      └── api-admin-key

```

---

## 8. Audit & Compliance Log

```
┌────────────────────────────────────────────────────────────────────┐
│            AUDIT TRAIL & COMPLIANCE LOGGING                        │
└────────────────────────────────────────────────────────────────────┘

AuditLog Table Schema
─────────────────────
┌────────────────────────────────────────┐
│  AuditLogs                             │
├────────────────────────────────────────┤
│ AuditLogId (PK)                        │
│ UserId (FK)           ◄─ Who did it    │
│ Action                ◄─ CREATE|UPDATE
│                           |DELETE|READ
│ ResourceType          ◄─ "Employee"|
│                           "Group"|
│                           "Role"
│ ResourceId            ◄─ Which record
│ OldValues             ◄─ JSON before
│ NewValues             ◄─ JSON after
│ Changes               ◄─ Diff highlight
│ Reason                ◄─ Why changed
│ IpAddress             ◄─ From where
│ UserAgent             ◄─ Browser info
│ Timestamp             ◄─ When
│ Status                ◄─ Success|Failed
└────────────────────────────────────────┘


AUDIT EVENTS LOGGED
───────────────────
✓ User Login (success/failure)
✓ Employee Created/Modified/Deleted
✓ Role Assignments Added/Removed
✓ Group Membership Changed
✓ Permissions Granted/Revoked
✓ Distribution Group Synchronized
✓ Graph API Calls Made
✓ Failed Authorization Attempts
✓ Admin Actions
✓ Data Exports
✓ Bulk Operations


GDPR COMPLIANCE
───────────────
Data Subject Rights Implementation:
  ├── Access Request (export all personal data)
  ├── Deletion Request (soft delete with 90-day retention)
  ├── Correction (update personal information)
  ├── Portability (export in machine-readable format)
  └── Restriction (flag record, prevent processing)

Retention Policy:
  ├── Active Employee Data: Retain while employed + 7 years
  ├── Terminated Employee Data: 2 years retention + anonymize
  ├── Audit Logs: 5 years for compliance
  ├── Temporary Data: Delete after 30 days
  └── Right to be Forgotten: 30-day grace period

```

---

## 9. Complete System Integration Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   COMPLETE SYSTEM INTEGRATION MAP                            │
└──────────────────────────────────────────────────────────────────────────────┘


                          ┌──────────────────┐
                          │   Users/Browser  │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌────────────────┐  ┌──────────┐  ┌──────────────┐
          │  React SPA     │  │MSAL Auth │  │   Axios      │
          │(Static Web App)│  │          │  │ (w/Intercept)│
          └────────┬───────┘  └────┬─────┘  └──────┬───────┘
                   │               │               │
                   └───────────┬───┴───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ HTTPS/HTTPS         │
                    │ Bearer Token        │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────▼─────────────────────┐
         │      ASP.NET Core Backend API             │
         │      (App Service)                        │
         ├──────────────────────────────────────────┤
         │ Middleware Stack:                        │
         │  • Token Validation                      │
         │  • CORS Checking                         │
         │  • Authorization Attributes              │
         │  • Audit Logging                         │
         └──────────────────┬──────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌───────────┐    ┌────────────┐   ┌──────────────┐
    │  Database │    │ Entra ID   │   │ Microsoft    │
    │  SQL Svr  │    │  Validation│   │ Graph API    │
    │ (Azure)   │    │            │   │              │
    └─────┬─────┘    └────────────┘   └──────┬───────┘
          │                                   │
          │                          ┌────────▼────────┐
          │                          │  Microsoft 365  │
          │                          │ - Distribution  │
          │                          │   Groups        │
          │                          │ - Exchange      │
          └───────────────────────────────────────────┘


DATA FLOW FOR EMPLOYEE RETRIEVAL
────────────────────────────────
Frontend                          Backend                 Database
   │                                 │                         │
   │ GET /api/employees              │                         │
   ├────────────────────────────────>│                         │
   │                                 │ 1. Validate token       │
   │                                 │ 2. Check role perms     │
   │                                 │ 3. Query DB             │
   │                                 ├────────────────────────>│
   │                                 │<────────────────────────┤
   │                                 │ Results (filtered)      │
   │                                 │ 4. Audit log event      │
   │<────────────────────────────────┤ 5. Cache response       │
   │ JSON (filtered by role)         │                         │
   │                                 │                         │


MICROSOFT GRAPH INTEGRATION
───────────────────────────
Backend Service Principal
   │
   ├─ App Registration: Djoppie-Hive-API
   │  ├─ Client ID: 2b620e06-39ee-4177-a559-76a12a79320f
   │  └─ Permissions: Graph.Group.ReadWrite
   │
   ├─ Service Connection (Azure DevOps)
   │  └─ Authentication: App credentials (secret in Key Vault)
   │
   └─ Runtime Operations
      ├─ GET /groups (list distribution groups)
      ├─ POST /groups (create new group)
      ├─ PATCH /groups/{id} (modify group)
      ├─ DELETE /groups/{id} (remove group)
      └─ GET /groups/{id}/members (list members)

```

---

## 10. Environment-Specific Configuration

```
┌────────────────────────────────────────────────────────────────────┐
│         ENVIRONMENT-SPECIFIC SECURITY CONFIGURATION                │
└────────────────────────────────────────────────────────────────────┘

DEVELOPMENT (Local)
───────────────────
.env.development
  VITE_API_BASE_URL=http://localhost:5014
  VITE_MSAL_CLIENT_ID=2ea8a14d-ea05-40cc-af35-dd482bf8e235
  VITE_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545

appsettings.Development.json
  AllowedHosts: "*"
  CORS Origins: http://localhost:5173, http://localhost:3000
  Token Validation: Enabled (real Entra ID)
  Logging Level: Debug
  Secrets: User Secrets (not in repo)


PRODUCTION (Azure)
──────────────────
.env.production
  VITE_API_BASE_URL=https://app-djoppie-hive-dev-api.azurewebsites.net
  VITE_MSAL_CLIENT_ID=2ea8a14d-ea05-40cc-af35-dd482bf8e235
  VITE_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545

appsettings.Production.json
  AllowedHosts: app-djoppie-hive-dev-api.azurewebsites.net
  CORS Origins: https://djoppie-hive-dev.azurestaticapps.net
  Token Validation: Enabled + Strict
  Logging Level: Information
  Secrets: Azure Key Vault
  HTTPS: Required
  HSTS: Enabled (1 year)


SECURITY CHECKLIST
──────────────────
Development:
  ☐ HTTPS disabled (localhost only)
  ☐ CORS permissive (for testing)
  ☐ Secrets in User Secrets
  ☐ Auth enabled but flexible

Production:
  ☐ HTTPS required
  ☐ CORS restricted to known origins
  ☐ Secrets in Azure Key Vault
  ☐ HSTS headers
  ☐ Security headers (CSP, X-Frame-Options, etc.)
  ☐ Rate limiting enabled
  ☐ Audit logging enabled
  ☐ WAF enabled (via App Service)

```

---

## Summary: Key Architectural Decisions

### RBAC Model

- **Pyramid Structure**: System Admin > HR Manager > HR Coordinator > HR Specialist > Viewer
- **Role-Based Permissions**: Each role has discrete, non-overlapping permission sets
- **Two-Tier Authorization**: Token-level (role check) + resource-level (row security)

### User Groups

- **Entra ID Groups**: Source of truth for role assignments (synced daily)
- **Distribution Groups**: Microsoft 365 groups (MG- prefix) for email/Teams
- **Group Membership**: Managed via Graph API with audit trail

### Authentication

- **MSAL React**: Redirects to Entra ID for login
- **Bearer Tokens**: JWT tokens included in all API requests
- **Token Validation**: Signature verification, claims extraction, role mapping

### Authorization Checks

1. **Token Validation**: Verify signature and expiration
2. **Role Check**: Verify user has required role for endpoint
3. **Resource Check**: Verify user can access specific record
4. **Audit Log**: Record all access attempts

### Data Security

- **GDPR Compliance**: Data subject rights, retention policies
- **Audit Trail**: All changes logged with before/after values
- **Secrets Management**: Azure Key Vault for production, User Secrets for dev
- **Row-Level Security**: Users only see data for their department/scope

### Microsoft Graph Integration

- **Service Principal Auth**: Backend uses app credentials (not user token)
- **Distribution Groups**: Synced from Graph to local DB
- **Rate Limiting**: 100 req/min global, 5 per 5min for sync

---

## Next Steps for Implementation

1. **Define Custom Claims**: Map Entra ID groups → Application roles
2. **Implement Middleware**: Token validation, authorization checks, audit logging
3. **Database Schema**: Create Users, Roles, UserRoles, Groups, AuditLogs tables
4. **Entity Framework Migrations**: Set up base entities for RBAC
5. **API Controllers**: Implement authorization attributes on endpoints
6. **Frontend Auth Config**: MSAL setup, token interception, role-based routing
7. **Graph Integration**: Service principal auth, group sync jobs

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-26  
**Maintained By**: Project Orchestrator  
**Status**: Complete - Ready for Implementation
