import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the WHOSOLD? landing page', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /would you risk it for everyone/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/sign-in and group creation are coming soon/i),
    ).toBeInTheDocument()
  })

  it('shows a not-found page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /this page isn’t in the game/i }),
    ).toBeInTheDocument()
  })
})
