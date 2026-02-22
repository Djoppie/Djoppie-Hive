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

export interface Employee {
  id: string;
  displayName: string;
  givenName: string | null;
  surname: string | null;
  email: string;
  jobTitle: string | null;
  department: string | null;
  officeLocation: string | null;
  mobilePhone: string | null;
  groups: string[];
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
  getAll: () => fetchWithAuth<Employee[]>('/employees'),

  getById: (id: string) => fetchWithAuth<Employee>(`/employees/${id}`),

  search: (query: string) =>
    fetchWithAuth<EmployeeSummary[]>(`/employees/search?q=${encodeURIComponent(query)}`),
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
