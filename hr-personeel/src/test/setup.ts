import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:5014/api');
vi.stubEnv('VITE_ENTRA_CLIENT_ID', 'acc348be-b533-4402-8041-672c1cba1273');
vi.stubEnv('VITE_ENTRA_TENANT_ID', '7db28d6f-d542-40c1-b529-5e5ed2aad545');
vi.stubEnv('VITE_ENTRA_BACKEND_CLIENT_ID', '2b620e06-39ee-4177-a559-76a12a79320f');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    origin: 'http://localhost:5173',
    href: 'http://localhost:5173',
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
