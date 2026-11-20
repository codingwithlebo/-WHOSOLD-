import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { formatRand } from '../../lib/money'
import { formatSastDateTime } from './roundTime'
import RoundPage from './RoundPage'
import {
  getGroupRound,
  getReveal,
  submitChoice,
  type GroupRound,
  type RoundReveal,
} from './roundService'

function outcomeCopy(outcome: RoundReveal['outcome']) {
  if (outcome === 'doubled') return 'The fund doubled!'
  if (outcome === 'lost') return 'The fund was lost.'
  return 'The fund stayed intact.'
}

function memberResultCopy(result: RoundReveal['members'][number]['result']) {
  if (result === 'doubled_and_won') return 'Doubled and won'
  if (result === 'doubled_and_lost') return 'Doubled and lost'
  return 'Passed'
}

function RoundRevealCard({ reveal }: { reveal: RoundReveal }) {
  return (
    <main className="mx-auto grid w-full max-w-2xl flex-1 content-start gap-5 px-4 py-8 sm:px-6">
      <header>
        <p className="eyebrow">ROUND RESULTS</p>
        <h1 className="dashboard-title">{outcomeCopy(reveal.outcome)}</h1>
      </header>
      <section className="grid gap-3 rounded-2xl border border-[#a879e8]/40 bg-white/80 p-5">
        <p>
          Starting fund: <strong>{formatRand(reveal.startingFundCents)}</strong>
        </p>
        <p>
          Final fund: <strong>{formatRand(reveal.finalFundCents)}</strong>
        </p>
        <p className="text-sm text-on-surface-muted">
          Released {formatSastDateTime(reveal.releaseAt)} SAST.
        </p>
      </section>
      <section aria-labelledby="round-results-heading">
        <h2 className="text-xl font-extrabold" id="round-results-heading">
          What happened
        </h2>
        <ul className="mt-3 grid gap-2">
          {reveal.members.map((member, index) => (
            <li
              className="rounded-xl border bg-white/70 p-3"
              key={`${member.displayName}-${index}`}
            >
              <strong>{member.displayName}</strong>
              <span className="ml-2">{memberResultCopy(member.result)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default function GroupRoundPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [round, setRound] = useState<GroupRound | null>(null)
  const [reveal, setReveal] = useState<RoundReveal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshRound = useCallback(async () => {
    if (!groupId) {
      await Promise.resolve()
      setError('This group could not be found.')
      setLoading(false)
      return
    }

    try {
      const currentRound = await getGroupRound(groupId)
      setRound(currentRound)
      if (currentRound?.status === 'resolved') {
        setReveal(await getReveal(currentRound.id))
      } else {
        setReveal(null)
      }
      setError(null)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not load this round. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [groupId])

  function retryRoundLoad() {
    setLoading(true)
    setError(null)
    void refreshRound()
  }

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => void refreshRound(), 0)
    const intervalId = window.setInterval(() => void refreshRound(), 10_000)
    return () => {
      window.clearTimeout(initialLoadId)
      window.clearInterval(intervalId)
    }
  }, [refreshRound])

  async function handleSubmitChoice(choice: 'pass' | 'double') {
    if (!round) throw new Error('This round is unavailable.')
    await submitChoice(round.id, choice)
    await refreshRound()
  }

  if (loading) {
    return (
      <main className="grid flex-1 place-items-center" role="status">
        Loading your group round…
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto grid w-full max-w-2xl content-start gap-4 px-4 py-8">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Button onClick={retryRoundLoad} variant="secondary">
          Retry
        </Button>
        {groupId ? (
          <Link className="font-semibold underline" to={`/groups/${groupId}`}>
            Back to group
          </Link>
        ) : null}
      </main>
    )
  }

  if (!round) {
    return (
      <main className="mx-auto grid w-full max-w-2xl content-start gap-4 px-4 py-8">
        <h1 className="dashboard-title">No round has been scheduled</h1>
        <p className="text-on-surface-muted">
          The group leader can schedule a round from the group page once the
          group is locked and has a funded wishlist.
        </p>
        {groupId ? (
          <Link className="font-semibold underline" to={`/groups/${groupId}`}>
            Back to group
          </Link>
        ) : null}
      </main>
    )
  }

  if (reveal) return <RoundRevealCard reveal={reveal} />

  return (
    <RoundPage
      answeredCount={round.answeredCount}
      closesAt={round.closesAt}
      groupName={round.groupName}
      memberCount={round.memberCount}
      myChoice={round.myChoice}
      onSubmitChoice={handleSubmitChoice}
      onTakeQuiz={() =>
        void navigate(`/groups/${encodeURIComponent(round.groupId)}/round/quiz`)
      }
      opensAt={round.opensAt}
      releaseAt={round.releaseAt}
      startingFundCents={round.startingFundCents}
    />
  )
}
