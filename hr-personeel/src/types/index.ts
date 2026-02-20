export type ArbeidsRegime = 'voltijds' | 'deeltijds' | 'vrijwilliger';

export type PersoneelType = 'personeel' | 'vrijwilliger' | 'interim' | 'extern';

export type ValidatieStatus = 'nieuw' | 'in_review' | 'goedgekeurd' | 'afgekeurd' | 'aangepast';

export type Rol = 'hr_admin' | 'diensthoofd' | 'sectormanager' | 'medewerker';

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
  ledenIds: string[];           // medewerker IDs
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
