import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock AuthContext
const MockAuthContext = React.createContext({
  user: {
    id: 'test-user-id',
    email: 'test@diepenbeek.be',
    displayName: 'Test User',
    roles: ['ict_super_admin'],
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  hasRole: vi.fn().mockReturnValue(true),
  isAdmin: vi.fn().mockReturnValue(true),
})

interface WrapperProps {
  children: React.ReactNode
}

// Custom render function that includes all providers
function AllTheProviders({ children }: WrapperProps) {
  return (
    <BrowserRouter>
      <MockAuthContext.Provider value={{
        user: {
          id: 'test-user-id',
          email: 'test@diepenbeek.be',
          displayName: 'Test User',
          roles: ['ict_super_admin'],
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        getAccessToken: vi.fn().mockResolvedValue('mock-token'),
        hasRole: vi.fn().mockReturnValue(true),
        isAdmin: vi.fn().mockReturnValue(true),
      }}>
        {children}
      </MockAuthContext.Provider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
