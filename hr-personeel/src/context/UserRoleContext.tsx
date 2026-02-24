import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import type { Rol, RolPermissies } from '../types';
import { rolPermissies } from '../types';
import { apiRequest } from '../auth/authConfig';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: Rol[];
  sectorId?: string;
  dienstId?: string;
}

interface UserRoleContextType {
  user: UserInfo | null;
  roles: Rol[];
  permissions: RolPermissies | null;
  isLoading: boolean;
  isAdmin: boolean;
  hasRole: (role: Rol) => boolean;
  hasAnyRole: (...roles: Rol[]) => boolean;
  hasPermission: (permission: keyof RolPermissies) => boolean;
  getHighestRole: () => Rol | null;
  refreshRoles: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

// Determine effective permissions based on highest role
function getEffectivePermissions(roles: Rol[]): RolPermissies | null {
  if (roles.length === 0) return null;

  // Role hierarchy (highest to lowest)
  const roleHierarchy: Rol[] = ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd', 'medewerker'];

  // Find highest role
  for (const role of roleHierarchy) {
    if (roles.includes(role)) {
      return rolPermissies[role];
    }
  }

  return rolPermissies.medewerker;
}

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRoles = useCallback(async () => {
    if (!isAuthenticated || accounts.length === 0) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const account = accounts[0];

      // Get access token to decode roles
      let accessToken: string;
      try {
        const response = await instance.acquireTokenSilent({
          ...apiRequest,
          account,
        });
        accessToken = response.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          // acquireTokenRedirect returns void and triggers redirect
          // After redirect, the token will be acquired on page reload
          await instance.acquireTokenRedirect(apiRequest);
          return; // Page will redirect, so exit early
        } else {
          throw error;
        }
      }

      // Decode JWT to get roles claim
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));

        // Get roles from token claims
        const tokenRoles = payload.roles || [];

        // Map token roles to our Rol type
        const mappedRoles: Rol[] = tokenRoles
          .map((r: string) => r.toLowerCase())
          .filter((r: string): r is Rol =>
            ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd', 'medewerker'].includes(r)
          );

        // If no roles in token, default to medewerker
        if (mappedRoles.length === 0) {
          mappedRoles.push('medewerker');
        }

        setUser({
          id: account.localAccountId,
          name: account.name || 'Onbekende gebruiker',
          email: account.username,
          roles: mappedRoles,
          // These would come from API in a real implementation
          sectorId: payload.sector_id,
          dienstId: payload.dienst_id,
        });
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      // Set default user with medewerker role
      if (accounts.length > 0) {
        const account = accounts[0];
        setUser({
          id: account.localAccountId,
          name: account.name || 'Onbekende gebruiker',
          email: account.username,
          roles: ['medewerker'],
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [instance, accounts, isAuthenticated]);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  const roles = user?.roles || [];
  const permissions = getEffectivePermissions(roles);

  const hasRole = useCallback((role: Rol): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyRole = useCallback((...checkRoles: Rol[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  }, [roles]);

  const hasPermission = useCallback((permission: keyof RolPermissies): boolean => {
    if (!permissions) return false;
    const value = permissions[permission];
    return typeof value === 'boolean' ? value : false;
  }, [permissions]);

  const isAdmin = hasAnyRole('ict_super_admin', 'hr_admin');

  const getHighestRole = useCallback((): Rol | null => {
    const roleHierarchy: Rol[] = ['ict_super_admin', 'hr_admin', 'sectormanager', 'diensthoofd', 'medewerker'];
    for (const role of roleHierarchy) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return null;
  }, [roles]);

  return (
    <UserRoleContext.Provider
      value={{
        user,
        roles,
        permissions,
        isLoading,
        isAdmin,
        hasRole,
        hasAnyRole,
        hasPermission,
        getHighestRole,
        refreshRoles: fetchUserRoles,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}

// Convenience component for conditional rendering based on permissions
interface RequirePermissionProps {
  permission: keyof RolPermissies;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission, isLoading } = useUserRole();

  if (isLoading) {
    return null;
  }

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

// Convenience component for conditional rendering based on roles
interface RequireRoleProps {
  roles: Rol | Rol[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const { hasAnyRole, isLoading } = useUserRole();

  if (isLoading) {
    return null;
  }

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return hasAnyRole(...roleArray) ? <>{children}</> : <>{fallback}</>;
}
