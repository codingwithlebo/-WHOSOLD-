import { screen } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { makeAuth, renderWithProviders } from './test/renderWithProviders'

vi.mock('./features/round/GroupRoundPage', () => ({
  default: () => 'Round page',
}))
vi.mock('./features/round/QuizRoute', () => ({
  default: () => 'Quiz page',
}))

describe('gameplay routes', () => {
  it.each([
    ['/groups/group-1/round', 'Round page'],
    ['/groups/group-1/round/quiz', 'Quiz page'],
  ])('renders the protected route at %s', async (route, page) => {
    const session = { user: { id: 'user-1' } } as Session

    renderWithProviders(<App />, {
      auth: makeAuth({ session }),
      route,
    })

    expect(await screen.findByText(page)).toBeInTheDocument()
  })
})
