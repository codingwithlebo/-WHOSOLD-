import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import {
  AuthContext,
  type AuthContextValue,
} from '../features/auth/AuthContext'

export function makeAuth(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    session: null,
    user: null,
    displayName: null,
    loading: false,
    configured: true,
    signIn: vi.fn().mockResolvedValue({}),
    signUp: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function renderWithProviders(
  ui: ReactElement,
  {
    auth = makeAuth(),
    route = '/',
  }: { auth?: AuthContextValue; route?: string } = {},
) {
  return {
    auth,
    ...render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext.Provider>,
    ),
  }
}
