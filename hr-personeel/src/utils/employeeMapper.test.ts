import { describe, it, expect } from 'vitest';
import {
  mapEmployeeTypeToPersoneelType,
  mapPersoneelTypeToEmployeeType,
  mapArbeidsRegimeFromAPI,
  mapArbeidsRegimeToAPI,
  mapValidatieStatusFromAPI,
  mapValidatieStatusToAPI,
  mapEmployeeToMedewerker,
  mapMedewerkerToCreateDto,
  mapMedewerkerToUpdateDto,
} from './employeeMapper';
import type { Employee } from '../services/api';
import type { Medewerker } from '../types';

describe('employeeMapper', () => {
  describe('mapEmployeeTypeToPersoneelType', () => {
    it('should map Personeel to personeel', () => {
      expect(mapEmployeeTypeToPersoneelType('Personeel')).toBe('personeel');
    });

    it('should map Vrijwilliger to vrijwilliger', () => {
      expect(mapEmployeeTypeToPersoneelType('Vrijwilliger')).toBe('vrijwilliger');
    });

    it('should map Interim to interim', () => {
      expect(mapEmployeeTypeToPersoneelType('Interim')).toBe('interim');
    });

    it('should map Extern to extern', () => {
      expect(mapEmployeeTypeToPersoneelType('Extern')).toBe('extern');
    });

    it('should map Stagiair to extern', () => {
      expect(mapEmployeeTypeToPersoneelType('Stagiair')).toBe('extern');
    });
  });

  describe('mapPersoneelTypeToEmployeeType', () => {
    it('should map personeel to Personeel', () => {
      expect(mapPersoneelTypeToEmployeeType('personeel')).toBe('Personeel');
    });

    it('should map vrijwilliger to Vrijwilliger', () => {
      expect(mapPersoneelTypeToEmployeeType('vrijwilliger')).toBe('Vrijwilliger');
    });

    it('should map interim to Interim', () => {
      expect(mapPersoneelTypeToEmployeeType('interim')).toBe('Interim');
    });

    it('should map extern to Extern', () => {
      expect(mapPersoneelTypeToEmployeeType('extern')).toBe('Extern');
    });
  });

  describe('mapArbeidsRegimeFromAPI', () => {
    it('should map Voltijds to voltijds', () => {
      expect(mapArbeidsRegimeFromAPI('Voltijds')).toBe('voltijds');
    });

    it('should map Deeltijds to deeltijds', () => {
      expect(mapArbeidsRegimeFromAPI('Deeltijds')).toBe('deeltijds');
    });

    it('should map Vrijwilliger to vrijwilliger', () => {
      expect(mapArbeidsRegimeFromAPI('Vrijwilliger')).toBe('vrijwilliger');
    });
  });

  describe('mapArbeidsRegimeToAPI', () => {
    it('should map voltijds to Voltijds', () => {
      expect(mapArbeidsRegimeToAPI('voltijds')).toBe('Voltijds');
    });

    it('should map deeltijds to Deeltijds', () => {
      expect(mapArbeidsRegimeToAPI('deeltijds')).toBe('Deeltijds');
    });

    it('should map vrijwilliger to Vrijwilliger', () => {
      expect(mapArbeidsRegimeToAPI('vrijwilliger')).toBe('Vrijwilliger');
    });
  });

  describe('mapValidatieStatusFromAPI', () => {
    it('should map Nieuw to nieuw', () => {
      expect(mapValidatieStatusFromAPI('Nieuw')).toBe('nieuw');
    });

    it('should map InReview to in_review', () => {
      expect(mapValidatieStatusFromAPI('InReview')).toBe('in_review');
    });

    it('should map Goedgekeurd to goedgekeurd', () => {
      expect(mapValidatieStatusFromAPI('Goedgekeurd')).toBe('goedgekeurd');
    });

    it('should map Afgekeurd to afgekeurd', () => {
      expect(mapValidatieStatusFromAPI('Afgekeurd')).toBe('afgekeurd');
    });

    it('should default to nieuw for null', () => {
      expect(mapValidatieStatusFromAPI(null)).toBe('nieuw');
    });

    it('should default to nieuw for undefined', () => {
      expect(mapValidatieStatusFromAPI(undefined)).toBe('nieuw');
    });
  });

  describe('mapValidatieStatusToAPI', () => {
    it('should map nieuw to Nieuw', () => {
      expect(mapValidatieStatusToAPI('nieuw')).toBe('Nieuw');
    });

    it('should map in_review to InReview', () => {
      expect(mapValidatieStatusToAPI('in_review')).toBe('InReview');
    });

    it('should map goedgekeurd to Goedgekeurd', () => {
      expect(mapValidatieStatusToAPI('goedgekeurd')).toBe('Goedgekeurd');
    });

    it('should map afgekeurd to Afgekeurd', () => {
      expect(mapValidatieStatusToAPI('afgekeurd')).toBe('Afgekeurd');
    });

    it('should map aangepast to InReview', () => {
      expect(mapValidatieStatusToAPI('aangepast')).toBe('InReview');
    });
  });

  describe('mapEmployeeToMedewerker', () => {
    it('should map a complete employee correctly', () => {
      const employee: Employee = {
        id: 'emp-123',
        displayName: 'Jan Janssen',
        givenName: 'Jan',
        surname: 'Janssen',
        email: 'jan.janssen@diepenbeek.be',
        jobTitle: 'Developer',
        department: 'ICT',
        officeLocation: 'Stadhuis',
        mobilePhone: '+32 123 456 789',
        groups: ['MG-ICT'],
        isActive: true,
        bron: 'AzureAD',
        isHandmatigToegevoegd: false,
        employeeType: 'Personeel',
        arbeidsRegime: 'Voltijds',
        validatieStatus: 'Goedgekeurd',
        gevalideerdDoor: 'admin@diepenbeek.be',
        validatieDatum: '2024-01-15T10:00:00Z',
        photoUrl: null,
        dienstId: 'dienst-1',
        dienstNaam: 'MG-ICT',
        sectorNaam: 'MG-SECTOR-Organisatie',
        startDatum: '2023-01-01T00:00:00Z',
        eindDatum: null,
        telefoonnummer: '+32 123 456 789',
        vrijwilligerDetails: null,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        lastSyncedAt: '2024-01-15T10:00:00Z',
      };

      const medewerker = mapEmployeeToMedewerker(employee);

      expect(medewerker).toEqual({
        id: 'emp-123',
        adId: 'emp-123',
        voornaam: 'Jan',
        achternaam: 'Janssen',
        volledigeNaam: 'Jan Janssen',
        email: 'jan.janssen@diepenbeek.be',
        telefoon: '+32 123 456 789',
        functie: 'Developer',
        afdeling: 'ICT',
        dienst: 'ICT',
        sector: 'Organisatie',
        arbeidsRegime: 'voltijds',
        type: 'personeel',
        actief: true,
        opmerkingen: '',
        validatieStatus: 'goedgekeurd',
        bronAD: true,
        handmatigToegevoegd: false,
        aanmaakDatum: '2023-01-01',
        laatstGewijzigd: '2024-01-15',
      });
    });

    it('should strip MG- prefix from dienst name', () => {
      const employee: Employee = {
        id: 'emp-123',
        displayName: 'Jan Janssen',
        givenName: 'Jan',
        surname: 'Janssen',
        email: 'jan.janssen@diepenbeek.be',
        jobTitle: 'Developer',
        department: 'ICT',
        groups: ['MG-Burgerzaken'],
        isActive: true,
        bron: 'AzureAD',
        isHandmatigToegevoegd: false,
        employeeType: 'Personeel',
        arbeidsRegime: 'Voltijds',
        validatieStatus: 'Nieuw',
        dienstNaam: 'MG-Burgerzaken',
        sectorNaam: null,
        createdAt: '2023-01-01T00:00:00Z',
      };

      const medewerker = mapEmployeeToMedewerker(employee);
      expect(medewerker.dienst).toBe('Burgerzaken');
    });

    it('should strip MG-SECTOR- prefix from sector name', () => {
      const employee: Employee = {
        id: 'emp-123',
        displayName: 'Jan Janssen',
        givenName: 'Jan',
        surname: 'Janssen',
        email: 'jan.janssen@diepenbeek.be',
        jobTitle: 'Manager',
        department: 'Vrije Tijd',
        groups: [],
        isActive: true,
        bron: 'AzureAD',
        isHandmatigToegevoegd: false,
        employeeType: 'Personeel',
        arbeidsRegime: 'Voltijds',
        validatieStatus: 'Nieuw',
        sectorNaam: 'MG-SECTOR-Vrije Tijd',
        createdAt: '2023-01-01T00:00:00Z',
      };

      const medewerker = mapEmployeeToMedewerker(employee);
      expect(medewerker.sector).toBe('Vrije Tijd');
    });

    it('should handle manual employees without Azure AD ID', () => {
      const employee: Employee = {
        id: 'emp-manual-123',
        displayName: 'Piet Pieters',
        givenName: 'Piet',
        surname: 'Pieters',
        email: 'piet.pieters@external.com',
        jobTitle: 'Consultant',
        department: 'Extern',
        groups: [],
        isActive: true,
        bron: 'Handmatig',
        isHandmatigToegevoegd: true,
        employeeType: 'Extern',
        arbeidsRegime: 'Deeltijds',
        validatieStatus: 'Goedgekeurd',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const medewerker = mapEmployeeToMedewerker(employee);
      expect(medewerker.adId).toBeUndefined();
      expect(medewerker.bronAD).toBe(false);
      expect(medewerker.handmatigToegevoegd).toBe(true);
    });
  });

  describe('mapMedewerkerToCreateDto', () => {
    it('should map medewerker to create DTO', () => {
      const medewerker: Partial<Medewerker> = {
        voornaam: 'Jan',
        achternaam: 'Janssen',
        email: 'jan.janssen@diepenbeek.be',
        functie: 'Developer',
        afdeling: 'ICT',
        dienst: 'ICT',
        telefoon: '+32 123 456 789',
        type: 'personeel',
        arbeidsRegime: 'voltijds',
        actief: true,
      };

      const dto = mapMedewerkerToCreateDto(medewerker);

      expect(dto).toEqual({
        givenName: 'Jan',
        surname: 'Janssen',
        email: 'jan.janssen@diepenbeek.be',
        jobTitle: 'Developer',
        department: 'ICT',
        mobilePhone: '+32 123 456 789',
        employeeType: 'Personeel',
        arbeidsRegime: 'Voltijds',
        telefoonnummer: '+32 123 456 789',
        isActive: true,
      });
    });

    it('should default to Personeel and Voltijds if not specified', () => {
      const medewerker: Partial<Medewerker> = {
        voornaam: 'Jan',
        achternaam: 'Janssen',
        email: 'jan@test.com',
      };

      const dto = mapMedewerkerToCreateDto(medewerker);
      expect(dto.employeeType).toBe('Personeel');
      expect(dto.arbeidsRegime).toBe('Voltijds');
    });
  });

  describe('mapMedewerkerToUpdateDto', () => {
    it('should only include fields that are defined', () => {
      const medewerker: Partial<Medewerker> = {
        voornaam: 'Jan',
        email: 'jan.janssen@diepenbeek.be',
      };

      const dto = mapMedewerkerToUpdateDto(medewerker);

      expect(dto).toEqual({
        givenName: 'Jan',
        email: 'jan.janssen@diepenbeek.be',
      });
      expect(dto).not.toHaveProperty('surname');
      expect(dto).not.toHaveProperty('jobTitle');
    });

    it('should map all employee fields correctly', () => {
      const medewerker: Partial<Medewerker> = {
        voornaam: 'Jan',
        achternaam: 'Janssen',
        email: 'jan@test.com',
        functie: 'Developer',
        afdeling: 'ICT',
        telefoon: '+32 123 456 789',
        type: 'personeel',
        arbeidsRegime: 'voltijds',
        actief: false,
      };

      const dto = mapMedewerkerToUpdateDto(medewerker);

      expect(dto).toEqual({
        givenName: 'Jan',
        surname: 'Janssen',
        email: 'jan@test.com',
        jobTitle: 'Developer',
        department: 'ICT',
        mobilePhone: '+32 123 456 789',
        telefoonnummer: '+32 123 456 789',
        employeeType: 'Personeel',
        arbeidsRegime: 'Voltijds',
        isActive: false,
      });
    });
  });
});
