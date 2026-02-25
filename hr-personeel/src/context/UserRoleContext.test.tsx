import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserRoleProvider, useUserRole, RequirePermission, RequireRole } from './UserRoleContext';
import type { Rol } from '../types';
import * as api from '../services/api';

// Mock MSAL React
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    },
    accounts: [
      {
        homeAccountId: 'test-home-account-id',
        environment: 'login.windows.net',
        tenantId: '7db28d6f-d542-40c1-b529-5e5ed2aad545',
        username: 'test.user@diepenbeek.be',
        localAccountId: 'test-local-account-id',
        name: 'Test User',
      },
    ],
  }),
  useIsAuthenticated: () => true,
}));

// Mock API
vi.mock('../services/api');

describe('UserRoleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UserRoleProvider', () => {
    it('should load user roles from API', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['hr_admin'],
        permissions: [],
        isAdmin: true,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { user, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return <div>User: {user?.name}</div>;
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('User: Test User')).toBeInTheDocument();
      });
    });

    it('should default to medewerker role if API fails', async () => {
      vi.spyOn(api, 'getCurrentUser').mockRejectedValue(new Error('API Error'));

      function TestComponent() {
        const { user, roles, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return <div>Roles: {roles.join(',')}</div>;
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Roles: medewerker')).toBeInTheDocument();
      });
    });

    it('should default to medewerker role if no roles in API response', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: [],
        permissions: [],
        isAdmin: false,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { roles, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return <div>Roles: {roles.join(',')}</div>;
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Roles: medewerker')).toBeInTheDocument();
      });
    });
  });

  describe('useUserRole hook', () => {
    it('should provide hasRole function', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['hr_admin', 'sectormanager'],
        permissions: [],
        isAdmin: true,
        sectorId: 'sector-1',
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { hasRole, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return (
          <div>
            <div>Has HR Admin: {hasRole('hr_admin' as Rol).toString()}</div>
            <div>Has Medewerker: {hasRole('medewerker' as Rol).toString()}</div>
          </div>
        );
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Has HR Admin: true')).toBeInTheDocument();
        expect(screen.getByText('Has Medewerker: false')).toBeInTheDocument();
      });
    });

    it('should provide hasAnyRole function', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['sectormanager'],
        permissions: [],
        isAdmin: false,
        sectorId: 'sector-1',
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { hasAnyRole, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return (
          <div>
            <div>Has Admin Roles: {hasAnyRole('hr_admin' as Rol, 'ict_super_admin' as Rol).toString()}</div>
            <div>Has Manager Roles: {hasAnyRole('sectormanager' as Rol, 'diensthoofd' as Rol).toString()}</div>
          </div>
        );
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Has Admin Roles: false')).toBeInTheDocument();
        expect(screen.getByText('Has Manager Roles: true')).toBeInTheDocument();
      });
    });

    it('should provide hasPermission function', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['hr_admin'],
        permissions: [],
        isAdmin: true,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { hasPermission, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return (
          <div>
            <div>Can Edit: {hasPermission('canEditEmployees').toString()}</div>
            <div>Can Delete: {hasPermission('canDeleteEmployees').toString()}</div>
            <div>Can Manage Settings: {hasPermission('canManageSettings').toString()}</div>
          </div>
        );
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Can Edit: true')).toBeInTheDocument();
        expect(screen.getByText('Can Delete: true')).toBeInTheDocument();
        expect(screen.getByText('Can Manage Settings: false')).toBeInTheDocument();
      });
    });

    it('should provide getHighestRole function', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['sectormanager', 'medewerker'],
        permissions: [],
        isAdmin: false,
        sectorId: 'sector-1',
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { getHighestRole, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return <div>Highest Role: {getHighestRole()}</div>;
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Highest Role: sectormanager')).toBeInTheDocument();
      });
    });

    it('should set isAdmin flag correctly for admin roles', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['ict_super_admin'],
        permissions: [],
        isAdmin: true,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { isAdmin, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return <div>Is Admin: {isAdmin.toString()}</div>;
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Is Admin: true')).toBeInTheDocument();
      });
    });

    it('should throw error when used outside provider', () => {
      function TestComponent() {
        useUserRole();
        return <div>Test</div>;
      }

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow('useUserRole must be used within a UserRoleProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('RequirePermission component', () => {
    it('should render children when permission is granted', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['hr_admin'],
        permissions: [],
        isAdmin: true,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      render(
        <UserRoleProvider>
          <RequirePermission permission="canEditEmployees">
            <div>Edit Button</div>
          </RequirePermission>
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Button')).toBeInTheDocument();
      });
    });

    it('should render fallback when permission is denied', async () => {
      const mockCurrentUser = {
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

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      render(
        <UserRoleProvider>
          <RequirePermission permission="canEditEmployees" fallback={<div>No Access</div>}>
            <div>Edit Button</div>
          </RequirePermission>
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Edit Button')).not.toBeInTheDocument();
        expect(screen.getByText('No Access')).toBeInTheDocument();
      });
    });

    it('should render nothing during loading', () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['hr_admin'],
        permissions: [],
        isAdmin: true,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      const { container } = render(
        <UserRoleProvider>
          <RequirePermission permission="canEditEmployees">
            <div>Edit Button</div>
          </RequirePermission>
        </UserRoleProvider>
      );

      // During loading, nothing should be rendered
      expect(container.querySelector('div')).toBeNull();
    });
  });

  describe('RequireRole component', () => {
    it('should render children when user has the role', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['sectormanager'],
        permissions: [],
        isAdmin: false,
        sectorId: 'sector-1',
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      render(
        <UserRoleProvider>
          <RequireRole roles="sectormanager">
            <div>Manager Panel</div>
          </RequireRole>
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Manager Panel')).toBeInTheDocument();
      });
    });

    it('should render children when user has any of the roles', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@diepenbeek.be',
        displayName: 'Test User',
        roles: ['diensthoofd'],
        permissions: [],
        isAdmin: false,
        sectorId: null,
        dienstId: 'dienst-1',
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      render(
        <UserRoleProvider>
          <RequireRole roles={['sectormanager', 'diensthoofd']}>
            <div>Management Panel</div>
          </RequireRole>
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Management Panel')).toBeInTheDocument();
      });
    });

    it('should render fallback when user does not have the role', async () => {
      const mockCurrentUser = {
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

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      render(
        <UserRoleProvider>
          <RequireRole roles="hr_admin" fallback={<div>Access Denied</div>}>
            <div>Admin Panel</div>
          </RequireRole>
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Role hierarchy and permissions', () => {
    it('should give ICT Super Admin all permissions', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'admin@diepenbeek.be',
        displayName: 'Admin User',
        roles: ['ict_super_admin'],
        permissions: [],
        isAdmin: true,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { hasPermission, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return (
          <div>
            <div>View All: {hasPermission('canViewAllEmployees').toString()}</div>
            <div>Edit: {hasPermission('canEditEmployees').toString()}</div>
            <div>Delete: {hasPermission('canDeleteEmployees').toString()}</div>
            <div>Manage Groups: {hasPermission('canManageGroups').toString()}</div>
            <div>Manage Settings: {hasPermission('canManageSettings').toString()}</div>
            <div>Audit Logs: {hasPermission('canViewAuditLogs').toString()}</div>
          </div>
        );
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('View All: true')).toBeInTheDocument();
        expect(screen.getByText('Edit: true')).toBeInTheDocument();
        expect(screen.getByText('Delete: true')).toBeInTheDocument();
        expect(screen.getByText('Manage Groups: true')).toBeInTheDocument();
        expect(screen.getByText('Manage Settings: true')).toBeInTheDocument();
        expect(screen.getByText('Audit Logs: true')).toBeInTheDocument();
      });
    });

    it('should restrict medewerker permissions', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        email: 'employee@diepenbeek.be',
        displayName: 'Employee User',
        roles: ['medewerker'],
        permissions: [],
        isAdmin: false,
        sectorId: null,
        dienstId: null,
        employeeId: null,
      };

      vi.spyOn(api, 'getCurrentUser').mockResolvedValue(mockCurrentUser);

      function TestComponent() {
        const { hasPermission, isLoading } = useUserRole();

        if (isLoading) return <div>Loading...</div>;
        return (
          <div>
            <div>View All: {hasPermission('canViewAllEmployees').toString()}</div>
            <div>Edit: {hasPermission('canEditEmployees').toString()}</div>
            <div>Delete: {hasPermission('canDeleteEmployees').toString()}</div>
            <div>Validate: {hasPermission('canValidate').toString()}</div>
          </div>
        );
      }

      render(
        <UserRoleProvider>
          <TestComponent />
        </UserRoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('View All: false')).toBeInTheDocument();
        expect(screen.getByText('Edit: false')).toBeInTheDocument();
        expect(screen.getByText('Delete: false')).toBeInTheDocument();
        expect(screen.getByText('Validate: false')).toBeInTheDocument();
      });
    });
  });
});
