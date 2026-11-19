import type * as SupabaseModule from '../../lib/supabase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupabaseClient } from '../../lib/supabase'
import { loadGroup } from './groupService'

vi.mock('../../lib/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof SupabaseModule>()),
  getSupabaseClient: vi.fn(),
}))

const maybeSingle = vi.fn()
const eq = vi.fn(() => ({ maybeSingle }))
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))
const client = { from } as unknown as ReturnType<typeof getSupabaseClient>

describe('loadGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    maybeSingle.mockResolvedValue({
      data: {
        id: 'group-1',
        name: 'The Wednesday crew',
        join_code: 'ABC123',
        leader_id: 'leader-user',
        is_locked: false,
        group_members: [
          {
            user_id: 'member-user',
            profiles: { display_name: 'Bob' },
          },
          {
            user_id: 'leader-user',
            profiles: { display_name: 'Alice' },
          },
        ],
      },
      error: null,
    })
    vi.mocked(getSupabaseClient).mockReturnValue(client)
  })

  it('marks the correct member as leader', async () => {
    await expect(loadGroup('group-1', 'member-user')).resolves.toMatchObject({
      members: [
        { userId: 'member-user', displayName: 'Bob', isLeader: false },
        { userId: 'leader-user', displayName: 'Alice', isLeader: true },
      ],
      isLeader: false,
    })
  })
})
