// ============================================
// Onboarding/Offboarding Workflow Types
// ============================================

/** Type of onboarding process */
export type OnboardingProcessType = 'Onboarding' | 'Offboarding';

/** Status of an onboarding process */
export type OnboardingProcessStatus =
  | 'Nieuw'
  | 'InProgress'
  | 'Voltooid'
  | 'Geannuleerd'
  | 'OnHold';

/** Type of onboarding task */
export type OnboardingTaskType =
  | 'AccountAanmaken'
  | 'M365Licentie'
  | 'LaptopToewijzen'
  | 'ToegangsRechten'
  | 'Training'
  | 'Werkplek'
  | 'Overdracht'
  | 'MateriaalInleveren'
  | 'AccountDeactiveren'
  | 'ExitInterview'
  | 'Algemeen'
  // New task types for complete workflow
  | 'EmailAccountAanmaken'
  | 'WachtwoordGenereren'
  | 'MfaSetup'
  | 'IntunePrimaryUser'
  | 'CompanyPortalApps'
  | 'BadgeRegistratie'
  | 'SyntegroRegistratie'
  | 'DataValidatie'
  | 'BadgeIntrekken'
  | 'SyntegroVerwijderen';

/** Department responsible for onboarding tasks */
export type OnboardingAfdeling =
  | 'HR'
  | 'ICT'
  | 'Preventie'
  | 'Management'
  | 'Medewerker';

/** Status of an onboarding task */
export type OnboardingTaskStatus =
  | 'NietGestart'
  | 'Bezig'
  | 'Voltooid'
  | 'Geblokkeerd'
  | 'Overgeslagen'
  | 'Mislukt';

/** Priority level */
export type OnboardingPriority = 0 | 1 | 2; // Low, Normal, High

// ============================================
// Process DTOs
// ============================================

/** Full onboarding process DTO */
export interface OnboardingProcessDto {
  id: string;
  type: OnboardingProcessType;
  status: OnboardingProcessStatus;
  employeeId: string;
  employeeNaam: string;
  employeeEmail: string;
  titel: string;
  beschrijving: string | null;
  geplandeStartdatum: string;
  gewensteEinddatum: string;
  datumVoltooid: string | null;
  datumGeannuleerd: string | null;
  verantwoordelijkeId: string | null;
  verantwoordelijkeEmail: string | null;
  verantwoordelijkeNaam: string | null;
  voortgangPercentage: number;
  aantalVoltooideTaken: number;
  totaalAantalTaken: number;
  templateId: string | null;
  templateNaam: string | null;
  prioriteit: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  tasks: OnboardingTaskDto[];
}

/** Summary DTO for lists */
export interface OnboardingProcessSummaryDto {
  id: string;
  type: OnboardingProcessType;
  status: OnboardingProcessStatus;
  employeeId: string;
  employeeNaam: string;
  employeeEmail: string;
  titel: string;
  geplandeStartdatum: string;
  gewensteEinddatum: string;
  voortgangPercentage: number;
  aantalVoltooideTaken: number;
  totaalAantalTaken: number;
  prioriteit: number;
  verantwoordelijkeNaam: string | null;
}

/** DTO for creating a new process */
export interface CreateOnboardingProcessDto {
  type: OnboardingProcessType;
  employeeId: string;
  titel: string;
  beschrijving?: string;
  geplandeStartdatum: string;
  gewensteEinddatum: string;
  verantwoordelijkeId?: string;
  verantwoordelijkeEmail?: string;
  verantwoordelijkeNaam?: string;
  prioriteit?: number;
}

/** DTO for updating a process */
export interface UpdateOnboardingProcessDto {
  titel?: string;
  beschrijving?: string;
  geplandeStartdatum?: string;
  gewensteEinddatum?: string;
  verantwoordelijkeId?: string;
  verantwoordelijkeEmail?: string;
  verantwoordelijkeNaam?: string;
  prioriteit?: number;
}

