import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { renderWithProviders } from './test/renderWithProviders'

describe('App', () => {
  it('renders the landing page with log-in and sign-up links', async () => {
    renderWithProviders(<App />)

    expect(
      await screen.findByRole('heading', {
        name: /would you risk it for everyone/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: /log in/i }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: /start a group/i }).length,
    ).toBeGreaterThan(0)
  })

  it('lets visitors try the Double or Pass preview', async () => {
    renderWithProviders(<App />)

    expect(await screen.findByText('R50 000')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^pass$/i }))
    expect(screen.getByText(/fund intact/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^double$/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /play again/i }))
    expect(screen.getByRole('button', { name: /^double$/i })).toBeEnabled()
  })

  it('shows a not-found page for unknown routes', async () => {
    renderWithProviders(<App />, { route: '/unknown' })

    expect(
      await screen.findByRole('heading', {
        name: /this page is not in the game/i,
      }),
    ).toBeInTheDocument()
  })

  it('sends the bare groups path through the login flow', async () => {
    renderWithProviders(<App />, { route: '/groups' })

    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', {
        name: /this page is not in the game/i,
      }),
    ).not.toBeInTheDocument()
  })
})
