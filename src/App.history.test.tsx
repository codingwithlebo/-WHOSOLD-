import type { Session } from '@supabase/supabase-js'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { makeAuth, renderWithProviders } from './test/renderWithProviders'

describe('App round-history route', () => {
  it('keeps the unfinished history route unavailable', async () => {
    renderWithProviders(<App />, {
      auth: makeAuth({
        session: { user: { id: 'u1' } } as Session,
      }),
      route: '/groups/group-1/history',
    })

    expect(
      await screen.findByRole('heading', {
        name: /this page is not in the game/i,
      }),
    ).toBeInTheDocument()
  })
})
