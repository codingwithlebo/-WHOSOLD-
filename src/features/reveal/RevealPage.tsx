import { useEffect, useState } from 'react'
import { Button, ButtonLink } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { formatRand } from '../../lib/money'
import { formatSastDateTime } from '../round/roundTime'
import { formatTimeUntil } from './revealService'
import type {
  MemberResult,
  RevealOutcome,
  RevealState,
  RoundReveal,
} from './revealTypes'

interface RevealPageProps {
  groupName: string | null
  state: RevealState
  onRetry?: () => void
  /** Called once the countdown reaches release time, so the caller can refetch. */
  onReleaseDue?: () => void
  /** Injectable clock for tests. */
  now?: () => number
}

const outcomeCopy: Record<RevealOutcome, { label: string; line: string }> = {
  intact: {
    label: 'Intact',
    line: 'Everyone passed. The fund stays exactly as it was.',
  },
  doubled: {
    label: 'Grown',
    line: 'At least one member doubled and won, and nobody lost. The fund doubled once.',
  },
  lost: {
    label: 'Lost',
    line: 'At least one member doubled and lost, so the whole fund is gone.',
  },
}

const resultLabels: Record<MemberResult, string> = {
  passed: 'Passed',
  doubled_won: 'Doubled and won',
  doubled_lost: 'Doubled and lost',
}

function Countdown({
  releaseAt,
  now,
  onReleaseDue,
}: {
  releaseAt: string
  now: () => number
  onReleaseDue?: () => void
}) {
  const target = new Date(releaseAt).getTime()
  const [remaining, setRemaining] = useState(() => target - now())

  useEffect(() => {
    const tick = () => {
      const left = target - now()
      setRemaining(left)
      if (left <= 0) {
        window.clearInterval(id)
        onReleaseDue?.()
      }
    }
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [target, now, onReleaseDue])

  return (
    <Card className="mt-6 p-6">
      <p className="text-on-surface-muted">Results are released on</p>
      <p className="mt-1 text-lg font-bold">
        <time dateTime={releaseAt}>{formatSastDateTime(releaseAt)}</time> SAST
      </p>
      <p
        aria-live="polite"
        className="mt-4 text-3xl font-bold tabular-nums"
        role="timer"
      >
        {remaining > 0 ? formatTimeUntil(remaining) : 'Releasing now…'}
      </p>
      <p className="mt-4 text-sm text-on-surface-muted">
        Nobody, including the leader, can see choices or quiz results before
        then.
      </p>
    </Card>
  )
}

function Revealed({ reveal }: { reveal: RoundReveal }) {
  const copy = outcomeCopy[reveal.outcome]

  return (
    <div className="reveal-in mt-6 grid gap-4">
      <Card className="p-6">
        <p className="eyebrow">THE VERDICT</p>
        <h2 className="mt-1 text-4xl font-bold" id="reveal-outcome">
          {copy.label}
        </h2>
        <p className="mt-2 text-on-surface-muted">{copy.line}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-on-surface-muted">
              Virtual fund before
            </dt>
            <dd className="mt-1 text-xl font-semibold">
              {formatRand(reveal.startingFundCents)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-on-surface-muted">
              Virtual fund after
            </dt>
            <dd className="mt-1 text-xl font-semibold">
              {formatRand(reveal.finalFundCents)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold" id="breakdown-heading">
          Who did what
        </h2>
        {reveal.members.length === 0 ? (
          <p className="mt-3 text-on-surface-muted">
            No members were in this round.
          </p>
        ) : (
          <ul
            aria-labelledby="breakdown-heading"
            className="mt-3 grid list-none gap-2 p-0"
          >
            {reveal.members.map((member) => (
              <li
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3"
                key={member.userId}
              >
                <span className="font-semibold">{member.displayName}</span>
                <span className="text-sm">{resultLabels[member.result]}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-on-surface-muted">
          Members who did not answer before the window closed count as Passed.
        </p>
      </Card>
    </div>
  )
}

export default function RevealPage({
  groupName,
  state,
  onRetry,
  onReleaseDue,
  now = Date.now,
}: RevealPageProps) {
  const heading = groupName ? `Release day — ${groupName}` : 'Release day'

  return (
    <section
      aria-labelledby="reveal-heading"
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
    >
      <ButtonLink className="mb-6" to="/dashboard" variant="ghost">
        Back to dashboard
      </ButtonLink>
      <header>
        <p className="eyebrow">YOUR CREW</p>
        <h1 className="dashboard-title" id="reveal-heading">
          {heading}
        </h1>
        <p className="mt-2 text-on-surface-muted">
          Virtual funds — this is a game. No real money is involved.
        </p>
      </header>

      {state.status === 'loading' ? (
        <p className="mt-6 text-on-surface-muted" role="status">
          Loading results…
        </p>
      ) : null}

      {state.status === 'unavailable' ? (
        <Card className="mt-6 p-6">
          <p className="text-on-surface-muted" role="status">
            The reveal is not connected yet. No results have been loaded.
          </p>
        </Card>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-6">
          <p className="form-error" role="alert">
            {state.message}
          </p>
          {onRetry ? (
            <Button className="mt-3" onClick={onRetry} variant="secondary">
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {state.status === 'waiting' ? (
        <Countdown
          now={now}
          onReleaseDue={onReleaseDue}
          releaseAt={state.releaseAt}
        />
      ) : null}

      {state.status === 'revealed' ? <Revealed reveal={state.reveal} /> : null}
    </section>
  )
}
