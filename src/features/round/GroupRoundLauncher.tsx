import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/ui/Button'
import type { GroupSummary } from '../groups/groupService'
import StartRoundForm from './StartRoundForm'
import { formatSastDateTime } from './roundTime'
import { getGroupRound, startRound, type GroupRound } from './roundService'

interface GroupRoundLauncherProps {
  group: GroupSummary
  startingFundCents: number
}

export default function GroupRoundLauncher({
  group,
  startingFundCents,
}: GroupRoundLauncherProps) {
  const navigate = useNavigate()
  const [round, setRound] = useState<GroupRound | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshRound = useCallback(async () => {
    try {
      setRound(await getGroupRound(group.id))
      setError(null)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not load this group’s round. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [group.id])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void refreshRound(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [refreshRound])

  async function handleCreateRound(schedule: Parameters<typeof startRound>[1]) {
    await startRound(group.id, schedule)
    await navigate(`/groups/${encodeURIComponent(group.id)}/round`)
  }

  function retryRoundLoad() {
    setLoading(true)
    void refreshRound()
  }

  const canSchedule =
    group.isLeader &&
    group.isLocked &&
    group.members.length >= 2 &&
    startingFundCents > 0

  return (
    <section aria-labelledby="round-launcher-heading" className="mt-8">
      <header className="mb-4">
        <p className="eyebrow">DOUBLE OR PASS</p>
        <h2 className="text-xl font-extrabold" id="round-launcher-heading">
          Group game
        </h2>
      </header>

      {loading ? (
        <p className="text-on-surface-muted" role="status">
          Checking for a round…
        </p>
      ) : error ? (
        <div>
          <p className="form-error" role="alert">
            {error}
          </p>
          <Button className="mt-3" onClick={retryRoundLoad} variant="secondary">
            Retry
          </Button>
        </div>
      ) : round && round.status !== 'resolved' ? (
        <div className="grid gap-3 rounded-2xl border border-[#a879e8]/40 bg-white/70 p-5">
          <p className="text-on-surface-muted">
            {round.status === 'closed'
              ? `The choice window is closed. Results release ${formatSastDateTime(round.releaseAt)} SAST.`
              : `${round.answeredCount} of ${round.memberCount} members have answered.`}
          </p>
          <ButtonLink
            className="w-fit"
            to={`/groups/${encodeURIComponent(group.id)}/round`}
            variant="primary"
          >
            Open active round
          </ButtonLink>
        </div>
      ) : (
        <>
          {round ? (
            <div className="mb-4 rounded-2xl border border-[#a879e8]/40 bg-white/70 p-5">
              <p className="font-semibold">The last round has been released.</p>
              <ButtonLink
                className="mt-3 w-fit"
                to={`/groups/${encodeURIComponent(group.id)}/round`}
                variant="secondary"
              >
                View last round results
              </ButtonLink>
            </div>
          ) : null}
          {canSchedule ? (
            <div className="rounded-2xl border border-[#a879e8]/40 bg-white/70 p-5">
              <StartRoundForm onCreateRound={handleCreateRound} />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-5 text-on-surface-muted">
              {!group.isLocked
                ? 'The group leader must lock the group before a round can start.'
                : group.members.length < 2
                  ? 'At least two members are needed before a round can start.'
                  : startingFundCents <= 0
                    ? 'Add wishlist items to create a fund before starting a round.'
                    : 'Waiting for the group leader to schedule a round.'}
            </p>
          )}
        </>
      )}
    </section>
  )
}
