# Djoppie-Hive Architecture - Mermaid Diagrams

## 1. Role Hierarchy (Graph)

```mermaid
graph TD
    A["👑 System Admin<br/>Full Access"] --> B["🔒 HR Manager<br/>Department Admin"]
    A --> C["📊 HR Coordinator<br/>Edit & Manage"]
    B --> D["👤 HR Specialist<br/>Limited Edit"]
    C --> D
    D --> E["👁️ Viewer<br/>Read Only"]
    A --> F["👤 Self-Service User<br/>Own Data Only"]
```

## 2. Authentication Flow (Sequence)

```mermaid
sequenceDiagram
    participant User
    participant React as React SPA
    participant MSAL
    participant EntraID as Entra ID
    participant Backend as API Backend
    participant DB as Database

    User->>React: Click Login
    React->>MSAL: initializeAuthApp()
    MSAL->>EntraID: Redirect to /authorize
    EntraID->>User: Show login form
    User->>EntraID: Enter credentials
    EntraID->>MSAL: Authorization code
    MSAL->>MSAL: Exchange for token
    MSAL->>React: Token cached
    React->>User: ✓ Logged in

    Note over User,Backend: Authenticated Request
    User->>React: Call API
    React->>MSAL: getAccessToken()
    MSAL->>React: Return token
    React->>Backend: GET /api/employees<br/>Auth: Bearer token
    Backend->>Backend: Validate token signature
    Backend->>Backend: Extract claims
    Backend->>DB: Query (filtered by role)
    DB->>Backend: Results
    Backend->>React: 200 OK + data
    React->>User: Display results
```

## 3. Authorization Decision Tree

```mermaid
graph TD
    A["🔐 API Request Received"] --> B{"Has Bearer Token?"}
    B -->|NO| C["401 Unauthorized"]
    B -->|YES| D["Validate Token Signature"]
    D --> E{"Signature Valid?"}
    E -->|NO| F["401 Unauthorized"]
    E -->|YES| G["Extract Claims"]
    G --> H["Load User & Roles from DB"]
    H --> I{"User Found?"}
    I -->|NO| J["403 Forbidden"]
    I -->|YES| K{"Endpoint Requires Role?"}
    K -->|NO| L["Check Row-Level Security"]
    K -->|YES| M{"User Has Role?"}
    M -->|NO| N["403 Forbidden"]
    M -->|YES| L
    L --> O{"Can Access Resource?"}
    O -->|NO| P["404 Not Found"]
    O -->|YES| Q["✅ Execute Endpoint"]
    Q --> R["Audit Log Event"]
    R --> S["Return 200 OK + Data"]
```

## 4. User Groups & Distribution Groups

```mermaid
graph LR
    subgraph EntraID["🔷 Entra ID Groups"]
        A["IT Support"]
        B["HR Managers"]
        C["HR Coordinators"]
    end

    subgraph M365["📧 Microsoft 365 Distribution"]
        D["MG-HR-All"]
        E["MG-HR-Managers"]
        F["MG-IT-Support"]
    end

    subgraph DB["🗄️ Local Database"]
        G["Groups Table"]
        H["GroupMembers Table"]
        I["Users Table"]
    end

    A --> D
    B --> E
    A --> F
    
    D --> G
    E --> G
    F --> G
    
    G --> H
    I --> H
```

## 5. Database Relationships (RBAC)

```mermaid
erDiagram
    USERS ||--o{ USERROLES : has
    ROLES ||--o{ USERROLES : assigned
    ROLES ||--o{ ROLEPERMISSIONS : contains
    PERMISSIONS ||--o{ ROLEPERMISSIONS : granted_by
    USERS ||--o{ USERGROUPS : member_of
    GROUPS ||--o{ USERGROUPS : contains
    USERS ||--o{ GROUPMEMBERS : owns
    GROUPS ||--o{ GROUPMEMBERS : managed_by
    USERS ||--o{ AUDITLOGS : audited_by
    
    USERS {
        uuid UserId PK
        uuid ObjectId "Entra ID"
        string Email
        string FirstName
        string LastName
        string Department
        datetime CreatedAt
    }
    
    ROLES {
        uuid RoleId PK
        string Name
        string DisplayName
        text Description
    }
    
    USERROLES {
        uuid UserId FK
        uuid RoleId FK
        datetime AssignedAt
    }
    
    PERMISSIONS {
        uuid PermissionId PK
        string Resource
        string Action
        text Description
    }
    
    ROLEPERMISSIONS {
        uuid RoleId FK
        uuid PermissionId FK
        datetime GrantedAt
    }
    
    GROUPS {
        uuid GroupId PK
        string DisplayName
        string GroupType "SecurityGroup|DistributionGroup"
        string ExternalId "Graph API ID"
        string Mail
    }
    
    USERGROUPS {
        uuid UserId FK
        uuid GroupId FK
        datetime AssignedAt
    }
    
    GROUPMEMBERS {
        uuid GroupId FK
        uuid UserId FK
        string MemberRole
        datetime AddedAt
    }
    
    AUDITLOGS {
        uuid AuditLogId PK
        uuid UserId FK
        string Action
        string ResourceType
        uuid ResourceId
        json OldValues
        json NewValues
        datetime Timestamp
    }
```

## 6. API Authorization Attributes

```mermaid
graph TD
    A["GET /api/employees"] --> B["[Authorize]"]
    B --> C{"Endpoint<br/>Authorization"}
    C -->|"[Authorize(Roles='HR.Manager,HR.Coordinator')]"| D["Only these roles"]
    C -->|"[Authorize(Policy='DepartmentAccess')]"| E["Custom policy check"]
    C -->|"[AllowAnonymous]"| F["No auth required"]
    
    D --> G["Token has required role?"]
    E --> H["Custom logic check"]
    F --> I["Allow all"]
    
    G --> J{"✅ YES"}
    G --> K{"❌ NO"}
    H --> J
    H --> K
    I --> L["✅ Proceed"]
    
    J --> M["Audit Log"]
    K --> N["403 Forbidden<br/>+ Audit Log"]
    L --> M
    M --> O["Execute Handler"]
```

