# Backend API Integration

This document describes the integration of the frontend with the backend API for employee and volunteer management.

## Overview

The frontend now connects to the real backend API at `http://localhost:5014/api` for employee and volunteer management, replacing the previous mock data implementation.

## Changes Made

### 1. API Types (`src/services/api.ts`)

Added comprehensive TypeScript types matching the backend API:

- **EmployeeType**: `'Personeel' | 'Vrijwilliger' | 'Interim' | 'Extern' | 'Stagiair'`
- **ArbeidsRegimeAPI**: `'Voltijds' | 'Deeltijds' | 'Vrijwilliger'`
- **DataSource**: `'AzureAD' | 'Handmatig'`

**Key Interfaces**:

```typescript
interface Employee {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  email: string;
  jobTitle: string;
  department: string;
  officeLocation?: string | null;
  mobilePhone?: string | null;
  groups: string[];
  isActive: boolean;
  bron: DataSource;
  isHandmatigToegevoegd: boolean;
  employeeType: EmployeeType;
  arbeidsRegime: ArbeidsRegimeAPI;
  photoUrl?: string | null;
  dienstId?: string | null;
  dienstNaam?: string | null;
  startDatum?: string | null;
  eindDatum?: string | null;
  telefoonnummer?: string | null;
  vrijwilligerDetails?: VrijwilligerDetails | null;
  createdAt: string;
  updatedAt?: string | null;
  lastSyncedAt?: string | null;
}

interface VrijwilligerDetails {
  id: string;
  beschikbaarheid?: string | null;
  specialisaties?: string | null;
  noodContactNaam?: string | null;
  noodContactTelefoon?: string | null;
  vogDatum?: string | null;
  vogGeldigTot?: string | null;
}
```

**Updated employeesApi**:

```typescript
export const employeesApi = {
  getAll: (filter?: EmployeeFilter) => Promise<Employee[]>
  getById: (id: string) => Promise<Employee>
  create: (dto: CreateEmployeeDto) => Promise<Employee>
  update: (id: string, dto: UpdateEmployeeDto) => Promise<Employee>
  delete: (id: string) => Promise<void>
  search: (query: string) => Promise<Employee[]>
  getByDienst: (dienstId: string) => Promise<Employee[]>
  getVolunteers: () => Promise<Employee[]>
}
```

### 2. Employee Service (`src/services/employeeService.ts`)

New service layer providing employee management operations with proper error handling:

**Functions**:

- `getEmployees(filter?: EmployeeFilter)` - Get all employees with optional filtering
- `getEmployee(id: string)` - Get single employee by ID
- `createEmployee(dto: CreateEmployeeDto)` - Create new employee
- `updateEmployee(id: string, dto: UpdateEmployeeDto)` - Update existing employee
- `deleteEmployee(id: string)` - Delete employee
- `searchEmployees(query: string)` - Search employees by query
- `getEmployeesByDienst(dienstId: string)` - Get employees by service/department
- `getVolunteers()` - Get all volunteers

All functions include proper error handling with Dutch error messages.

### 3. Volunteer Service (`src/services/volunteerService.ts`)

Specialized service for volunteer management:

**Functions**:

- `getVolunteers()` - Get all volunteers
- `getVolunteer(id: string)` - Get single volunteer (validates type)
- `createVolunteer(dto: CreateVolunteerDto)` - Create new volunteer
- `updateVolunteer(id: string, dto: UpdateVolunteerDto)` - Update volunteer
- `updateVolunteerDetails(id, details)` - Update volunteer-specific details (VOG, noodcontact)
- `deleteVolunteer(id: string)` - Delete volunteer

### 4. Type Mapper Utilities (`src/utils/employeeMapper.ts`)

Utilities to map between backend API types and frontend types:

**Mapping Functions**:

- `mapEmployeeTypeToPersoneelType()` - Backend → Frontend type mapping
- `mapPersoneelTypeToEmployeeType()` - Frontend → Backend type mapping
- `mapArbeidsRegimeFromAPI()` - Backend → Frontend arbeidsregime
- `mapArbeidsRegimeToAPI()` - Frontend → Backend arbeidsregime
- `mapEmployeeToMedewerker()` - Full Employee → Medewerker conversion
- `mapMedewerkerToCreateDto()` - Medewerker → CreateEmployeeDto
- `mapMedewerkerToUpdateDto()` - Medewerker → UpdateEmployeeDto

### 5. Updated PersoneelLijst Component (`src/pages/PersoneelLijst.tsx`)

Complete rewrite to use real API instead of mock data:

**Key Changes**:

- Removed dependency on `PersoneelContext`
- Added local state management with `useState`:
  - `medewerkers` - Employee list from API
  - `loading` - Loading state
  - `error` - Error state with user-friendly messages
- Added `useEffect` to load employees on mount
- Updated `handleSave` to async function calling API
- Updated `handleDelete` to async function calling API
- Added loading spinner UI
- Added error banner UI with dismiss functionality

**Loading State**:

```typescript
if (loading) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Personeelslijst</h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', ... }}>
        <Loader2 size={24} className="spin" />
        <span>Medewerkers laden...</span>
      </div>
    </div>
  );
}
```

**Error Handling**:

```typescript
{error && (
  <div style={{ padding: '12px 16px', backgroundColor: '#FEE', ... }}>
    <AlertCircle size={20} />
    <span>{error}</span>
    <button onClick={() => setError(null)}>
      <X size={16} />
    </button>
  </div>
)}
```