/** Filter for querying processes */
export interface OnboardingProcessFilter {
  type?: OnboardingProcessType;
  status?: OnboardingProcessStatus;
  employeeId?: string;
  verantwoordelijkeId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

/** DTO for changing process status */
export interface ChangeProcessStatusDto {
  nieuweStatus: OnboardingProcessStatus;
  opmerking?: string;
}

/** DTO for creating process from template */
export interface CreateProcessFromTemplateDto {
  templateId: string;
  employeeId: string;
  geplandeStartdatum: string;
  verantwoordelijkeId?: string;
  verantwoordelijkeEmail?: string;
  verantwoordelijkeNaam?: string;
}

// ============================================
// Task DTOs
// ============================================

/** Full task DTO */
export interface OnboardingTaskDto {
  id: string;
  onboardingProcessId: string;
  taskType: OnboardingTaskType;
  titel: string;
  beschrijving: string | null;
  status: OnboardingTaskStatus;
  volgorde: number;
  isVerplicht: boolean;
  verwachteDuurDagen: number;
  deadline: string | null;
  toegewezenAanId: string | null;
  toegewezenAanEmail: string | null;
  toegewezenAanNaam: string | null;
  toegewezenAanAfdeling: OnboardingAfdeling | null;
  gestartOp: string | null;
  voltooidOp: string | null;
  voltooidDoor: string | null;
  voltooiingNotities: string | null;
  afhankelijkVanTaakId: string | null;
  afhankelijkVanTaakTitel: string | null;
  metadata: string | null;
  kanStarten: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/** Summary task DTO for lists */
export interface OnboardingTaskSummaryDto {
  id: string;
  taskType: OnboardingTaskType;
  titel: string;
  status: OnboardingTaskStatus;
  volgorde: number;
  isVerplicht: boolean;
  deadline: string | null;
  toegewezenAanNaam: string | null;
  toegewezenAanAfdeling: OnboardingAfdeling | null;
  kanStarten: boolean;
}

/** DTO for creating a task */
export interface CreateOnboardingTaskDto {
  onboardingProcessId: string;
  taskType: OnboardingTaskType;
  titel: string;
  beschrijving?: string;
  volgorde?: number;
  isVerplicht?: boolean;
  verwachteDuurDagen?: number;
  deadline?: string;
  toegewezenAanId?: string;
  toegewezenAanEmail?: string;
  toegewezenAanNaam?: string;
  toegewezenAanAfdeling?: OnboardingAfdeling;
  afhankelijkVanTaakId?: string;
  metadata?: string;
}

/** DTO for updating a task */
export interface UpdateOnboardingTaskDto {
  titel?: string;
  beschrijving?: string;
  volgorde?: number;
  isVerplicht?: boolean;
  verwachteDuurDagen?: number;
  deadline?: string;
  toegewezenAanId?: string;
  toegewezenAanEmail?: string;
  toegewezenAanNaam?: string;
  toegewezenAanAfdeling?: OnboardingAfdeling;
  afhankelijkVanTaakId?: string;
  metadata?: string;
}

/** DTO for changing task status */
export interface ChangeTaskStatusDto {
  nieuweStatus: OnboardingTaskStatus;
  voltooiingNotities?: string;
}

/** DTO for assigning a task */
export interface AssignTaskDto {
  email: string;
}

// ============================================
// Template DTOs
// ============================================

/** Template DTO */
export interface OnboardingTemplateDto {
  id: string;
  naam: string;
  processType: OnboardingProcessType;
  beschrijving: string | null;
  voorEmployeeType: string | null;
  voorDepartment: string | null;
  voorDienstId: string | null;
  voorDienstNaam: string | null;
  voorSectorId: string | null;
  voorSectorNaam: string | null;
  taskenDefinitie: TemplateTaskDefinitionDto[];
  standaardDuurDagen: number;
  isActive: boolean;
  isDefault: boolean;
  versie: number;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** Task definition within a template */
export interface TemplateTaskDefinitionDto {
  taskType: OnboardingTaskType;
  titel: string;
  beschrijving?: string;
  volgorde: number;
  isVerplicht: boolean;
  verwachteDuurDagen: number;
  afhankelijkVanVolgorde?: number;
  toegewezenAanAfdeling?: OnboardingAfdeling;
}

/** DTO for creating a template */
export interface CreateOnboardingTemplateDto {
  naam: string;
  processType: OnboardingProcessType;
  beschrijving?: string;
  voorEmployeeType?: string;
  voorDepartment?: string;
  voorDienstId?: string;
  voorSectorId?: string;
  taskenDefinitie: TemplateTaskDefinitionDto[];
  standaardDuurDagen?: number;
  isDefault?: boolean;
}

/** DTO for updating a template */
export interface UpdateOnboardingTemplateDto {
  naam?: string;
  beschrijving?: string;
  voorEmployeeType?: string;
  voorDepartment?: string;
  voorDienstId?: string;
  voorSectorId?: string;
  taskenDefinitie?: TemplateTaskDefinitionDto[];
  standaardDuurDagen?: number;
  isActive?: boolean;
}

// ============================================
// Statistics DTOs
// ============================================

/** Count per process status */
export interface ProcessStatusCountDto {
  status: OnboardingProcessStatus;
  aantal: number;
}

/** Count per task type */
export interface TaskTypeCountDto {
  taskType: OnboardingTaskType;
  aantal: number;
}

/** Statistics for the onboarding dashboard */
export interface OnboardingStatisticsDto {
  totaalProcessen: number;
  actieveProcessen: number;
  voltooideProcessen: number;
  geannuleerdeProcessen: number;
  onboardingProcessen: number;
  offboardingProcessen: number;
  totaalTaken: number;
  voltooiTaken: number;
  openTaken: number;
  geblokkeerdeTaken: number;
  gemiddeldeVoltooiingsTijd: number;
  statusVerdeling: ProcessStatusCountDto[];
  taakTypeVerdeling: TaskTypeCountDto[];
}

// ============================================
// Display labels (Dutch)
// ============================================

export const processTypeLabels: Record<OnboardingProcessType, string> = {
  Onboarding: 'Onboarding',
  Offboarding: 'Offboarding',
};

export const processStatusLabels: Record<OnboardingProcessStatus, string> = {
  Nieuw: 'Nieuw',
  InProgress: 'Bezig',
  Voltooid: 'Voltooid',
  Geannuleerd: 'Geannuleerd',
  OnHold: 'On Hold',
};

export const taskTypeLabels: Record<OnboardingTaskType, string> = {
  AccountAanmaken: 'Account aanmaken',
  M365Licentie: 'Microsoft 365 licentie',
  LaptopToewijzen: 'Laptop toewijzen',
  ToegangsRechten: 'Toegangsrechten',
  Training: 'Training',
  Werkplek: 'Werkplek inrichten',
  Overdracht: 'Overdracht taken',
  MateriaalInleveren: 'Materiaal inleveren',
  AccountDeactiveren: 'Account deactiveren',
  ExitInterview: 'Exit interview',
  Algemeen: 'Algemeen',
  // New task types
  EmailAccountAanmaken: 'Email account aanmaken',
  WachtwoordGenereren: 'Wachtwoord genereren',
  MfaSetup: 'MFA configureren',
  IntunePrimaryUser: 'Intune registratie',
  CompanyPortalApps: 'Company Portal apps',
  BadgeRegistratie: 'Badge registratie',
  SyntegroRegistratie: 'Syntegro registratie',
  DataValidatie: 'Gegevens validatie',
  BadgeIntrekken: 'Badge intrekken',
  SyntegroVerwijderen: 'Syntegro verwijderen',
};

export const taskStatusLabels: Record<OnboardingTaskStatus, string> = {
  NietGestart: 'Niet gestart',
  Bezig: 'Bezig',
  Voltooid: 'Voltooid',
  Geblokkeerd: 'Geblokkeerd',
  Overgeslagen: 'Overgeslagen',
  Mislukt: 'Mislukt',
};

export const priorityLabels: Record<number, string> = {
  0: 'Laag',
  1: 'Normaal',
  2: 'Hoog',
};

export const afdelingLabels: Record<OnboardingAfdeling, string> = {
  HR: 'HR',
  ICT: 'ICT',
  Preventie: 'Preventie',
  Management: 'Management',
  Medewerker: 'Medewerker',
};

/** Get default department for a task type */
export const getDefaultAfdelingForTaskType = (taskType: OnboardingTaskType): OnboardingAfdeling => {
  switch (taskType) {
    // ICT tasks
    case 'AccountAanmaken':
    case 'EmailAccountAanmaken':
    case 'WachtwoordGenereren':
    case 'M365Licentie':
    case 'LaptopToewijzen':
    case 'ToegangsRechten':
    case 'IntunePrimaryUser':
    case 'AccountDeactiveren':
      return 'ICT';
    // HR tasks
    case 'SyntegroRegistratie':
    case 'SyntegroVerwijderen':
      return 'HR';
    // Preventie tasks
    case 'BadgeRegistratie':
    case 'BadgeIntrekken':
      return 'Preventie';
    // Management tasks
    case 'DataValidatie':
      return 'Management';
    // Employee tasks
    case 'MfaSetup':
    case 'CompanyPortalApps':
    case 'Training':
      return 'Medewerker';
    // Default to HR for general tasks
    default:
      return 'HR';
  }
};