## 7. Microsoft Graph Service Principal Flow

```mermaid
sequenceDiagram
    participant Backend as Backend API
    participant AppReg as App Registration
    participant TokenSvc as Token Service
    participant Graph as Microsoft Graph
    participant M365 as Microsoft 365

    Backend->>AppReg: Get credentials
    AppReg-->>Backend: Client ID + Secret
    
    Backend->>TokenSvc: POST /token<br/>client_credentials grant
    TokenSvc->>TokenSvc: Validate credentials
    TokenSvc-->>Backend: Access Token (app scope)
    
    Backend->>Graph: GET /groups<br/>?$filter=startswith(displayName,'MG-')
    Graph->>M365: Query Distribution Groups
    M365-->>Graph: Groups list
    Graph-->>Backend: JSON response
    
    Backend->>Backend: Parse & cache
    Backend->>DB: Store in Groups table
    
    Note over Backend,M365: Scheduled sync (daily)<br/>or triggered on demand
```

## 8. Data Access Control (Row-Level Security)

```mermaid
graph TD
    A["User requests Employee #123"] --> B["Load Employee Record"]
    B --> C{"Check Access Rules"}
    
    C -->|"Role: System Admin"| D["✅ Full Access"]
    C -->|"Role: HR Manager<br/>+ Same Department"| E["✅ Can View & Edit"]
    C -->|"Role: HR Specialist<br/>+ Not Same Dept"| F["❌ 404 Not Found<br/>RLS Hidden"]
    C -->|"Self-Service<br/>+ Own Record"| G["✅ Limited Edit"]
    C -->|"Viewer Role"| H["✅ Read Only"]
    C -->|"Other User<br/>Different Role"| I["❌ 403 Forbidden"]
```

## 9. Token Validation & Claims Pipeline

```mermaid
graph LR
    A["Bearer Token"] --> B["Extract Header"]
    B --> C["Parse JWT"]
    C --> D["Get Public Key<br/>from Entra ID"]
    D --> E["Verify Signature"]
    
    E -->|"Invalid"| F["❌ Reject"]
    E -->|"Valid"| G["Validate Expiration"]
    
    G -->|"Expired"| H["❌ Reject"]
    G -->|"Active"| I["Extract Claims"]
    
    I --> J["oid<br/>upn<br/>roles<br/>scp"]
    J --> K["Load User<br/>from DB"]
    K --> L["Map Groups→Roles"]
    L --> M["✅ Create<br/>ClaimsPrincipal"]
    M --> N["Authorize Endpoint"]
```

## 10. Complete Request Lifecycle

```mermaid
sequenceDiagram
    participant Client as Browser Client
    participant App as React App
    participant API as API Backend
    participant Validator as Token Validator
    participant Handler as Endpoint Handler
    participant DB as Database
    participant AuditLog as Audit Log

    Client->>App: User Action
    App->>App: Check if token expired
    
    alt Token Expired
        App->>App: Silent token refresh
    end
    
    App->>API: HTTP Request + Bearer Token
    
    API->>Validator: Validate Token
    Validator->>Validator: Verify signature
    Validator->>Validator: Check expiration
    Validator->>DB: Load User & Roles
    
    alt Validation Failed
        API-->>App: 401 Unauthorized
    else Validation Success
        Validator->>API: ✅ Claims Principal
        API->>Handler: [Authorize] Check
        
        alt Authorization Failed
            API-->>App: 403 Forbidden
        else Authorization Success
            Handler->>DB: Query Data
            DB-->>Handler: Results (filtered)
            Handler->>Handler: Apply RLS
            Handler->>AuditLog: Log access
            Handler-->>API: Response DTO
            API-->>App: 200 OK + JSON
            App->>Client: Update UI
        end
    end
```

## 11. Environment Comparison

```mermaid
graph LR
    subgraph Dev["🛠️ Development"]
        A["localhost:5173"]
        B["HTTPS: Disabled"]
        C["CORS: Permissive"]
        D["Secrets: User Secrets"]
        E["Auth: Enabled"]
    end
    
    subgraph Prod["🚀 Production"]
        F["azurestaticapps.net"]
        G["HTTPS: Required"]
        H["CORS: Restricted"]
        I["Secrets: Key Vault"]
        J["Auth: Strict"]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    
    F --> G
    F --> H
    F --> I
    F --> J
```

## 12. GDPR Compliance Data Lifecycle

```mermaid
graph TD
    A["Employee Hired"] --> B["Data Collected"]
    B --> C["Stored in DB"]
    C --> D["Active Employment"]
    D --> E{"Employee<br/>Leaves?"}
    E -->|NO| D
    E -->|YES| F["Termination Event"]
    F --> G["Mark as Inactive"]
    G --> H["2-Year Retention"]
    H --> I["Begin Anonymization"]
    I --> J["7-Year Archive<br/>Compliance Hold"]
    J --> K["Delete/Purge"]
    
    L["Data Subject Request"] --> M{"Request Type?"}
    M -->|"Access"| N["Export All Data"]
    M -->|"Deletion"| O["Soft Delete<br/>30-Day Grace"]
    M -->|"Correction"| P["Update Record"]
    M -->|"Portability"| Q["Machine-Readable<br/>Export"]
```

---

**Diagram Version**: 1.0  
**Format**: Mermaid (compatible with GitHub, Azure DevOps, GitLab)  
**Note**: Copy these diagrams to render in any Mermaid viewer
