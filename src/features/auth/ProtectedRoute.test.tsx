import type { Session } from '@supabase/supabase-js'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { makeAuth, renderWithProviders } from '../../test/renderWithProviders'
import ProtectedRoute from './ProtectedRoute'

function renderGuarded(auth = makeAuth()) {
  return renderWithProviders(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<h1>Secret dashboard</h1>} path="/dashboard" />
      </Route>
      <Route element={<h1>Log in page</h1>} path="/login" />
    </Routes>,
    { auth, route: '/dashboard' },
  )
}

describe('ProtectedRoute', () => {
  it('redirects signed-out users to /login', () => {
    renderGuarded()
    expect(
      screen.getByRole('heading', { name: 'Log in page' }),
    ).toBeInTheDocument()
  })

  it('renders the page for signed-in users', () => {
    renderGuarded(makeAuth({ session: { user: { id: 'u1' } } as Session }))
    expect(
      screen.getByRole('heading', { name: 'Secret dashboard' }),
    ).toBeInTheDocument()
  })

  it('shows a loading state while the session is being restored', () => {
    renderGuarded(makeAuth({ loading: true }))
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  })
})
