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
