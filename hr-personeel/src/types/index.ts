export type ArbeidsRegime = 'voltijds' | 'deeltijds' | 'vrijwilliger';

export type PersoneelType = 'personeel' | 'vrijwilliger' | 'interim' | 'extern';

export type ValidatieStatus = 'nieuw' | 'in_review' | 'goedgekeurd' | 'afgekeurd' | 'aangepast';

export type Rol = 'hr_admin' | 'diensthoofd' | 'sectormanager' | 'medewerker' | 'ict_super_admin';

// Role display names and descriptions
export const rolLabels: Record<Rol, string> = {
  hr_admin: 'HR Admin',
  diensthoofd: 'Diensthoofd/Teamcoach',
  sectormanager: 'Sectormanager',
  medewerker: 'Medewerker',
  ict_super_admin: 'ICT Super Admin',
};

// Role permissions configuration (prepared for future authorization)
export interface RolPermissies {
  canViewAllEmployees: boolean;
  canEditEmployees: boolean;
  canDeleteEmployees: boolean;
  canValidate: boolean;
  canManageGroups: boolean;
  canManageSettings: boolean;
  canExportData: boolean;
  canViewAuditLogs: boolean;
  scope: 'all' | 'sector' | 'dienst' | 'self';
}

export const rolPermissies: Record<Rol, RolPermissies> = {
  ict_super_admin: {
    canViewAllEmployees: true,
    canEditEmployees: true,
    canDeleteEmployees: true,
    canValidate: true,
    canManageGroups: true,
    canManageSettings: true,
    canExportData: true,
    canViewAuditLogs: true,
    scope: 'all',
  },
  hr_admin: {
    canViewAllEmployees: true,
    canEditEmployees: true,
    canDeleteEmployees: true,
    canValidate: true,
    canManageGroups: false,
    canManageSettings: false,
    canExportData: true,
    canViewAuditLogs: true,
    scope: 'all',
  },
  sectormanager: {
    canViewAllEmployees: false,
    canEditEmployees: true,
    canDeleteEmployees: false,
    canValidate: true,
    canManageGroups: false,
    canManageSettings: false,
    canExportData: true,
    canViewAuditLogs: false,
    scope: 'sector',
  },
  diensthoofd: {
    canViewAllEmployees: false,
    canEditEmployees: true,
    canDeleteEmployees: false,
    canValidate: true,
    canManageGroups: false,
    canManageSettings: false,
    canExportData: true,
    canViewAuditLogs: false,
    scope: 'dienst',
  },
  medewerker: {
    canViewAllEmployees: false,
    canEditEmployees: false,
    canDeleteEmployees: false,
    canValidate: false,
    canManageGroups: false,
    canManageSettings: false,
    canExportData: false,
    canViewAuditLogs: false,
    scope: 'self',
  },
};

export interface Medewerker {
  id: string;
  // Azure AD velden
  adId?: string;
  voornaam: string;
  achternaam: string;
  volledigeNaam: string;
  email: string;
  telefoon?: string;
  functie?: string;
  afdeling?: string;

  // HR velden
  dienst: string;
  sector: string;
  arbeidsRegime: ArbeidsRegime;
  type: PersoneelType;
  actief: boolean;
  opmerkingen: string;

  // Validatie
  validatieStatus: ValidatieStatus;
  gevalideerdDoor?: string;
  validatieDatum?: string;
  validatieOpmerkingen?: string;

  // Metadata
  bronAD: boolean;
  handmatigToegevoegd: boolean;
  aanmaakDatum: string;
  laatstGewijzigd: string;
}

export interface ValidatieVerzoek {
  id: string;
  medewerkerId: string;
  medewerkerNaam: string;
  sector: string;
  dienst: string;
  toegewezenAan: string;
  status: ValidatieStatus;
  opmerkingen: string;
  aanmaakDatum: string;
  afgerondDatum?: string;
}

