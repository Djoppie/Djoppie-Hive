import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'

// Mock MSAL
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    },
    accounts: [{ username: 'test@diepenbeek.be' }],
    inProgress: 'none',
  }),
  useIsAuthenticated: () => true,
  MsalProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:5014/api')

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})
