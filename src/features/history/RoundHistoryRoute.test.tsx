import type { Session } from '@supabase/supabase-js'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { makeAuth, renderWithProviders } from '../../test/renderWithProviders'
import ProtectedRoute from '../auth/ProtectedRoute'
import RoundHistoryRoute from './RoundHistoryRoute'

function renderHistoryRoute(session?: Session) {
  return renderWithProviders(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route
          element={<RoundHistoryRoute />}
          path="/groups/:groupId/history"
        />
      </Route>
      <Route element={<h1>Log in required</h1>} path="/login" />
    </Routes>,
    {
      auth: makeAuth({ session: session ?? null }),
      route: '/groups/group-1/history',
    },
  )
}

describe('RoundHistoryRoute', () => {
  it('redirects guests to log in', () => {
    renderHistoryRoute()

    expect(
      screen.getByRole('heading', { name: 'Log in required' }),
    ).toBeInTheDocument()
  })

  it('shows an explicit unavailable state for signed-in members', () => {
    renderHistoryRoute({ user: { id: 'u1' } } as Session)

    expect(
      screen.getByRole('heading', { name: 'Round history' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Round history is not connected yet. No history has been loaded.',
    )
  })
})
