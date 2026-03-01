import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
  useIsAuthenticated,
} from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import {
  PublicClientApplication,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { msalConfig, loginRequest } from './authConfig';
import { DjoppieHiveLogo } from '../components/Logo';

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Initialize MSAL instance first (required in MSAL v3+)
        await msalInstance.initialize();

        // Handle redirect promise after initialization
        await msalInstance.handleRedirectPromise();

        // Set active account if available
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
        }

        // Listen for account changes
        msalInstance.addEventCallback((event) => {
          if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            const account = (event.payload as { account: AccountInfo }).account;
            msalInstance.setActiveAccount(account);
          }
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('MSAL initialization error:', error);
        setIsInitialized(true); // Still render to show error state
      }
    };

    initializeMsal();
  }, []);

  if (!isInitialized) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Applicatie laden...</p>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}

// Login page component
function LoginPage() {
  const { instance, inProgress } = useMsal();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      setError('Aanmelden mislukt. Probeer het opnieuw.');
      console.error('Login error:', err);
    }
  };

  const isLoading = inProgress !== InteractionStatus.None;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <DjoppieHiveLogo
            size="large"
            theme="dark"
            showSubtitle={true}
          />
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Bezig met aanmelden...' : 'Aanmelden met Microsoft'}
        </button>

        <p className="login-hint">
          Gebruik uw gemeentelijke Microsoft-account om aan te melden.
        </p>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { inProgress } = useMsal();

  // Show loading while checking auth status
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Authenticatie controleren...</p>
      </div>
    );
  }

  return (
    <>
      <AuthenticatedTemplate>
        {children}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
    </>
  );
}

// Hook to get current user info
export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // Compute account directly without useEffect
  const account = (() => {
    const activeAccount = instance.getActiveAccount();
    if (activeAccount) {
      return activeAccount;
    }
    if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
      return accounts[0];
    }
    return null;
  })();

  const login = async () => {
    await instance.loginRedirect(loginRequest);
  };

  const logout = async () => {
    await instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  };

  return {
    isAuthenticated,
    isLoading: inProgress !== InteractionStatus.None,
    account,
    user: account ? {
      name: account.name || 'Onbekende gebruiker',
      email: account.username,
      id: account.localAccountId,
    } : null,
    login,
    logout,
  };
}

export { AuthenticatedTemplate, UnauthenticatedTemplate };
