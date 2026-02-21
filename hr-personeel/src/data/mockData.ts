import type { Medewerker, ValidatieVerzoek, Uitnodiging, GebruikerProfiel, DistributieGroep } from '../types';
import { v4 as uuidv4 } from 'uuid';

const sectoren = [
  'Algemene Zaken',
  'Burgerzaken',
  'Financiën',
  'Grondgebiedzaken',
  'Vrije Tijd',
  'Welzijn',
  'ICT',
  'Technische Dienst',
];

const diensten: Record<string, string[]> = {
  'Algemene Zaken': ['Secretariaat', 'Communicatie', 'Juridische Zaken'],
  'Burgerzaken': ['Bevolking', 'Burgerlijke Stand', 'Vreemdelingenzaken'],
  'Financiën': ['Boekhouding', 'Belastingen', 'Aankoop'],
  'Grondgebiedzaken': ['Ruimtelijke Ordening', 'Milieu', 'Openbare Werken'],
  'Vrije Tijd': ['Sport', 'Cultuur', 'Jeugd', 'Bibliotheek'],
  'Welzijn': ['OCMW', 'Sociale Dienst', 'Kinderopvang'],
  'ICT': ['Systeembeheer', 'Applicatiebeheer', 'Helpdesk'],
  'Technische Dienst': ['Gebouwen', 'Wegen', 'Groendienst'],
};

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function createMedewerker(overrides: Partial<Medewerker> = {}): Medewerker {
  const sector = overrides.sector || sectoren[Math.floor(Math.random() * sectoren.length)];
  const sectorDiensten = diensten[sector] || ['Algemeen'];
  const dienst = overrides.dienst || sectorDiensten[Math.floor(Math.random() * sectorDiensten.length)];
  const voornaam = overrides.voornaam || 'Voornaam';
  const achternaam = overrides.achternaam || 'Achternaam';

  return {
    id: uuidv4(),
    voornaam,
    achternaam,
    volledigeNaam: `${voornaam} ${achternaam}`,
    email: `${voornaam.toLowerCase()}.${achternaam.toLowerCase()}@diepenbeek.be`,
    telefoon: overrides.telefoon,
    functie: overrides.functie || '',
    afdeling: overrides.afdeling || sector,
    dienst,
    sector,
    arbeidsRegime: overrides.arbeidsRegime || 'voltijds',
    type: overrides.type || 'personeel',
    actief: overrides.actief ?? true,
    opmerkingen: overrides.opmerkingen || '',
    validatieStatus: overrides.validatieStatus || 'nieuw',
    bronAD: overrides.bronAD ?? true,
    handmatigToegevoegd: overrides.handmatigToegevoegd ?? false,
    aanmaakDatum: randomDate(new Date(2023, 0, 1), new Date(2025, 11, 31)),
    laatstGewijzigd: randomDate(new Date(2025, 0, 1), new Date(2026, 1, 20)),
    ...overrides,
  };
}

