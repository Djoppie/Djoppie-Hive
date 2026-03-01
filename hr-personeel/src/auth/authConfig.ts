import type { Configuration } from '@azure/msal-browser';
import { LogLevel } from '@azure/msal-browser';

// MSAL configuration for Djoppie-Hive
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || '2ea8a14d-ea05-40cc-af35-dd482bf8e235',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID || '7db28d6f-d542-40c1-b529-5e5ed2aad545'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
        }
      },
      logLevel: import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error,
    },
  },
};

// API scopes for backend
export const apiScopes = {
  backendApi: [
    `api://${import.meta.env.VITE_ENTRA_BACKEND_CLIENT_ID || '2b620e06-39ee-4177-a559-76a12a79320f'}/access_as_user`,
  ],
  graphApi: [
    'User.Read',
    'GroupMember.Read.All',
  ],
};

// Login request configuration
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', ...apiScopes.backendApi],
};

// API request configuration
export const apiRequest = {
  scopes: apiScopes.backendApi,
};
