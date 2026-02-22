import { msalInstance } from '../auth/AuthProvider';
import { apiRequest } from '../auth/authConfig';
import type {
  SyncResultaat,
  SyncStatusInfo,
  SyncLogboekItem,
  SyncValidatieVerzoek,
  AfhandelValidatieRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

// Get access token for API calls
async function getAccessToken(): Promise<string | null> {
  const account = msalInstance.getActiveAccount();
  if (!account) {
    return null;
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...apiRequest,
      account,
    });
    return response.accessToken;
  } catch {
    // If silent token acquisition fails, try interactive
    try {
      const response = await msalInstance.acquireTokenPopup(apiRequest);
      return response.accessToken;
    } catch (interactiveError) {
      console.error('Failed to acquire token:', interactiveError);
      return null;
    }
  }
}

// Generic fetch wrapper with authentication
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Niet aangemeld. Log opnieuw in.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Sessie verlopen. Log opnieuw in.');
    }
    if (response.status === 403) {
      throw new Error('Geen toegang tot deze functie.');
    }
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : (null as unknown as T);
}

// Distribution Groups API
export interface DistributionGroup {
  id: string;
  displayName: string;
  description: string | null;
  email: string;
  memberCount: number;
}

export interface NestedGroup {
  id: string;
  displayName: string;
  description: string | null;
  email: string | null;
  memberCount: number;
}

export interface DistributionGroupDetail extends DistributionGroup {
  members: EmployeeSummary[];
  owners: EmployeeSummary[];
  nestedGroups: NestedGroup[];
}

export interface EmployeeSummary {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
}

// Sector with hierarchy info
export interface SectorWithHierarchy {
  id: string;
  displayName: string;
  description: string | null;
  email: string;
  memberCount: number;
  owners: EmployeeSummary[];
  nestedGroups: NestedGroup[];
  directMembers: EmployeeSummary[];
}

// Employee types matching backend API
export type EmployeeType = 'Personeel' | 'Vrijwilliger' | 'Interim' | 'Extern' | 'Stagiair';
export type ArbeidsRegimeAPI = 'Voltijds' | 'Deeltijds' | 'Vrijwilliger';
export type DataSource = 'AzureAD' | 'Handmatig';

export interface VrijwilligerDetails {
  id: string;
  beschikbaarheid?: string | null;
  specialisaties?: string | null;
  noodContactNaam?: string | null;
  noodContactTelefoon?: string | null;
  vogDatum?: string | null;
  vogGeldigTot?: string | null;
}

