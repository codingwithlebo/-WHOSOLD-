import type { Session } from '@supabase/supabase-js'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { makeAuth, renderWithProviders } from './test/renderWithProviders'

describe('App round-history route', () => {
  it('renders history for a signed-in member', async () => {
    renderWithProviders(<App />, {
      auth: makeAuth({
        session: { user: { id: 'u1' } } as Session,
      }),
      route: '/groups/group-1/history',
    })

    expect(
      await screen.findByRole('heading', { name: 'Round history' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Round history is not connected yet. No history has been loaded.',
    )
  })
})
