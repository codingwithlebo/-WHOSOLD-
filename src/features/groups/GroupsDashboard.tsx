import {
  useState,
  type Dispatch,
  type SetStateAction,
  type SubmitEvent,
} from 'react'
import { Button, ButtonLink } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TextField from '../../components/ui/TextField'
import type { GroupSummary } from './groupService'

export type { GroupSummary } from './groupService'

interface GroupsDashboardProps {
  groups: GroupSummary[]
  onGroupsChange?: Dispatch<SetStateAction<GroupSummary[]>>
  groupsLoading?: boolean
  groupsLoadError?: string | null
  onRetryGroups?: () => void
  onCreateGroup: (name: string) => Promise<GroupSummary>
  onJoinGroup: (code: string) => Promise<GroupSummary>
  onLockGroup: (groupId: string) => Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'The request could not be completed. Please try again.'
}

export default function GroupsDashboard({
  groups: initialGroups,
  onGroupsChange,
  groupsLoading = false,
  groupsLoadError = null,
  onRetryGroups,
  onCreateGroup,
  onJoinGroup,
  onLockGroup,
}: GroupsDashboardProps) {
  const [localGroups, setLocalGroups] = useState(initialGroups)
  const groups = onGroupsChange ? initialGroups : localGroups
  const setGroups = onGroupsChange ?? setLocalGroups
  const [groupName, setGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [groupNameError, setGroupNameError] = useState<string | null>(null)
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null)

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = groupName.trim()
    if (!name) {
      setError(null)
      setGroupNameError('Enter a group name.')
      setJoinCodeError(null)
      return
    }

    setGroupNameError(null)
    setJoinCodeError(null)
    setBusy(true)
    setError(null)
    try {
      const group = await onCreateGroup(name)
      setGroups((current) => [...current, group])
      setGroupName('')
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError(null)
      setGroupNameError(null)
      setJoinCodeError('Enter a valid 6-character group code.')
      return
    }

    setGroupNameError(null)
    setJoinCodeError(null)
    setBusy(true)
    setError(null)
    try {
      const group = await onJoinGroup(code)
      setGroups((current) => [
        ...current.filter((existing) => existing.id !== group.id),
        group,
      ])
      setJoinCode('')
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleCopyCode(group: GroupSummary) {
    setError(null)
    try {
      await navigator.clipboard.writeText(group.joinCode)
      setCopiedGroupId(group.id)
    } catch {
      setError('Could not copy the join code. Select and copy it instead.')
    }
  }

  async function handleLock(groupId: string) {
    setBusy(true)
    setError(null)
    try {
      await onLockGroup(groupId)
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId ? { ...group, isLocked: true } : group,
        ),
      )
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-labelledby="groups-heading"
      className="mx-auto w-full max-w-4xl"
    >
      <header>
        <p className="eyebrow">YOUR CREW</p>
        <h1 className="dashboard-title" id="groups-heading">
          Your groups
        </h1>
        <p className="mt-2 text-slate-300">
          Start a group or join your crew with a code.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-bold">Create a group</h2>
          <p className="mt-2 text-sm text-slate-300">
            Get a join code to share with your mates.
          </p>
          <form
            className="mt-5 space-y-4"
            noValidate
            onSubmit={(event) => void handleCreate(event)}
          >
            <TextField
              autoComplete="off"
              error={groupNameError ?? undefined}
              label="Group name"
              maxLength={50}
              onChange={(event) => {
                setGroupName(event.target.value)
                setGroupNameError(null)
              }}
              placeholder="The Wednesday crew"
              required
              value={groupName}
            />
            <Button disabled={busy} type="submit" variant="primary">
              {busy ? 'Working…' : 'Create group'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold">Join a group</h2>
          <p className="mt-2 text-sm text-slate-300">
            Enter the 6-character code your group shared with you.
          </p>
          <form
            className="mt-5 space-y-4"
            noValidate
            onSubmit={(event) => void handleJoin(event)}
          >
            <TextField
              autoCapitalize="characters"
              autoComplete="off"
              error={joinCodeError ?? undefined}
              label="Join code"
              maxLength={6}
              onChange={(event) => {
                setJoinCode(event.target.value)
                setJoinCodeError(null)
              }}
              placeholder="ABC123"
              required
              value={joinCode}
            />
            <Button disabled={busy} type="submit" variant="secondary">
              {busy ? 'Working…' : 'Join group'}
            </Button>
          </form>
        </Card>
      </div>

      {error ? (
        <p className="form-error mt-5" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="your-groups-heading" className="mt-10">
        <h2 className="text-2xl font-bold" id="your-groups-heading">
          Groups you&apos;ve joined
        </h2>
        {groupsLoadError ? (
          <div className="mt-3">
            <p className="form-error" role="alert">
              {groupsLoadError}
            </p>
            {onRetryGroups ? (
              <Button
                className="mt-3"
                onClick={onRetryGroups}
                variant="secondary"
              >
                Retry loading groups
              </Button>
            ) : null}
          </div>
        ) : groupsLoading ? (
          <p className="mt-3 text-slate-300" role="status">
            Loading your groups…
          </p>
        ) : groups.length === 0 ? (
          <p className="mt-3 text-slate-300">
            You haven&apos;t joined a group yet.
          </p>
        ) : (
          <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2">
            {groups.map((group) => (
              <li key={group.id}>
                <Card className="h-full p-5">
                  <h3 className="text-lg font-bold [overflow-wrap:anywhere]">
                    {group.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {group.members.length} of 10 members
                  </p>
                  <ul aria-label={`${group.name} members`} className="mt-2">
                    {group.members.map((member, index) => (
                      <li
                        className="[overflow-wrap:anywhere]"
                        key={`${member}-${index}`}
                      >
                        {member}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="select-all font-mono tracking-widest">
                      {group.joinCode}
                    </span>
                    <Button
                      onClick={() => void handleCopyCode(group)}
                      size="md"
                      variant="ghost"
                    >
                      {copiedGroupId === group.id ? 'Copied' : 'Copy code'}
                    </Button>
                    <span className="sr-only" role="status">
                      {copiedGroupId === group.id ? 'Join code copied.' : ''}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    {group.isLocked ? 'Group locked' : 'Open to new members'}
                  </p>
                  <ButtonLink
                    aria-label={`Open ${group.name}`}
                    className="mt-4"
                    to={`/groups/${encodeURIComponent(group.id)}`}
                    variant="primary"
                  >
                    Open group
                  </ButtonLink>
                  {group.isLeader && !group.isLocked ? (
                    <Button
                      className="mt-4"
                      disabled={busy}
                      onClick={() => void handleLock(group.id)}
                      variant="secondary"
                    >
                      Lock group
                    </Button>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
