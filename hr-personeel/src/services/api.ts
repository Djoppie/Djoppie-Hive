import { msalInstance } from '../auth/AuthProvider';
import { apiRequest } from '../auth/authConfig';
import type {
  SyncResultaat,
  SyncStatusInfo,
  SyncLogboekItem,
  SyncValidatieVerzoek,
  AfhandelValidatieRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5014/api';

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

// Validatie status for employee records
export type ValidatieStatusAPI = 'Nieuw' | 'InReview' | 'Goedgekeurd' | 'Afgekeurd';

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
  validatieStatus: ValidatieStatusAPI;
  gevalideerdDoor?: string | null;
  validatieDatum?: string | null;
  photoUrl?: string | null;
  dienstId?: string | null;
  dienstNaam?: string | null;
  sectorNaam?: string | null;
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
  uitvoeren: async (): Promise<SyncResultaat> => {
    // Use test endpoint for development
    const response = await fetch(`${API_BASE_URL}/sync/test`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to start sync');
    return response.json();
  },

  /** Haal de huidige of laatste sync status op */
  getStatus: async (): Promise<SyncStatusInfo> => {
    // Use test endpoint for development
    const response = await fetch(`${API_BASE_URL}/sync/test/status`);
    if (!response.ok) throw new Error('Failed to fetch sync status');
    return response.json();
  },

  /** Haal de sync geschiedenis op */
  getGeschiedenis: async (aantal = 10): Promise<SyncLogboekItem[]> => {
    // Use test endpoint for development
    const response = await fetch(`${API_BASE_URL}/sync/test/geschiedenis?aantal=${aantal}`);
    if (!response.ok) throw new Error('Failed to fetch sync history');
    return response.json();
  },
};

export const validatieVerzoekenApi = {
  /** Haal alle openstaande validatieverzoeken op */
  getOpenstaande: async (groepId?: string): Promise<SyncValidatieVerzoek[]> => {
    const params = groepId ? `?groepId=${groepId}` : '';
    // Use test endpoint for development
    const response = await fetch(`${API_BASE_URL}/validatieverzoeken/test${params}`);
    if (!response.ok) throw new Error('Failed to fetch validation requests');
    return response.json();
  },

  /** Haal een specifiek validatieverzoek op */
  getById: (id: string) => fetchWithAuth<SyncValidatieVerzoek>(`/validatieverzoeken/${id}`),

  /** Handel een validatieverzoek af */
  afhandelen: async (id: string, request: AfhandelValidatieRequest): Promise<void> => {
    // Use test endpoint for development
    const response = await fetch(`${API_BASE_URL}/validatieverzoeken/test/${id}/afhandelen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to handle validation request');
  },

  /** Haal het aantal openstaande verzoeken op (voor badge) */
  getAantal: async (groepId?: string): Promise<number> => {
    const params = groepId ? `?groepId=${groepId}` : '';
    // Use test endpoint for development
    const response = await fetch(`${API_BASE_URL}/validatieverzoeken/test/aantal${params}`);
    if (!response.ok) throw new Error('Failed to fetch validation count');
    return response.json();
  },
};

// ============================================
// Employee Validatie API
// ============================================

export interface ValidatieActieRequest {
  status: ValidatieStatusAPI;
  opmerkingen?: string;
}

export interface ValidatieStatistieken {
  nieuw: number;
  inReview: number;
  goedgekeurd: number;
  afgekeurd: number;
  totaal: number;
}

export const employeeValidatieApi = {
  /** Update de validatiestatus van een medewerker */
  updateStatus: async (employeeId: string, request: ValidatieActieRequest): Promise<Employee> => {
    return fetchWithAuth<Employee>(`/employees/${employeeId}/validatie`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /** Haal validatie statistieken op */
  getStatistieken: async (): Promise<ValidatieStatistieken> => {
    // For now, use test endpoint
    const response = await fetch(`${API_BASE_URL}/employees/test/validatie/statistieken`);
    if (!response.ok) throw new Error('Failed to fetch validation statistics');
    return response.json();
  },

  /** Bulk goedkeuren van medewerkers */
  bulkGoedkeuren: async (employeeIds: string[]): Promise<void> => {
    return fetchWithAuth<void>('/employees/validatie/bulk-goedkeuren', {
      method: 'POST',
      body: JSON.stringify({ employeeIds }),
    });
  },
};

// ============================================
// Statistics API
// ============================================

export interface SectorStatistiek {
  sectorNaam: string;
  aantalMedewerkers: number;
  aantalDiensten: number;
}

export interface VogStatistieken {
  totaalVrijwilligers: number;
  metGeldigeVog: number;
  vogVerlooptBinnenkort: number;
  vogVerlopen: number;
  zonderVog: number;
}

export interface DashboardStatistics {
  // Totalen
  totaalMedewerkers: number;
  actiefPersoneel: number;
  inactiefPersoneel: number;
  vrijwilligers: number;
  interimmers: number;
  externen: number;
  stagiairs: number;

  // Data bronnen
  vanuitAzure: number;
  handmatigToegevoegd: number;

  // Arbeidsregime
  voltijds: number;
  deeltijds: number;
  vrijwilligersRegime: number;

  // Validatie
  openValidaties: number;

  // Sync info
  laatseSyncOp: string | null;
  laatseSyncStatus: string | null;
  totaalSyncs: number;

  // Distributiegroepen
  totaalGroepen: number;
  totaalSectoren: number;
  totaalDiensten: number;

  // Per sector breakdown
  perSector: SectorStatistiek[];

  // VOG statistieken
  vogStatistieken: VogStatistieken;
}

export const statisticsApi = {
  /** Haal dashboard statistieken op */
  getDashboard: async (): Promise<DashboardStatistics> => {
    // Use test endpoint for development
    const response = await fetch(`${API_BASE_URL}/statistics/test/dashboard`);
    if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
    return response.json();
  },
};
