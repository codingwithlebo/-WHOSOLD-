import type { User } from '@supabase/supabase-js'
import type * as SupabaseModule from '../../lib/supabase'
import type { ReactNode } from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupabaseClient } from '../../lib/supabase'
import { makeAuth, renderWithProviders } from '../../test/renderWithProviders'
import DashboardPage from './DashboardPage'

vi.mock('../../lib/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof SupabaseModule>()),
  getSupabaseClient: vi.fn(),
}))
vi.mock('../../three/Scene3D', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('../../three/AmbientScene', () => ({ default: () => null }))

const queryResult = {
  data: null,
  error: { message: 'No group found with that code.' },
}
const order = vi.fn().mockResolvedValue(queryResult)
const select = vi.fn().mockReturnValue({ order })
const from = vi.fn().mockReturnValue({ select })
const client = { from } as unknown as ReturnType<typeof getSupabaseClient>

describe('DashboardPage Supabase errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSupabaseClient).mockReturnValue(client)
  })

  it('shows the database message when loading groups fails', async () => {
    renderWithProviders(<DashboardPage />, {
      auth: makeAuth({ user: { id: 'user-1' } as User }),
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No group found with that code.',
    )
    expect(from).toHaveBeenCalledWith('groups')
  })
})
