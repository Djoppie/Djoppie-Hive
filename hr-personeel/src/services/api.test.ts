import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { employeesApi, distributionGroupsApi, syncApi, employeeValidatieApi, getCurrentUser } from './api';
import { msalInstance } from '../auth/AuthProvider';
import type { Employee, CurrentUser } from './api';

// Mock MSAL instance
vi.mock('../auth/AuthProvider', () => ({
  msalInstance: {
    getActiveAccount: vi.fn(),
    acquireTokenSilent: vi.fn(),
    acquireTokenPopup: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('API Service', () => {
  const mockAccount = {
    homeAccountId: 'test-home-account-id',
    environment: 'login.windows.net',
    tenantId: '7db28d6f-d542-40c1-b529-5e5ed2aad545',
    username: 'test.user@diepenbeek.be',
    localAccountId: 'test-local-account-id',
    name: 'Test User',
    idTokenClaims: {},
  };

  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    vi.clearAllMocks();
    (msalInstance.getActiveAccount as any).mockReturnValue(mockAccount);
    (msalInstance.acquireTokenSilent as any).mockResolvedValue({
      accessToken: mockAccessToken,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser: CurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['medewerker'],
        permissions: [],
        isAdmin: false,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockUser),
      });

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5014/api/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should throw error if not authenticated', async () => {
      (msalInstance.getActiveAccount as any).mockReturnValue(null);

      await expect(getCurrentUser()).rejects.toThrow('Niet aangemeld. Log opnieuw in.');
    });

    it('should throw error on 401 response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(getCurrentUser()).rejects.toThrow('Sessie verlopen. Log opnieuw in.');
    });

    it('should throw error on 403 response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      await expect(getCurrentUser()).rejects.toThrow('Geen toegang tot deze functie.');
    });
  });

  describe('employeesApi', () => {
    describe('getAll', () => {
      it('should fetch all employees successfully', async () => {
        const mockEmployees: Employee[] = [
          {
            id: 'emp-1',
            displayName: 'Jan Janssen',
            givenName: 'Jan',
            surname: 'Janssen',
            email: 'jan@test.com',
            jobTitle: 'Developer',
            department: 'ICT',
            groups: [],
            isActive: true,
            bron: 'AzureAD',
            isHandmatigToegevoegd: false,
            employeeType: 'Personeel',
            arbeidsRegime: 'Voltijds',
            validatieStatus: 'Goedgekeurd',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ];

        (global.fetch as any).mockResolvedValue({
          ok: true,
          text: async () => JSON.stringify(mockEmployees),
        });

        const result = await employeesApi.getAll();

        expect(result).toEqual(mockEmployees);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5014/api/employees',
          expect.any(Object)
        );
      });

      it('should apply filters to query parameters', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: true,
          text: async () => JSON.stringify([]),
        });

        await employeesApi.getAll({
          employeeType: 'Personeel',
          arbeidsRegime: 'Voltijds',
          isActive: true,
          dienstId: 'dienst-1',
          sectorId: 'sector-1',
          search: 'Jan',
          bron: 'AzureAD',
        });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=Personeel'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('regime=Voltijds'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('isActive=true'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('dienstId=dienst-1'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sectorId=sector-1'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('searchTerm=Jan'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('bron=AzureAD'),
          expect.any(Object)
        );
      });
    });

    describe('getById', () => {
      it('should fetch employee by ID', async () => {
        const mockEmployee: Employee = {
          id: 'emp-123',
          displayName: 'Jan Janssen',
          givenName: 'Jan',
          surname: 'Janssen',
          email: 'jan@test.com',
          jobTitle: 'Developer',
          department: 'ICT',
          groups: [],
          isActive: true,
          bron: 'AzureAD',
          isHandmatigToegevoegd: false,
          employeeType: 'Personeel',
          arbeidsRegime: 'Voltijds',
          validatieStatus: 'Goedgekeurd',
          createdAt: '2024-01-01T00:00:00Z',
        };

        (global.fetch as any).mockResolvedValue({
          ok: true,
          text: async () => JSON.stringify(mockEmployee),
        });

        const result = await employeesApi.getById('emp-123');

        expect(result).toEqual(mockEmployee);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5014/api/employees/emp-123',
          expect.any(Object)
        );
      });
    });

    describe('create', () => {
      it('should create a new employee', async () => {
        const createDto = {
          givenName: 'Jan',
          surname: 'Janssen',
          email: 'jan@test.com',
          jobTitle: 'Developer',
          department: 'ICT',
          employeeType: 'Personeel' as const,
          arbeidsRegime: 'Voltijds' as const,
        };

        const mockEmployee: Employee = {
          id: 'emp-new',
          displayName: 'Jan Janssen',
          ...createDto,
          groups: [],
          isActive: true,
          bron: 'Handmatig',
          isHandmatigToegevoegd: true,
          validatieStatus: 'Nieuw',
          createdAt: '2024-01-01T00:00:00Z',
        };

        (global.fetch as any).mockResolvedValue({
          ok: true,
          text: async () => JSON.stringify(mockEmployee),
        });

        const result = await employeesApi.create(createDto);

        expect(result).toEqual(mockEmployee);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5014/api/employees',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(createDto),
          })
        );
      });
    });

    describe('update', () => {
      it('should update an employee', async () => {
        const updateDto = {
          jobTitle: 'Senior Developer',
          isActive: false,
        };

        const mockEmployee: Employee = {
          id: 'emp-123',
          displayName: 'Jan Janssen',
          givenName: 'Jan',
          surname: 'Janssen',
          email: 'jan@test.com',
          jobTitle: 'Senior Developer',
          department: 'ICT',
          groups: [],
          isActive: false,
          bron: 'AzureAD',
          isHandmatigToegevoegd: false,
          employeeType: 'Personeel',
          arbeidsRegime: 'Voltijds',
          validatieStatus: 'Goedgekeurd',
          createdAt: '2024-01-01T00:00:00Z',
        };

        (global.fetch as any).mockResolvedValue({
          ok: true,
          text: async () => JSON.stringify(mockEmployee),
        });

        const result = await employeesApi.update('emp-123', updateDto);

        expect(result).toEqual(mockEmployee);
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5014/api/employees/emp-123',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateDto),
          })
        );
      });
    });

    describe('delete', () => {
      it('should delete an employee', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: true,
          text: async () => '',
        });

        await employeesApi.delete('emp-123');

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5014/api/employees/emp-123',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('distributionGroupsApi', () => {
    it('should fetch all distribution groups', async () => {
      const mockGroups = [
        {
          id: 'group-1',
          displayName: 'MG-ICT',
          description: 'ICT Department',
          email: 'mg-ict@diepenbeek.be',
          memberCount: 5,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockGroups),
      });

      const result = await distributionGroupsApi.getAll();

      expect(result).toEqual(mockGroups);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5014/api/distributiongroups',
        expect.any(Object)
      );
    });

    it('should fetch organization hierarchy', async () => {
      const mockHierarchy = {
        rootGroupId: 'root-1',
        rootGroupName: 'MG-iedereenpersoneel',
        sectors: [],
        totalSectors: 0,
        totalDiensten: 0,
        totalMedewerkers: 0,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockHierarchy),
      });

      const result = await distributionGroupsApi.getHierarchy();

      expect(result).toEqual(mockHierarchy);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5014/api/distributiongroups/hierarchy',
        expect.any(Object)
      );
    });
  });

  describe('syncApi', () => {
    it('should start sync execution', async () => {
      const mockResult = {
        syncLogboekId: 'sync-123',
        geStartOp: '2024-01-01T10:00:00Z',
        voltooidOp: '2024-01-01T10:05:00Z',
        status: 'Voltooid' as const,
        groepenVerwerkt: 10,
        medewerkersToegevoegd: 5,
        medewerkersBijgewerkt: 3,
        medewerkersVerwijderd: 1,
        lidmaatschappenToegevoegd: 8,
        lidmaatschappenVerwijderd: 2,
        validatieVerzoekenAangemaakt: 1,
        foutmelding: null,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockResult),
      });

      const result = await syncApi.uitvoeren();

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5014/api/sync/uitvoeren',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should get sync status', async () => {
      const mockStatus = {
        isSyncBezig: false,
        laatsteSyncOp: '2024-01-01T10:00:00Z',
        laatsteSyncStatus: 'Voltooid',
        huidigeSyncId: null,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockStatus),
      });

      const result = await syncApi.getStatus();

      expect(result).toEqual(mockStatus);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5014/api/sync/status',
        expect.any(Object)
      );
    });
  });

  describe('employeeValidatieApi', () => {
    it('should update employee validation status', async () => {
      const request = {
        status: 'Goedgekeurd' as const,
        opmerkingen: 'Approved by HR',
      };

      const mockEmployee: Employee = {
        id: 'emp-123',
        displayName: 'Jan Janssen',
        givenName: 'Jan',
        surname: 'Janssen',
        email: 'jan@test.com',
        jobTitle: 'Developer',
        department: 'ICT',
        groups: [],
        isActive: true,
        bron: 'AzureAD',
        isHandmatigToegevoegd: false,
        employeeType: 'Personeel',
        arbeidsRegime: 'Voltijds',
        validatieStatus: 'Goedgekeurd',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockEmployee),
      });

      const result = await employeeValidatieApi.updateStatus('emp-123', request);

      expect(result).toEqual(mockEmployee);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5014/api/employees/emp-123/validatie',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(request),
        })
      );
    });

    it('should fetch validation statistics', async () => {
      const mockStats = {
        nieuw: 5,
        inReview: 3,
        goedgekeurd: 20,
        afgekeurd: 2,
        totaal: 30,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(mockStats),
      });

      const result = await employeeValidatieApi.getStatistieken();

      expect(result).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5014/api/employees/validatie/statistieken',
        expect.any(Object)
      );
    });
  });

  describe('Token acquisition fallback', () => {
    it('should try popup token acquisition if silent fails', async () => {
      (msalInstance.acquireTokenSilent as any).mockRejectedValue(new Error('Silent failed'));
      (msalInstance.acquireTokenPopup as any).mockResolvedValue({
        accessToken: 'popup-token',
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ id: '1', email: 'test@test.com', displayName: 'Test', roles: [], permissions: [], isAdmin: false, sectorId: null, dienstId: null, employeeId: null }),
      });

      await getCurrentUser();

      expect(msalInstance.acquireTokenPopup).toHaveBeenCalled();
    });

    it('should throw error if both token acquisitions fail', async () => {
      (msalInstance.acquireTokenSilent as any).mockRejectedValue(new Error('Silent failed'));
      (msalInstance.acquireTokenPopup as any).mockRejectedValue(new Error('Popup failed'));

      await expect(getCurrentUser()).rejects.toThrow('Niet aangemeld. Log opnieuw in.');
    });
  });
});
