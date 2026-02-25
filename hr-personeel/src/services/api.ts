import { msalInstance } from '../auth/AuthProvider';
import { apiRequest } from '../auth/authConfig';
import type {
  SyncResultaat,
  SyncStatusInfo,
  SyncLogboekItem,
  SyncValidatieVerzoek,
  AfhandelValidatieRequest,
  SyncPreview,
  EventDTO,
  EventDetailDTO,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilterCriteria,
  EventRecipientsPreview,
  EventStatusAPI,
  AuditLogDTO,
  AuditLogPagedResponse,
  AuditLogFilter,
  AuditFilterOptions,
  AuditEntityType,
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

// ============================================
// Current User API
// ============================================

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  sectorId: string | null;
  dienstId: string | null;
  employeeId: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return fetchWithAuth<CurrentUser>('/me');
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

// ============================================
// Organization Hierarchy Types (MG-iedereenpersoneel)
// ============================================

/**
 * Complete organizational hierarchy starting from MG-iedereenpersoneel.
 */
export interface OrganizationHierarchy {
  rootGroupId: string;
  rootGroupName: string;
  sectors: Sector[];
  totalSectors: number;
  totalDiensten: number;
  totalMedewerkers: number;
}

/**
 * A sector (MG-SECTOR-*) with its sector manager and diensten.
 */
export interface Sector {
  id: string;
  displayName: string;
  description: string | null;
  email: string | null;
  sectorManager: EmployeeSummary | null;
  diensten: Dienst[];
  totalMedewerkers: number;
}

/**
 * A dienst (MG-* service) within a sector, with its members.
 */
export interface Dienst {
  id: string;
  displayName: string;
  description: string | null;
  email: string | null;
  medewerkers: EmployeeSummary[];
  memberCount: number;
}

// Legacy type (kept for backwards compatibility)
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
  sectorId?: string;
  search?: string;
  bron?: DataSource;
}

export const distributionGroupsApi = {
  getAll: () => fetchWithAuth<DistributionGroup[]>('/distributiongroups'),

  /**
   * Gets the complete organizational hierarchy starting from MG-iedereenpersoneel.
   * Returns all sectors, their sector managers, diensten, and medewerkers.
   */
  getHierarchy: () => fetchWithAuth<OrganizationHierarchy>('/distributiongroups/hierarchy'),

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
    if (filter?.employeeType) params.append('type', filter.employeeType);
    if (filter?.arbeidsRegime) params.append('regime', filter.arbeidsRegime);
    if (filter?.isActive !== undefined) params.append('isActive', filter.isActive.toString());
    if (filter?.dienstId) params.append('dienstId', filter.dienstId);
    if (filter?.sectorId) params.append('sectorId', filter.sectorId);
    if (filter?.search) params.append('searchTerm', filter.search);
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

  /** Export all personal data for GDPR compliance (Article 15) */
  exportGdprData: async (id: string): Promise<void> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Niet aangemeld. Log opnieuw in.');
    }

    const response = await fetch(`${API_BASE_URL}/employees/${id}/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

    // Get the JSON data and trigger download
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Get filename from Content-Disposition header or generate one
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `GDPR_Export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) {
        filename = match[1];
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
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
  uitvoeren: (): Promise<SyncResultaat> => {
    return fetchWithAuth<SyncResultaat>('/sync/uitvoeren', { method: 'POST' });
  },

  /** Haal de huidige of laatste sync status op */
  getStatus: (): Promise<SyncStatusInfo> => {
    return fetchWithAuth<SyncStatusInfo>('/sync/status');
  },

  /** Haal de sync geschiedenis op */
  getGeschiedenis: (aantal = 10): Promise<SyncLogboekItem[]> => {
    return fetchWithAuth<SyncLogboekItem[]>(`/sync/geschiedenis?aantal=${aantal}`);
  },

  /** Haal een preview op van wat er gesynchroniseerd zou worden (voor AD Import) */
  getPreview: (): Promise<SyncPreview> => {
    return fetchWithAuth<SyncPreview>('/sync/preview');
  },
};