export const mockMedewerkers: Medewerker[] = [
  // Algemene Zaken
  createMedewerker({ voornaam: 'Jan', achternaam: 'Peeters', sector: 'Algemene Zaken', dienst: 'Secretariaat', functie: 'Gemeentesecretaris', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 01' }),
  createMedewerker({ voornaam: 'Marie', achternaam: 'Claes', sector: 'Algemene Zaken', dienst: 'Communicatie', functie: 'Communicatiemedewerker', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 02' }),
  createMedewerker({ voornaam: 'Luc', achternaam: 'Vandenberghe', sector: 'Algemene Zaken', dienst: 'Juridische Zaken', functie: 'Juridisch Adviseur', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'in_review' }),
  createMedewerker({ voornaam: 'Sofie', achternaam: 'Hermans', sector: 'Algemene Zaken', dienst: 'Secretariaat', functie: 'Administratief Medewerker', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),

  // Burgerzaken
  createMedewerker({ voornaam: 'Peter', achternaam: 'Janssen', sector: 'Burgerzaken', dienst: 'Bevolking', functie: 'Diensthoofd Burgerzaken', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 10' }),
  createMedewerker({ voornaam: 'An', achternaam: 'Willems', sector: 'Burgerzaken', dienst: 'Bevolking', functie: 'Loketmedewerker', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Tom', achternaam: 'Maes', sector: 'Burgerzaken', dienst: 'Burgerlijke Stand', functie: 'Ambtenaar Burgerlijke Stand', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'in_review' }),
  createMedewerker({ voornaam: 'Lisa', achternaam: 'Wouters', sector: 'Burgerzaken', dienst: 'Vreemdelingenzaken', functie: 'Dossierbeheerder', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'nieuw' }),

  // Financiën
  createMedewerker({ voornaam: 'Kris', achternaam: 'Mertens', sector: 'Financiën', dienst: 'Boekhouding', functie: 'Financieel Directeur', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 20' }),
  createMedewerker({ voornaam: 'Eline', achternaam: 'Desmet', sector: 'Financiën', dienst: 'Boekhouding', functie: 'Boekhouder', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Bart', achternaam: 'Cools', sector: 'Financiën', dienst: 'Belastingen', functie: 'Belastingcontroleur', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'in_review' }),
  createMedewerker({ voornaam: 'Sarah', achternaam: 'Lenaerts', sector: 'Financiën', dienst: 'Aankoop', functie: 'Aankoopverantwoordelijke', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'nieuw' }),

  // Grondgebiedzaken
  createMedewerker({ voornaam: 'Dirk', achternaam: 'Jacobs', sector: 'Grondgebiedzaken', dienst: 'Ruimtelijke Ordening', functie: 'Stedenbouwkundig Ambtenaar', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 30' }),
  createMedewerker({ voornaam: 'Eva', achternaam: 'Pauwels', sector: 'Grondgebiedzaken', dienst: 'Milieu', functie: 'Milieuambtenaar', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Wim', achternaam: 'Stevens', sector: 'Grondgebiedzaken', dienst: 'Openbare Werken', functie: 'Ingenieur', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'afgekeurd', validatieOpmerkingen: 'Persoon is niet meer in dienst sinds 01/2026' }),
  createMedewerker({ voornaam: 'Hilde', achternaam: 'Bogaert', sector: 'Grondgebiedzaken', dienst: 'Milieu', functie: 'Duurzaamheidscoördinator', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'nieuw' }),

  // Vrije Tijd
  createMedewerker({ voornaam: 'Marc', achternaam: 'Vermeersch', sector: 'Vrije Tijd', dienst: 'Sport', functie: 'Sportfunctionaris', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 40' }),
  createMedewerker({ voornaam: 'Karen', achternaam: 'De Smedt', sector: 'Vrije Tijd', dienst: 'Cultuur', functie: 'Cultuurbeleidscoördinator', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Jef', achternaam: 'Hendrickx', sector: 'Vrije Tijd', dienst: 'Jeugd', functie: 'Jeugdconsulent', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'in_review' }),
  createMedewerker({ voornaam: 'Nathalie', achternaam: 'Claessens', sector: 'Vrije Tijd', dienst: 'Bibliotheek', functie: 'Bibliothecaris', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Rik', achternaam: 'Vanderstraeten', sector: 'Vrije Tijd', dienst: 'Sport', functie: 'Sportmonitor', arbeidsRegime: 'vrijwilliger', type: 'vrijwilliger', validatieStatus: 'nieuw', bronAD: false, handmatigToegevoegd: true }),
  createMedewerker({ voornaam: 'Mieke', achternaam: 'Geerts', sector: 'Vrije Tijd', dienst: 'Bibliotheek', functie: 'Vrijwilliger Uitleendienst', arbeidsRegime: 'vrijwilliger', type: 'vrijwilliger', validatieStatus: 'nieuw', bronAD: false, handmatigToegevoegd: true }),

  // Welzijn
  createMedewerker({ voornaam: 'Frank', achternaam: 'Aerts', sector: 'Welzijn', dienst: 'OCMW', functie: 'OCMW-voorzitter', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 50' }),
  createMedewerker({ voornaam: 'Katrien', achternaam: 'Bollen', sector: 'Welzijn', dienst: 'Sociale Dienst', functie: 'Maatschappelijk Werker', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Stijn', achternaam: 'Martens', sector: 'Welzijn', dienst: 'Kinderopvang', functie: 'Coördinator Kinderopvang', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'in_review' }),
  createMedewerker({ voornaam: 'Inge', achternaam: 'Lambrechts', sector: 'Welzijn', dienst: 'Sociale Dienst', functie: 'Dossierbeheerder', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'nieuw' }),
  createMedewerker({ voornaam: 'Griet', achternaam: 'Vandoren', sector: 'Welzijn', dienst: 'OCMW', functie: 'Vrijwilliger Thuiszorg', arbeidsRegime: 'vrijwilliger', type: 'vrijwilliger', validatieStatus: 'goedgekeurd', bronAD: false, handmatigToegevoegd: true }),

  // ICT
  createMedewerker({ voornaam: 'Pieter', achternaam: 'Vanhoef', sector: 'ICT', dienst: 'Systeembeheer', functie: 'ICT-coördinator', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 60' }),
  createMedewerker({ voornaam: 'Nick', achternaam: 'Thijs', sector: 'ICT', dienst: 'Applicatiebeheer', functie: 'Applicatiebeheerder', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Yves', achternaam: 'Bergmans', sector: 'ICT', dienst: 'Helpdesk', functie: 'Helpdesk Medewerker', arbeidsRegime: 'voltijds', type: 'interim', validatieStatus: 'in_review', opmerkingen: 'Interim contract tot 30/06/2026' }),

  // Technische Dienst
  createMedewerker({ voornaam: 'Geert', achternaam: 'Smeets', sector: 'Technische Dienst', dienst: 'Gebouwen', functie: 'Technisch Directeur', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd', telefoon: '011 49 10 70' }),
  createMedewerker({ voornaam: 'Patrick', achternaam: 'Nijs', sector: 'Technische Dienst', dienst: 'Wegen', functie: 'Ploegbaas Wegen', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'goedgekeurd' }),
  createMedewerker({ voornaam: 'Kevin', achternaam: 'Ramakers', sector: 'Technische Dienst', dienst: 'Groendienst', functie: 'Tuinman', arbeidsRegime: 'voltijds', type: 'personeel', validatieStatus: 'nieuw' }),
  createMedewerker({ voornaam: 'Joris', achternaam: 'Beckers', sector: 'Technische Dienst', dienst: 'Gebouwen', functie: 'Onderhoudstechnicus', arbeidsRegime: 'deeltijds', type: 'personeel', validatieStatus: 'nieuw' }),
  createMedewerker({ voornaam: 'Ronny', achternaam: 'Houben', sector: 'Technische Dienst', dienst: 'Groendienst', functie: 'Seizoensarbeider', arbeidsRegime: 'deeltijds', type: 'interim', validatieStatus: 'nieuw', opmerkingen: 'Seizoenscontract maart-oktober 2026' }),

  // Inactieve medewerkers
  createMedewerker({ voornaam: 'Christel', achternaam: 'Eerdekens', sector: 'Financiën', dienst: 'Boekhouding', functie: 'Boekhouder', arbeidsRegime: 'voltijds', type: 'personeel', actief: false, validatieStatus: 'afgekeurd', validatieOpmerkingen: 'Uit dienst getreden op 31/12/2025' }),
  createMedewerker({ voornaam: 'Dominique', achternaam: 'Vrancken', sector: 'Burgerzaken', dienst: 'Bevolking', functie: 'Loketmedewerker', arbeidsRegime: 'voltijds', type: 'personeel', actief: false, validatieStatus: 'afgekeurd', validatieOpmerkingen: 'Pensioen sinds 01/01/2026' }),
];

export const mockValidatieVerzoeken: ValidatieVerzoek[] = mockMedewerkers
  .filter(m => m.validatieStatus === 'nieuw' || m.validatieStatus === 'in_review')
  .map(m => ({
    id: uuidv4(),
    medewerkerId: m.id,
    medewerkerNaam: m.volledigeNaam,
    sector: m.sector,
    dienst: m.dienst,
    toegewezenAan: `Diensthoofd ${m.sector}`,
    status: m.validatieStatus,
    opmerkingen: '',
    aanmaakDatum: m.aanmaakDatum,
  }));

export const mockUitnodigingen: Uitnodiging[] = [
  {
    id: uuidv4(),
    titel: 'Personeelsfeest 2026',
    beschrijving: 'Jaarlijks personeelsfeest van de gemeente Diepenbeek. Locatie: Cultureel Centrum, 20:00.',
    datum: '2026-06-20',
    type: 'personeelsfeest',
    ontvangers: [],
    filters: { alleenActief: true },
    status: 'concept',
  },
  {
    id: uuidv4(),
    titel: 'Nieuwjaarsreceptie 2027',
    beschrijving: 'Nieuwjaarsreceptie voor alle medewerkers en vrijwilligers.',
    datum: '2027-01-10',
    type: 'personeelsfeest',
    ontvangers: [],
    filters: { alleenActief: true },
    status: 'concept',
  },
];

export const mockGebruiker: GebruikerProfiel = {
  id: uuidv4(),
  naam: 'Admin HR',
  email: 'hr@diepenbeek.be',
  rol: 'hr_admin',
};

// Distributiegroepen (MG- mailgroepen uit MS365 / Exchange Admin)
function getMedewerkerIdsByFilter(
  filter: { sector?: string; actief?: boolean; type?: string }
): string[] {
  return mockMedewerkers
    .filter(m => {
      if (filter.sector && m.sector !== filter.sector) return false;
      if (filter.actief !== undefined && m.actief !== filter.actief) return false;
      if (filter.type && m.type !== filter.type) return false;
      return true;
    })
    .map(m => m.id);
}

// Diensthoofden / sectormanager IDs (eerste medewerker per sector)
const sectorHoofden = sectoren.map(
  s => mockMedewerkers.find(m => m.sector === s)?.id
).filter((id): id is string => !!id);

export const mockDistributieGroepen: DistributieGroep[] = [
  {
    id: uuidv4(),
    displayName: 'MG-AllePersoneel',
    emailAddress: 'mg-allepersoneel@diepenbeek.be',
    beschrijving: 'Alle actieve personeelsleden van gemeente Diepenbeek',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ actief: true, type: 'personeel' }),
    eigenaarIds: [sectorHoofden[0]],
    bronExchange: true,
    aanmaakDatum: '2024-01-15',
    laatstGewijzigd: '2026-01-10',
  },
  {
    id: uuidv4(),
    displayName: 'MG-AlleMedewerkers',
    emailAddress: 'mg-allemedewerkers@diepenbeek.be',
    beschrijving: 'Alle medewerkers inclusief vrijwilligers en interim',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ actief: true }),
    eigenaarIds: [sectorHoofden[0]],
    bronExchange: true,
    aanmaakDatum: '2024-01-15',
    laatstGewijzigd: '2026-02-01',
  },
  {
    id: uuidv4(),
    displayName: 'MG-Diensthoofden',
    emailAddress: 'mg-diensthoofden@diepenbeek.be',
    beschrijving: 'Alle diensthoofden en sectormanagers',
    type: 'distributionGroup',
    ledenIds: sectorHoofden,
    eigenaarIds: [sectorHoofden[0]],
    bronExchange: true,
    aanmaakDatum: '2024-02-01',
    laatstGewijzigd: '2025-12-15',
  },
  {
    id: uuidv4(),
    displayName: 'MG-AlgemeneZaken',
    emailAddress: 'mg-algemenezaken@diepenbeek.be',
    beschrijving: 'Sector Algemene Zaken',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'Algemene Zaken', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'Algemene Zaken')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-Burgerzaken',
    emailAddress: 'mg-burgerzaken@diepenbeek.be',
    beschrijving: 'Sector Burgerzaken',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'Burgerzaken', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'Burgerzaken')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-Financien',
    emailAddress: 'mg-financien@diepenbeek.be',
    beschrijving: 'Sector Financiën',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'Financiën', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'Financiën')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-Grondgebiedzaken',
    emailAddress: 'mg-grondgebiedzaken@diepenbeek.be',
    beschrijving: 'Sector Grondgebiedzaken',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'Grondgebiedzaken', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'Grondgebiedzaken')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-VrijeTijd',
    emailAddress: 'mg-vrijetijd@diepenbeek.be',
    beschrijving: 'Sector Vrije Tijd',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'Vrije Tijd', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'Vrije Tijd')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-Welzijn',
    emailAddress: 'mg-welzijn@diepenbeek.be',
    beschrijving: 'Sector Welzijn incl. OCMW',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'Welzijn', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'Welzijn')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-ICT',
    emailAddress: 'mg-ict@diepenbeek.be',
    beschrijving: 'Sector ICT',
    type: 'microsoft365',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'ICT', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'ICT')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-TechnischeDienst',
    emailAddress: 'mg-technischedienst@diepenbeek.be',
    beschrijving: 'Sector Technische Dienst',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ sector: 'Technische Dienst', actief: true }),
    eigenaarIds: [mockMedewerkers.find(m => m.sector === 'Technische Dienst')?.id || ''],
    bronExchange: true,
    aanmaakDatum: '2024-03-01',
    laatstGewijzigd: '2025-11-20',
  },
  {
    id: uuidv4(),
    displayName: 'MG-Vrijwilligers',
    emailAddress: 'mg-vrijwilligers@diepenbeek.be',
    beschrijving: 'Alle vrijwilligers van gemeente Diepenbeek',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ actief: true, type: 'vrijwilliger' }),
    eigenaarIds: [sectorHoofden[0]],
    bronExchange: true,
    aanmaakDatum: '2024-06-01',
    laatstGewijzigd: '2026-01-15',
  },
  {
    id: uuidv4(),
    displayName: 'MG-Personeelsfeest2026',
    emailAddress: 'mg-personeelsfeest2026@diepenbeek.be',
    beschrijving: 'Uitnodigingslijst personeelsfeest 2026',
    type: 'distributionGroup',
    ledenIds: getMedewerkerIdsByFilter({ actief: true }),
    eigenaarIds: [sectorHoofden[0]],
    bronExchange: false,
    aanmaakDatum: '2026-02-10',
    laatstGewijzigd: '2026-02-10',
  },
];

export const alleSectoren = sectoren;
export const alleDiensten = diensten;