export interface Uitnodiging {
  id: string;
  titel: string;
  beschrijving: string;
  datum: string;
  type: 'personeelsfeest' | 'vergadering' | 'training' | 'communicatie' | 'overig';
  ontvangers: string[];
  filters: UitnodigingFilter;
  verstuurdOp?: string;
  status: 'concept' | 'verstuurd' | 'geannuleerd';
}

export interface UitnodigingFilter {
  sectoren?: string[];
  diensten?: string[];
  types?: PersoneelType[];
  regimes?: ArbeidsRegime[];
  alleenActief?: boolean;
  distributieGroepIds?: string[];
}

export interface GebruikerProfiel {
  id: string;
  naam: string;
  email: string;
  rol: Rol;
  sector?: string;
  dienst?: string;
}

// Distributiegroepen (MG- mailgroepen uit MS365 / Exchange Admin)
export type DistributieGroepType = 'distributionGroup' | 'mailEnabledSecurity' | 'microsoft365';

export interface DistributieGroep {
  id: string;
  displayName: string;          // bijv. "MG-AllePersoneel"
  emailAddress: string;         // bijv. "mg-allepersoneel@diepenbeek.be"
  beschrijving: string;
  type: DistributieGroepType;
  ledenIds: string[];           // medewerker IDs (voor lokaal beheer)
  ledenAantal: number;          // aantal leden (van API)
  eigenaarIds: string[];        // eigenaar medewerker IDs
  bronExchange: boolean;        // uit Exchange geïmporteerd
  aanmaakDatum: string;
  laatstGewijzigd: string;
}

export interface DashboardStats {
  totaalMedewerkers: number;
  actiefPersoneel: number;
  vrijwilligers: number;
  interimmers: number;
  teValideren: number;
  goedgekeurd: number;
  afgekeurd: number;
  perSector: Record<string, number>;
  perRegime: Record<ArbeidsRegime, number>;
  perType: Record<PersoneelType, number>;
}

// ============================================
// Synchronisatie types (Microsoft Graph sync)
// ============================================

/** Bron van gegevens */
export type GegevensBron = 'AzureAD' | 'Handmatig';

/** Niveau in de groepshiërarchie */
export type GroepNiveau = 'Sector' | 'Dienst';

/** Status van een sync operatie */
export type SyncStatus = 'Bezig' | 'Voltooid' | 'Mislukt' | 'GedeeltelijkVoltooid';

/** Type validatieverzoek van sync */
export type SyncValidatieType = 'LidVerwijderd' | 'MedewerkerGedeactiveerd' | 'GroepVerwijderd' | 'GegevensConflict';

/** Status van een validatieverzoek */
export type SyncValidatieStatus = 'InAfwachting' | 'InBehandeling' | 'Goedgekeurd' | 'Afgekeurd' | 'Geescaleerd';

/** Afhandelingsactie voor validatieverzoek */
export type ValidatieAfhandeling = 'BevestigVerwijdering' | 'HandmatigHertoevoegen' | 'Negeren' | 'Escaleren';

/** Resultaat van een synchronisatie operatie */
export interface SyncResultaat {
  syncLogboekId: string;
  geStartOp: string;
  voltooidOp: string;
  status: SyncStatus;
  groepenVerwerkt: number;
  medewerkersToegevoegd: number;
  medewerkersBijgewerkt: number;
  medewerkersVerwijderd: number;
  lidmaatschappenToegevoegd: number;
  lidmaatschappenVerwijderd: number;
  validatieVerzoekenAangemaakt: number;
  foutmelding: string | null;
}

/** Huidige status van de synchronisatie */
export interface SyncStatusInfo {
  isSyncBezig: boolean;
  laatsteSyncOp: string | null;
  laatsteSyncStatus: string | null;
  huidigeSyncId: string | null;
}