export const validatieVerzoekenApi = {
  /** Haal alle openstaande validatieverzoeken op */
  getOpenstaande: (groepId?: string): Promise<SyncValidatieVerzoek[]> => {
    const params = groepId ? `?groepId=${groepId}` : '';
    return fetchWithAuth<SyncValidatieVerzoek[]>(`/validatieverzoeken${params}`);
  },

  /** Haal een specifiek validatieverzoek op */
  getById: (id: string): Promise<SyncValidatieVerzoek> => {
    return fetchWithAuth<SyncValidatieVerzoek>(`/validatieverzoeken/${id}`);
  },

  /** Handel een validatieverzoek af */
  afhandelen: (id: string, request: AfhandelValidatieRequest): Promise<void> => {
    return fetchWithAuth<void>(`/validatieverzoeken/${id}/afhandelen`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /** Haal het aantal openstaande verzoeken op (voor badge) */
  getAantal: (groepId?: string): Promise<number> => {
    const params = groepId ? `?groepId=${groepId}` : '';
    return fetchWithAuth<number>(`/validatieverzoeken/aantal${params}`);
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
  updateStatus: (employeeId: string, request: ValidatieActieRequest): Promise<Employee> => {
    return fetchWithAuth<Employee>(`/employees/${employeeId}/validatie`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /** Haal validatie statistieken op */
  getStatistieken: (): Promise<ValidatieStatistieken> => {
    return fetchWithAuth<ValidatieStatistieken>('/employees/validatie/statistieken');
  },

  /** Bulk goedkeuren van medewerkers */
  bulkGoedkeuren: (employeeIds: string[]): Promise<void> => {
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
  getDashboard: (): Promise<DashboardStatistics> => {
    return fetchWithAuth<DashboardStatistics>('/statistics/dashboard');
  },
};

// ============================================
// User Roles API
// ============================================

export interface UserRole {
  id: string;
  entraObjectId: string;
  email: string;
  displayName: string;
  role: string;
  roleDisplayName: string;
  sectorId: string | null;
  sectorNaam: string | null;
  dienstId: string | null;
  dienstNaam: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface CreateUserRoleDto {
  entraObjectId: string;
  email: string;
  displayName: string;
  role: string;
  sectorId?: string;
  dienstId?: string;
}

export interface UpdateUserRoleDto {
  role?: string;
  sectorId?: string;
  dienstId?: string;
  isActive?: boolean;
}

export interface UserSearchResult {
  entraObjectId: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  hasExistingRole: boolean;
  existingRoles: string[] | null;
}

export interface RoleDefinition {
  id: string;
  displayName: string;
  description: string;
  scope: string;
  permissions: string[];
}

export const userRolesApi = {
  /** Haal alle gebruikersrollen op */
  getAll: (): Promise<UserRole[]> => {
    return fetchWithAuth<UserRole[]>('/userroles');
  },

  /** Haal een specifieke rol op */
  getById: (id: string): Promise<UserRole> => {
    return fetchWithAuth<UserRole>(`/userroles/${id}`);
  },

  /** Haal rollen voor een specifieke gebruiker op */
  getByUserId: (entraObjectId: string): Promise<UserRole[]> => {
    return fetchWithAuth<UserRole[]>(`/userroles/user/${entraObjectId}`);
  },

  /** Maak een nieuwe roltoewijzing aan */
  create: (dto: CreateUserRoleDto): Promise<UserRole> => {
    return fetchWithAuth<UserRole>('/userroles', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /** Update een roltoewijzing */
  update: (id: string, dto: UpdateUserRoleDto): Promise<UserRole> => {
    return fetchWithAuth<UserRole>(`/userroles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  /** Verwijder een roltoewijzing */
  delete: (id: string): Promise<void> => {
    return fetchWithAuth<void>(`/userroles/${id}`, {
      method: 'DELETE',
    });
  },

  /** Zoek gebruikers voor roltoekenning */
  searchUsers: (query: string): Promise<UserSearchResult[]> => {
    return fetchWithAuth<UserSearchResult[]>(`/userroles/search/users?q=${encodeURIComponent(query)}`);
  },

  /** Haal rol definities op */
  getDefinitions: (): Promise<RoleDefinition[]> => {
    return fetchWithAuth<RoleDefinition[]>('/userroles/definitions');
  },
};

// ============================================
// Events API (Uitnodigingen)
// ============================================

export const eventsApi = {
  /** Haal alle events op */
  getAll: (status?: EventStatusAPI): Promise<EventDTO[]> => {
    const params = status ? `?status=${status}` : '';
    return fetchWithAuth<EventDTO[]>(`/events${params}`);
  },

  /** Haal een specifiek event op met deelnemers */
  getById: (id: string): Promise<EventDetailDTO> => {
    return fetchWithAuth<EventDetailDTO>(`/events/${id}`);
  },

  /** Maak een nieuw event aan */
  create: (dto: CreateEventRequest): Promise<EventDTO> => {
    return fetchWithAuth<EventDTO>('/events', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /** Werk een event bij */
  update: (id: string, dto: UpdateEventRequest): Promise<EventDTO> => {
    return fetchWithAuth<EventDTO>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  /** Verstuur een event */
  versturen: (id: string): Promise<EventDTO> => {
    return fetchWithAuth<EventDTO>(`/events/${id}/versturen`, {
      method: 'POST',
    });
  },

  /** Annuleer een event */
  annuleren: (id: string): Promise<EventDTO> => {
    return fetchWithAuth<EventDTO>(`/events/${id}/annuleren`, {
      method: 'POST',
    });
  },

  /** Verwijder een event */
  delete: (id: string): Promise<void> => {
    return fetchWithAuth<void>(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  /** Preview van ontvangers op basis van filters */
  previewOntvangers: (
    filters: EventFilterCriteria,
    distributieGroepId?: string
  ): Promise<EventRecipientsPreview> => {
    const params = distributieGroepId ? `?distributieGroepId=${distributieGroepId}` : '';
    return fetchWithAuth<EventRecipientsPreview>(`/events/preview-ontvangers${params}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },
};

// ============================================
// Audit API - GDPR Audit Logs
// ============================================

export const auditApi = {
  /** Haal audit logs op met filters en paginering */
  getLogs: (filter: AuditLogFilter = {}): Promise<AuditLogPagedResponse> => {
    const params = new URLSearchParams();
    if (filter.fromDate) params.append('fromDate', filter.fromDate);
    if (filter.toDate) params.append('toDate', filter.toDate);
    if (filter.userId) params.append('userId', filter.userId);
    if (filter.action) params.append('action', filter.action);
    if (filter.entityType) params.append('entityType', filter.entityType);
    if (filter.entityId) params.append('entityId', filter.entityId);
    if (filter.pageNumber) params.append('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());

    const queryString = params.toString();
    return fetchWithAuth<AuditLogPagedResponse>(`/audit${queryString ? `?${queryString}` : ''}`);
  },

  /** Haal audit geschiedenis op voor een specifieke entiteit */
  getEntityHistory: (entityType: AuditEntityType, entityId: string): Promise<AuditLogDTO[]> => {
    return fetchWithAuth<AuditLogDTO[]>(`/audit/entity/${entityType}/${entityId}`);
  },

  /** Haal beschikbare filter opties op */
  getFilterOptions: (): Promise<AuditFilterOptions> => {
    return fetchWithAuth<AuditFilterOptions>('/audit/options');
  },
};
