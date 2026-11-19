import { getSupabaseClient, toError } from '../../lib/supabase'

export interface GroupSummary {
  id: string
  name: string
  joinCode: string
  members: string[]
  isLeader: boolean
  isLocked: boolean
}

const GROUP_SELECT =
  'id, name, join_code, leader_id, is_locked, group_members(user_id, profiles(display_name))'

function mapGroup(
  row: {
    id: string
    name: string
    join_code: string
    leader_id: string
    is_locked: boolean
    group_members: {
      user_id: string
      profiles: { display_name: string } | null
    }[]
  },
  userId: string,
): GroupSummary {
  const members = row.group_members.map((member) => {
    if (!member.profiles) {
      throw new Error('Could not load the names of this group’s members.')
    }

    return member.profiles.display_name
  })

  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    members,
    isLeader: row.leader_id === userId,
    isLocked: row.is_locked,
  }
}

export async function loadGroups(userId: string): Promise<GroupSummary[]> {
  const { data, error } = await getSupabaseClient()
    .from('groups')
    .select(GROUP_SELECT)
    .order('created_at')

  if (error) throw toError(error)

  return data.map((group) => mapGroup(group, userId))
}

export async function loadGroup(
  groupId: string,
  userId: string,
): Promise<GroupSummary | null> {
  const { data, error } = await getSupabaseClient()
    .from('groups')
    .select(GROUP_SELECT)
    .eq('id', groupId)
    .maybeSingle()

  if (error) throw toError(error)
  return data ? mapGroup(data, userId) : null
}

export async function createGroup(
  name: string,
  userId: string,
  displayName: string | null,
): Promise<GroupSummary> {
  const { data, error } = await getSupabaseClient().rpc('create_group', {
    group_name: name,
  })

  if (error) throw toError(error)

  return {
    id: data.id,
    name: data.name,
    joinCode: data.join_code,
    members: [displayName ?? 'You'],
    isLeader: data.leader_id === userId,
    isLocked: data.is_locked,
  }
}

export async function joinGroup(
  code: string,
  userId: string,
): Promise<GroupSummary> {
  const { data, error } = await getSupabaseClient().rpc('join_group', { code })

  if (error) throw toError(error)

  const group = await loadGroup(data.id, userId)
  if (!group) {
    throw new Error('You joined the group, but it could not be loaded.')
  }

  return group
}

export async function lockGroup(groupId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('lock_group', {
    target_group_id: groupId,
  })

  if (error) throw toError(error)
}
