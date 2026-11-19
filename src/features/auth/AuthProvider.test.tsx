import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from './AuthContext'
import AuthProvider from './AuthProvider'

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void

// A fake Supabase client. `client` is swapped per test; `null` means the
// project keys are missing, like a fresh checkout without `.env.local`.
const h = vi.hoisted(() => ({
  client: null as null | {
    auth: {
      getSession: ReturnType<typeof vi.fn>
      onAuthStateChange: ReturnType<typeof vi.fn>
      signInWithPassword: ReturnType<typeof vi.fn>
      signUp: ReturnType<typeof vi.fn>
      signOut: ReturnType<typeof vi.fn>
    }
  },
}))

vi.mock('../../lib/supabase', () => ({
  get supabase() {
    return h.client
  },
  get isSupabaseConfigured() {
    return h.client !== null
  },
}))

function fakeSession(displayName: string): Session {
  return {
    access_token: 'token',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: { display_name: displayName },
      created_at: '2026-11-19T00:00:00Z',
    },
  }
}

let listener: AuthListener | undefined
const unsubscribe = vi.fn()

function makeClient(saved: Session | null) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: saved } }),
      onAuthStateChange: vi.fn((callback: AuthListener) => {
        listener = callback
        return { data: { subscription: { unsubscribe } } }
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }
}

let lastResult = ''

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <p>{auth.loading ? 'loading' : 'ready'}</p>
      <p>{auth.user ? `user: ${auth.displayName ?? '?'}` : 'signed out'}</p>
      <button
        onClick={() => {
          void auth.signIn('alice@test.dev', 'wrong').then((r) => {
            lastResult = r.error ?? 'ok'
          })
        }}
        type="button"
      >
        sign in
      </button>
      <button
        onClick={() => {
          void auth
            .signUp('new@test.dev', 'Password123!', 'Nomsa')
            .then((r) => {
              lastResult = r.error ?? 'ok'
            })
        }}
        type="button"
      >
        sign up
      </button>
      <button onClick={() => void auth.signOut()} type="button">
        sign out
      </button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

beforeEach(() => {
  listener = undefined
  lastResult = ''
  unsubscribe.mockClear()
})

afterEach(() => {
  h.client = null
  vi.restoreAllMocks()
})

describe('AuthProvider', () => {
  it('shows loading until the saved session is restored', async () => {
    let resolve!: (value: { data: { session: Session | null } }) => void
    h.client = makeClient(null)
    h.client.auth.getSession.mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )

    renderProvider()
    expect(screen.getByText('loading')).toBeInTheDocument()

    await act(async () => {
      resolve({ data: { session: fakeSession('Alice') } })
      await Promise.resolve()
    })

    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(screen.getByText('user: Alice')).toBeInTheDocument()
  })

  it('is ready and signed out when there is no saved session', async () => {
    h.client = makeClient(null)
    renderProvider()

    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(screen.getByText('signed out')).toBeInTheDocument()
  })

  it('stops loading if restoring the session fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    h.client = makeClient(null)
    h.client.auth.getSession.mockRejectedValue(new TypeError('Failed to fetch'))

    renderProvider()

    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(screen.getByText('signed out')).toBeInTheDocument()
  })

  it('follows log-in and log-out events from Supabase', async () => {
    h.client = makeClient(null)
    renderProvider()
    await screen.findByText('ready')

    act(() => {
      listener?.('SIGNED_IN', fakeSession('Bob'))
    })
    expect(screen.getByText('user: Bob')).toBeInTheDocument()

    act(() => {
      listener?.('SIGNED_OUT', null)
    })
    expect(screen.getByText('signed out')).toBeInTheDocument()
  })

  it('signs out through Supabase', async () => {
    h.client = makeClient(fakeSession('Alice'))
    renderProvider()
    await screen.findByText('user: Alice')

    await userEvent.click(screen.getByRole('button', { name: 'sign out' }))

    expect(h.client.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('returns the Supabase message when log-in fails', async () => {
    h.client = makeClient(null)
    h.client.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    renderProvider()
    await screen.findByText('ready')

    await userEvent.click(screen.getByRole('button', { name: 'sign in' }))

    await waitFor(() => {
      expect(lastResult).toBe('Invalid login credentials')
    })
  })

  it('sends the display name with sign-up', async () => {
    h.client = makeClient(null)
    renderProvider()
    await screen.findByText('ready')

    await userEvent.click(screen.getByRole('button', { name: 'sign up' }))

    await waitFor(() => {
      expect(lastResult).toBe('ok')
    })
    expect(h.client.auth.signUp).toHaveBeenCalledWith({
      email: 'new@test.dev',
      password: 'Password123!',
      options: { data: { display_name: 'Nomsa' } },
    })
  })

  it('stops listening for auth events when it unmounts', async () => {
    h.client = makeClient(null)
    const { unmount } = renderProvider()
    await screen.findByText('ready')

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('explains that Supabase is not connected when the keys are missing', async () => {
    h.client = null
    renderProvider()

    expect(screen.getByText('ready')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'sign in' }))

    await waitFor(() => {
      expect(lastResult).toMatch(/Supabase is not connected/)
    })
  })
})
