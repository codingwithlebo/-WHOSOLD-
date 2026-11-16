import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { makeAuth, renderWithProviders } from '../../test/renderWithProviders'
import SignupPage from './SignupPage'

describe('SignupPage', () => {
  it('signs up with display name, email and password', async () => {
    const { auth } = renderWithProviders(
      <Routes>
        <Route element={<SignupPage />} path="/signup" />
        <Route element={<h1>Dashboard</h1>} path="/dashboard" />
      </Routes>,
      { auth: makeAuth(), route: '/signup' },
    )

    await userEvent.type(screen.getByLabelText(/display name/i), ' Alice ')
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.dev')
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!')
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )

    expect(auth.signUp).toHaveBeenCalledWith(
      'alice@test.dev',
      'Password123!',
      'Alice',
    )
    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('blocks weak passwords', async () => {
    const { auth } = renderWithProviders(<SignupPage />, { route: '/signup' })
    await userEvent.type(screen.getByLabelText(/display name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.dev')
    await userEvent.type(screen.getByLabelText(/password/i), 'short')
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )

    expect(
      screen.getByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
  })
})