### 6. CSS Additions (`src/index.css`)

Added spin animation for loading spinner:

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}
```

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/employees` | GET | Get all employees (with optional filters) |
| `/employees/:id` | GET | Get employee by ID |
| `/employees` | POST | Create new employee |
| `/employees/:id` | PUT | Update employee |
| `/employees/:id` | DELETE | Delete employee |
| `/employees/search?q=...` | GET | Search employees |
| `/employees/dienst/:dienstId` | GET | Get employees by dienst |
| `/employees?employeeType=Vrijwilliger` | GET | Get volunteers |

## Filter Parameters

The API supports the following query parameters for filtering:

- `employeeType` - Filter by type (Personeel, Vrijwilliger, etc.)
- `arbeidsRegime` - Filter by regime (Voltijds, Deeltijds, Vrijwilliger)
- `isActive` - Filter by active status (true/false)
- `dienstId` - Filter by dienst ID
- `search` - Search query string
- `bron` - Filter by data source (AzureAD, Handmatig)

## Error Handling

All API calls include comprehensive error handling:

1. **Network Errors**: Caught and displayed with user-friendly Dutch messages
2. **Authentication Errors** (401): "Sessie verlopen. Log opnieuw in."
3. **Authorization Errors** (403): "Geen toegang tot deze functie."
4. **Server Errors**: Display error message from API or generic fallback

Example:

```typescript
try {
  const employees = await employeeService.getEmployees();
  setMedewerkers(employees.map(mapEmployeeToMedewerker));
} catch (err) {
  setError(err instanceof Error ? err.message : 'Kan medewerkers niet laden');
}
```

## Data Flow

```
Backend API (http://localhost:5014/api)
    ↓
employeesApi.getAll() - Raw API call with auth
    ↓
employeeService.getEmployees() - Error handling wrapper
    ↓
mapEmployeeToMedewerker() - Type conversion
    ↓
PersoneelLijst component - Display in UI
```

## Type Mapping Examples

### Backend → Frontend

```typescript
// Backend API response
{
  employeeType: "Personeel",
  arbeidsRegime: "Voltijds",
  bron: "AzureAD"
}

// Mapped to frontend
{
  type: "personeel",
  arbeidsRegime: "voltijds",
  bronAD: true
}
```

### Frontend → Backend

```typescript
// Frontend form data
{
  type: "vrijwilliger",
  arbeidsRegime: "vrijwilliger",
  actief: true
}

// Mapped to API DTO
{
  employeeType: "Vrijwilliger",
  arbeidsRegime: "Vrijwilliger",
  isActive: true
}
```

## Testing the Integration

### 1. Start Backend API

```bash
cd C:\Djoppie\Djoppie-Hive
dotnet run --project DjoppieHive.API
# API should be running at http://localhost:5014
```

### 2. Start Frontend

```bash
cd C:\Djoppie\Djoppie-Hive\hr-personeel
npm run dev
# Frontend should be running at http://localhost:5173
```

### 3. Test Operations

**Load Employees**:

- Navigate to Personeelslijst
- Should show loading spinner, then employee list
- Should show data source icons (Cloud for Azure, UserPlus for Manual)

**Create Employee**:

- Click "Nieuwe Medewerker"
- Fill form with required fields
- Click "Opslaan"
- Should see new employee in list

**Update Employee**:

- Click edit icon on employee row
- Modify fields
- Click "Opslaan"
- Should see updated data

**Delete Employee**:

- Click delete icon
- Confirm deletion
- Should see employee removed from list

**Error Handling**:

- Stop backend API
- Try any operation
- Should see error banner with appropriate message

## Breaking Changes

### Removed Dependencies

- `PersoneelContext` is NO LONGER USED in PersoneelLijst
- Mock data is bypassed in favor of real API data

### Changed Behavior

- All operations are now **async** and may show loading states
- Errors are displayed in a dismissible banner instead of alerts
- Data is fetched from backend on component mount

## Future Improvements

1. **Caching**: Implement React Query/TanStack Query for better caching
2. **Optimistic Updates**: Update UI immediately before API confirmation
3. **Debounced Search**: Implement search debouncing for better UX
4. **Pagination**: Add pagination for large employee lists
5. **Real-time Updates**: WebSocket integration for live updates
6. **Offline Support**: Service worker for offline functionality

## Troubleshooting

### Issue: "Kan medewerkers niet laden"

**Solution**: Check that backend API is running at <http://localhost:5014>

### Issue: "Sessie verlopen. Log opnieuw in."

**Solution**: MSAL token expired, re-authenticate through login flow

### Issue: TypeScript errors in employeeMapper

**Solution**: Ensure all imports use correct types from `../services/api`

### Issue: Empty employee list

**Solution**: Check backend database has employees, check browser console for API errors

## Files Modified

- `src/services/api.ts` - Updated Employee types and API
- `src/pages/PersoneelLijst.tsx` - Complete rewrite with API integration
- `src/index.css` - Added spin animation

## Files Created

- `src/services/employeeService.ts` - Employee service layer
- `src/services/volunteerService.ts` - Volunteer service layer
- `src/utils/employeeMapper.ts` - Type mapping utilities
- `BACKEND_INTEGRATION.md` - This documentation file

## Configuration

Backend API URL is configured in `.env.development`:

```env
VITE_API_URL=http://localhost:5014/api
```

For production, update `.env.production`:

```env
VITE_API_URL=https://app-djoppie-hive-dev-api.azurewebsites.net/api
```
