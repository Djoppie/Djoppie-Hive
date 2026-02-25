import { vi } from 'vitest';
import type { AccountInfo } from '@azure/msal-browser';

export const mockAccount: AccountInfo = {
  homeAccountId: 'test-home-account-id',
  environment: 'login.windows.net',
  tenantId: '7db28d6f-d542-40c1-b529-5e5ed2aad545',
  username: 'test.user@diepenbeek.be',
  localAccountId: 'test-local-account-id',
  name: 'Test User',
  idTokenClaims: {},
};

export const mockMsalInstance = {
  initialize: vi.fn().mockResolvedValue(undefined),
  handleRedirectPromise: vi.fn().mockResolvedValue(null),
  getAllAccounts: vi.fn().mockReturnValue([mockAccount]),
  getActiveAccount: vi.fn().mockReturnValue(mockAccount),
  setActiveAccount: vi.fn(),
  addEventCallback: vi.fn(),
  acquireTokenSilent: vi.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    account: mockAccount,
  }),
  acquireTokenRedirect: vi.fn().mockResolvedValue(undefined),
  acquireTokenPopup: vi.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    account: mockAccount,
  }),
  loginRedirect: vi.fn().mockResolvedValue(undefined),
  logoutRedirect: vi.fn().mockResolvedValue(undefined),
};

export const createMockMsalContext = (overrides = {}) => ({
  instance: mockMsalInstance,
  accounts: [mockAccount],
  inProgress: 'none' as const,
  ...overrides,
});