export interface Employee {
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

export interface CreateEmployeeDto {
  givenName: string;
  surname: string;
  email: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  employeeType: EmployeeType;
  arbeidsRegime: ArbeidsRegimeAPI;
  dienstId?: string;
  startDatum?: string;
  eindDatum?: string;
  telefoonnummer?: string;
  isActive?: boolean;
}

export interface UpdateEmployeeDto {
  givenName?: string;
  surname?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  employeeType?: EmployeeType;
  arbeidsRegime?: ArbeidsRegimeAPI;
  dienstId?: string;
  startDatum?: string;
  eindDatum?: string;
  telefoonnummer?: string;
  isActive?: boolean;
  vrijwilligerDetails?: {
    beschikbaarheid?: string;
    specialisaties?: string;
    noodContactNaam?: string;
    noodContactTelefoon?: string;
    vogDatum?: string;
    vogGeldigTot?: string;
  };
}

export interface CreateVolunteerDto extends CreateEmployeeDto {
  employeeType: 'Vrijwilliger';
  arbeidsRegime: 'Vrijwilliger';
  vrijwilligerDetails?: {
    beschikbaarheid?: string;
    specialisaties?: string;
    noodContactNaam?: string;
    noodContactTelefoon?: string;
    vogDatum?: string;
    vogGeldigTot?: string;
  };
}

export interface UpdateVolunteerDto extends UpdateEmployeeDto {
  vrijwilligerDetails?: {
    beschikbaarheid?: string;
    specialisaties?: string;
    noodContactNaam?: string;
    noodContactTelefoon?: string;
    vogDatum?: string;
    vogGeldigTot?: string;
  };
}

export interface EmployeeFilter {
  employeeType?: EmployeeType;
  arbeidsRegime?: ArbeidsRegimeAPI;
  isActive?: boolean;
  dienstId?: string;
  search?: string;
  bron?: DataSource;
}

export const distributionGroupsApi = {
  getAll: () => fetchWithAuth<DistributionGroup[]>('/distributiongroups'),

  getById: (id: string) =>
    fetchWithAuth<DistributionGroupDetail>(`/distributiongroups/${id}`),

  getMembers: (id: string) =>
    fetchWithAuth<EmployeeSummary[]>(`/distributiongroups/${id}/members`),

  addMember: (groupId: string, userId: string) =>
    fetchWithAuth<void>(`/distributiongroups/${groupId}/members/${userId}`, {
      method: 'POST',
    }),

  removeMember: (groupId: string, userId: string) =>
    fetchWithAuth<void>(`/distributiongroups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),
};

export const employeesApi = {
  getAll: (filter?: EmployeeFilter) => {
    const params = new URLSearchParams();
    if (filter?.employeeType) params.append('employeeType', filter.employeeType);
    if (filter?.arbeidsRegime) params.append('arbeidsRegime', filter.arbeidsRegime);
    if (filter?.isActive !== undefined) params.append('isActive', filter.isActive.toString());
    if (filter?.dienstId) params.append('dienstId', filter.dienstId);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.bron) params.append('bron', filter.bron);

    const queryString = params.toString();
    return fetchWithAuth<Employee[]>(`/employees${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => fetchWithAuth<Employee>(`/employees/${id}`),

  create: (dto: CreateEmployeeDto) =>
    fetchWithAuth<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateEmployeeDto) =>
    fetchWithAuth<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  delete: (id: string) =>
    fetchWithAuth<void>(`/employees/${id}`, {
      method: 'DELETE',
    }),

  search: (query: string) =>
    fetchWithAuth<Employee[]>(`/employees/search?q=${encodeURIComponent(query)}`),

  getByDienst: (dienstId: string) =>
    fetchWithAuth<Employee[]>(`/employees/dienst/${dienstId}`),

  getVolunteers: () =>
    fetchWithAuth<Employee[]>('/employees?employeeType=Vrijwilliger'),
};

// Health check (no auth required)
export const healthApi = {
  check: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};

// ============================================
// Synchronisatie API
// ============================================

export const syncApi = {
  /** Start een handmatige synchronisatie vanuit Microsoft Graph */
  uitvoeren: () => fetchWithAuth<SyncResultaat>('/sync/uitvoeren', { method: 'POST' }),

  /** Haal de huidige of laatste sync status op */
  getStatus: () => fetchWithAuth<SyncStatusInfo>('/sync/status'),

  /** Haal de sync geschiedenis op */
  getGeschiedenis: (aantal = 10) =>
    fetchWithAuth<SyncLogboekItem[]>(`/sync/geschiedenis?aantal=${aantal}`),
};

export const validatieVerzoekenApi = {
  /** Haal alle openstaande validatieverzoeken op */
  getOpenstaande: (groepId?: string) => {
    const params = groepId ? `?groepId=${groepId}` : '';
    return fetchWithAuth<SyncValidatieVerzoek[]>(`/validatieverzoeken${params}`);
  },

  /** Haal een specifiek validatieverzoek op */
  getById: (id: string) => fetchWithAuth<SyncValidatieVerzoek>(`/validatieverzoeken/${id}`),

  /** Handel een validatieverzoek af */
  afhandelen: (id: string, request: AfhandelValidatieRequest) =>
    fetchWithAuth<void>(`/validatieverzoeken/${id}/afhandelen`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  /** Haal het aantal openstaande verzoeken op (voor badge) */
  getAantal: (groepId?: string) => {
    const params = groepId ? `?groepId=${groepId}` : '';
    return fetchWithAuth<number>(`/validatieverzoeken/aantal${params}`);
  },
};
