import type { Employee, EmployeeType, ArbeidsRegimeAPI, ValidatieStatusAPI } from '../services/api';
import type { Medewerker, ArbeidsRegime, PersoneelType, ValidatieStatus } from '../types';

/**
 * Utility to map between backend API Employee and frontend Medewerker types
 */

// Strip MG- prefixes from group names and normalize dashes to spaces
function stripMGPrefix(name: string | null | undefined): string {
  if (!name) return '';
  let result = name;
  if (result.startsWith('MG-SECTOR-')) {
    result = result.substring('MG-SECTOR-'.length);
  } else if (result.startsWith('MG-')) {
    result = result.substring('MG-'.length);
  }
  // Replace dashes with spaces for consistency with dropdown formatting
  return result.replace(/-/g, ' ');
}

// Map backend EmployeeType to frontend PersoneelType
export function mapEmployeeTypeToPersoneelType(type: EmployeeType): PersoneelType {
  const mapping: Record<EmployeeType, PersoneelType> = {
    'Personeel': 'personeel',
    'Vrijwilliger': 'vrijwilliger',
    'Interim': 'interim',
    'Extern': 'extern',
    'Stagiair': 'extern', // Map Stagiair to extern for now
  };
  return mapping[type];
}

// Map frontend PersoneelType to backend EmployeeType
export function mapPersoneelTypeToEmployeeType(type: PersoneelType): EmployeeType {
  const mapping: Record<PersoneelType, EmployeeType> = {
    'personeel': 'Personeel',
    'vrijwilliger': 'Vrijwilliger',
    'interim': 'Interim',
    'extern': 'Extern',
  };
  return mapping[type];
}

// Map backend ArbeidsRegime to frontend
export function mapArbeidsRegimeFromAPI(regime: ArbeidsRegimeAPI): ArbeidsRegime {
  const mapping: Record<ArbeidsRegimeAPI, ArbeidsRegime> = {
    'Voltijds': 'voltijds',
    'Deeltijds': 'deeltijds',
    'Vrijwilliger': 'vrijwilliger',
  };
  return mapping[regime];
}

// Map frontend ArbeidsRegime to backend
export function mapArbeidsRegimeToAPI(regime: ArbeidsRegime): ArbeidsRegimeAPI {
  const mapping: Record<ArbeidsRegime, ArbeidsRegimeAPI> = {
    'voltijds': 'Voltijds',
    'deeltijds': 'Deeltijds',
    'vrijwilliger': 'Vrijwilliger',
  };
  return mapping[regime];
}

// Map backend ValidatieStatus to frontend
export function mapValidatieStatusFromAPI(status: ValidatieStatusAPI | undefined | null): ValidatieStatus {
  if (!status) return 'nieuw';
  const mapping: Record<ValidatieStatusAPI, ValidatieStatus> = {
    'Nieuw': 'nieuw',
    'InReview': 'in_review',
    'Goedgekeurd': 'goedgekeurd',
    'Afgekeurd': 'afgekeurd',
  };
  return mapping[status] || 'nieuw';
}

// Map frontend ValidatieStatus to backend
export function mapValidatieStatusToAPI(status: ValidatieStatus): ValidatieStatusAPI {
  const mapping: Record<ValidatieStatus, ValidatieStatusAPI> = {
    'nieuw': 'Nieuw',
    'in_review': 'InReview',
    'goedgekeurd': 'Goedgekeurd',
    'afgekeurd': 'Afgekeurd',
    'aangepast': 'InReview', // Map 'aangepast' to 'InReview' as closest equivalent
  };
  return mapping[status];
}

// Map backend Employee to frontend Medewerker
export function mapEmployeeToMedewerker(employee: Employee): Medewerker {
  // Determine dienst: use dienstNaam, or first group from groups array
  let dienst = stripMGPrefix(employee.dienstNaam);
  if (!dienst && employee.groups && employee.groups.length > 0) {
    // Use first group as dienst (strip MG- prefix)
    dienst = stripMGPrefix(employee.groups[0]);
  }

  // Determine sector: use sectorNaam only (don't guess from department)
  const sector = stripMGPrefix(employee.sectorNaam) || '';

  return {
    id: employee.id,
    adId: employee.bron === 'AzureAD' ? employee.id : undefined,
    voornaam: employee.givenName,
    achternaam: employee.surname,
    volledigeNaam: employee.displayName,
    email: employee.email,
    telefoon: employee.mobilePhone || employee.telefoonnummer || undefined,
    functie: employee.jobTitle || undefined,
    afdeling: employee.department || undefined,
    dienst: dienst,
    sector: sector,
    arbeidsRegime: mapArbeidsRegimeFromAPI(employee.arbeidsRegime),
    type: mapEmployeeTypeToPersoneelType(employee.employeeType),
    actief: employee.isActive,
    opmerkingen: employee.vrijwilligerDetails?.specialisaties || '',
    validatieStatus: mapValidatieStatusFromAPI(employee.validatieStatus),
    bronAD: employee.bron === 'AzureAD',
    handmatigToegevoegd: employee.isHandmatigToegevoegd,
    aanmaakDatum: employee.createdAt.split('T')[0],
    laatstGewijzigd: employee.updatedAt?.split('T')[0] || employee.createdAt.split('T')[0],
  };
}

// Map frontend Medewerker to backend CreateEmployeeDto
export function mapMedewerkerToCreateDto(medewerker: Partial<Medewerker>) {
  return {
    givenName: medewerker.voornaam || '',
    surname: medewerker.achternaam || '',
    email: medewerker.email || '',
    jobTitle: medewerker.functie,
    department: medewerker.afdeling || medewerker.dienst,
    mobilePhone: medewerker.telefoon,
    employeeType: medewerker.type ? mapPersoneelTypeToEmployeeType(medewerker.type) : 'Personeel',
    arbeidsRegime: medewerker.arbeidsRegime ? mapArbeidsRegimeToAPI(medewerker.arbeidsRegime) : 'Voltijds',
    telefoonnummer: medewerker.telefoon,
    isActive: medewerker.actief ?? true,
  };
}

// Map frontend Medewerker to backend UpdateEmployeeDto
export function mapMedewerkerToUpdateDto(medewerker: Partial<Medewerker>) {
  const dto: any = {};

  if (medewerker.voornaam !== undefined) dto.givenName = medewerker.voornaam;
  if (medewerker.achternaam !== undefined) dto.surname = medewerker.achternaam;
  if (medewerker.email !== undefined) dto.email = medewerker.email;
  if (medewerker.functie !== undefined) dto.jobTitle = medewerker.functie;
  if (medewerker.afdeling !== undefined) dto.department = medewerker.afdeling;
  if (medewerker.dienst !== undefined && !medewerker.afdeling) dto.department = medewerker.dienst;
  if (medewerker.telefoon !== undefined) {
    dto.mobilePhone = medewerker.telefoon;
    dto.telefoonnummer = medewerker.telefoon;
  }
  if (medewerker.type !== undefined) {
    dto.employeeType = mapPersoneelTypeToEmployeeType(medewerker.type);
  }
  if (medewerker.arbeidsRegime !== undefined) {
    dto.arbeidsRegime = mapArbeidsRegimeToAPI(medewerker.arbeidsRegime);
  }
  if (medewerker.actief !== undefined) dto.isActive = medewerker.actief;

  return dto;
}