/** Logboekitem van een synchronisatie */
export interface SyncLogboekItem {
  id: string;
  geStartOp: string;
  voltooidOp: string | null;
  status: string;
  gestartDoor: string | null;
  groepenVerwerkt: number;
  medewerkersToegevoegd: number;
  medewerkersBijgewerkt: number;
  medewerkersVerwijderd: number;
  validatieVerzoekenAangemaakt: number;
}

/** Validatieverzoek uit sync */
export interface SyncValidatieVerzoek {
  id: string;
  type: string;
  beschrijving: string;
  medewerkerNaam: string | null;
  medewerkerEmail: string | null;
  groepNaam: string | null;
  status: string;
  aangemaaktOp: string;
  toegewezenAanRol: string | null;
  vorigeWaarde: string | null;
}

/** Request om validatie af te handelen */
export interface AfhandelValidatieRequest {
  afhandeling: ValidatieAfhandeling;
  notities?: string;
}

// ============================================
// Sync Preview types (voor AD Import pagina)
// ============================================

/** Preview van een gebruiker uit Azure AD/Entra ID */
export interface ADUserPreview {
  id: string;
  displayName: string;
  givenName: string | null;
  surname: string | null;
  email: string;
  jobTitle: string | null;
  department: string | null;
  mobilePhone: string | null;
  accountEnabled: boolean;
  bestaatAl: boolean;
  bestaandeMedewerkerId: string | null;
}

/** Preview van een groep uit Azure AD/Entra ID */
export interface ADGroupPreview {
  id: string;
  displayName: string;
  description: string | null;
  email: string | null;
  niveau: string;
  aantalLeden: number;
  bestaatAl: boolean;
}

/** Statistieken voor de sync preview */
export interface SyncPreviewStatistics {
  totaalGebruikers: number;
  actieveGebruikers: number;
  inactieveGebruikers: number;
  nieuweGebruikers: number;
  bestaandeGebruikers: number;
  totaalGroepen: number;
  nieuweGroepen: number;
  bestaandeGroepen: number;
}

/** Volledige preview van wat er gesynchroniseerd zou worden */
export interface SyncPreview {
  gebruikers: ADUserPreview[];
  groepen: ADGroupPreview[];
  statistieken: SyncPreviewStatistics;
  opgehaaldOp: string;
}

// ============================================
// Event types (voor Uitnodigingen pagina)
// ============================================

export type EventTypeAPI = 'Personeelsfeest' | 'Vergadering' | 'Training' | 'Communicatie' | 'Overig';
export type EventStatusAPI = 'Concept' | 'Verstuurd' | 'Geannuleerd';

/** Filter criteria voor event ontvangers */
export interface EventFilterCriteria {
  alleenActief?: boolean;
  sectoren?: string[];
  employeeTypes?: string[];
  arbeidsRegimes?: string[];
  distributieGroepId?: string;
}

/** Event DTO */
export interface EventDTO {
  id: string;
  titel: string;
  beschrijving: string;
  datum: string;
  type: EventTypeAPI;
  status: EventStatusAPI;
  filterCriteria?: EventFilterCriteria;
  distributieGroepId?: string;
  distributieGroepNaam?: string;
  aantalDeelnemers: number;
  aangemaaktDoor?: string;
  aangemaaktOp: string;
  verstuurdOp?: string;
  verstuurdDoor?: string;
}

/** Deelnemer aan een event */
export interface EventParticipantDTO {
  employeeId: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  emailVerstuurd: boolean;
  emailVerstuurdOp?: string;
}

/** Event detail DTO met deelnemers */
export interface EventDetailDTO extends Omit<EventDTO, 'aantalDeelnemers'> {
  deelnemers: EventParticipantDTO[];
}

/** Request voor aanmaken event */
export interface CreateEventRequest {
  titel: string;
  beschrijving: string;
  datum: string;
  type: EventTypeAPI;
  filterCriteria?: EventFilterCriteria;
  distributieGroepId?: string;
}

