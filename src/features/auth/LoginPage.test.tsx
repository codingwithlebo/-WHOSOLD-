import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { makeAuth, renderWithProviders } from '../../test/renderWithProviders'
import LoginPage from './LoginPage'

function renderLogin(auth = makeAuth()) {
  return renderWithProviders(
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<h1>Dashboard</h1>} path="/dashboard" />
    </Routes>,
    { auth, route: '/login' },
  )
}

describe('LoginPage', () => {
  it('shows validation errors and does not call signIn when empty', async () => {
    const { auth } = renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it('calls signIn with the trimmed email and goes to the dashboard', async () => {
    const { auth } = renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), '  alice@test.dev ')
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(auth.signIn).toHaveBeenCalledWith('alice@test.dev', 'Password123!')
    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('shows the server error when log-in fails', async () => {
    const auth = makeAuth({
      signIn: vi.fn().mockResolvedValue({ error: 'Invalid login credentials' }),
    })
    renderLogin(auth)
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.dev')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid login credentials',
      ),
    )
  })

  it('warns when Supabase is not configured', () => {
    renderLogin(makeAuth({ configured: false }))
    expect(
      screen.getByText(/supabase is not connected yet/i),
    ).toBeInTheDocument()
  })

  it('recovers when signIn throws (e.g. network failure)', async () => {
    const auth = makeAuth({
      signIn: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    })
    renderLogin(auth)
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.dev')
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /check your connection/i,
    )
    expect(screen.getByRole('button', { name: /log in/i })).toBeEnabled()
  })
})