/** Request voor bijwerken event */
export interface UpdateEventRequest {
  titel?: string;
  beschrijving?: string;
  datum?: string;
  type?: EventTypeAPI;
  filterCriteria?: EventFilterCriteria;
  distributieGroepId?: string;
}

/** Preview van event ontvangers */
export interface EventRecipientsPreview {
  totaalAantal: number;
  voorbeeldOntvangers: EventParticipantDTO[];
}

// ============================================
// Audit types (voor Audit Log pagina)
// ============================================

export type AuditAction =
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'View'
  | 'Login'
  | 'Logout'
  | 'Export'
  | 'Sync'
  | 'Send'
  | 'AccessDenied';

export type AuditEntityType =
  | 'Employee'
  | 'DistributionGroup'
  | 'EmployeeGroupMembership'
  | 'UserRole'
  | 'Event'
  | 'EventParticipant'
  | 'ValidatieVerzoek'
  | 'SyncLogboek'
  | 'System';

/** Audit log entry */
export interface AuditLogDTO {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  entityDescription: string | null;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
  ipAddress: string | null;
  additionalInfo: string | null;
}

/** Gepagineerde response voor audit logs */
export interface AuditLogPagedResponse {
  items: AuditLogDTO[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/** Filter parameters voor audit logs */
export interface AuditLogFilter {
  fromDate?: string;
  toDate?: string;
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  pageNumber?: number;
  pageSize?: number;
}

/** Filter opties voor audit logs */
export interface AuditFilterOptions {
  actions: string[];
  entityTypes: string[];
}

// ============================================
// Unified Groups types (Hybrid Groups System)
// ============================================

/** Bron van een groep in het Hybrid Groups systeem */
export type GroupSource = 'Exchange' | 'Dynamic' | 'Local';

/** Filter criteria voor dynamische groepen */
export interface DynamicGroupFilterCriteria {
  employeeTypes?: string[];
  arbeidsRegimes?: string[];
  alleenActief?: boolean;
  dienstIds?: string[];
  sectorIds?: string[];
}

/** Unified group representatie (alle groeptypes) */
export interface UnifiedGroup {
  id: string;
  displayName: string;
  description: string | null;
  email: string | null;
  memberCount: number;
  source: GroupSource;
  isReadOnly: boolean;
  isSystemGroup: boolean;
  lastEvaluatedAt: string | null;
}

/** Gedetailleerde unified group met leden */
export interface UnifiedGroupDetail extends UnifiedGroup {
  filterCriteria: DynamicGroupFilterCriteria | null;
  members: EmployeeSummary[];
  createdAt: string;
  createdBy: string | null;
}

/** Employee summary voor groepsleden */
export interface EmployeeSummary {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  employeeType: string;
  arbeidsRegime: string;
  isActive: boolean;
  dienstNaam: string | null;
}

/** Request voor aanmaken lokale groep */
export interface CreateLocalGroupRequest {
  displayName: string;
  description?: string;
  email?: string;
  initialMemberIds?: string[];
}

/** Request voor bijwerken lokale groep */
export interface UpdateLocalGroupRequest {
  displayName?: string;
  description?: string;
  email?: string;
}

/** Request voor aanmaken dynamische groep */
export interface CreateDynamicGroupRequest {
  displayName: string;
  filterCriteria: DynamicGroupFilterCriteria;
  description?: string;
  email?: string;
}

/** Request voor bijwerken dynamische groep */
export interface UpdateDynamicGroupRequest {
  displayName?: string;
  description?: string;
  email?: string;
  filterCriteria?: DynamicGroupFilterCriteria;
}

/** Preview van gecombineerde groepen */
export interface GroupsPreview {
  totalUniqueMembers: number;
  groupBreakdown: Record<string, number>;
  sampleMembers: EmployeeSummary[];
}

/** Email export DTO */
export interface EmailExport {
  mailtoLink: string;
  emailCount: number;
  truncatedWarning: string | null;
}
