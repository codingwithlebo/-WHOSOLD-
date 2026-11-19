import Card from '../../components/ui/Card'
import { ButtonLink } from '../../components/ui/Button'
import { formatRand } from '../../lib/money'

export type RoundOutcome = 'intact' | 'doubled' | 'lost'

export interface ResolvedRoundSummary {
  id: string
  resolvedAt: string
  outcome: RoundOutcome
  startingFundCents: number
  finalFundCents: number
}

export type RoundHistoryState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; rounds: ResolvedRoundSummary[] }

interface RoundHistoryPageProps {
  groupName: string | null
  state: RoundHistoryState
}

const outcomeLabels: Record<RoundOutcome, string> = {
  intact: 'Intact',
  doubled: 'Grown',
  lost: 'Lost',
}

function formatResolvedAt(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(
    new Date(value),
  )
}

export default function RoundHistoryPage({
  groupName,
  state,
}: RoundHistoryPageProps) {
  const heading = groupName ? `Round history — ${groupName}` : 'Round history'

  return (
    <section
      aria-labelledby="history-heading"
      className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6"
    >
      <ButtonLink className="mb-6" to="/dashboard" variant="ghost">
        Back to dashboard
      </ButtonLink>
      <header>
        <p className="eyebrow">YOUR CREW</p>
        <h1 className="dashboard-title" id="history-heading">
          {heading}
        </h1>
        <p className="mt-2 text-on-surface-muted">
          Past rounds and their final outcomes.
        </p>
      </header>

      {state.status === 'loading' ? (
        <p className="mt-6 text-on-surface-muted" role="status">
          Loading round history…
        </p>
      ) : null}

      {state.status === 'unavailable' ? (
        <Card className="mt-6 p-6">
          <p className="text-on-surface-muted" role="status">
            Round history is not connected yet. No history has been loaded.
          </p>
        </Card>
      ) : null}

      {state.status === 'error' ? (
        <p className="form-error mt-6" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === 'loaded' && state.rounds.length === 0 ? (
        <p className="mt-6 text-on-surface-muted">
          No resolved rounds for this group yet.
        </p>
      ) : null}

      {state.status === 'loaded' && state.rounds.length > 0 ? (
        <ul
          aria-label="Resolved rounds"
          className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2"
        >
          {state.rounds.map((round) => (
            <li key={round.id}>
              <Card className="h-full p-5">
                <article aria-labelledby={`round-${round.id}-date`}>
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <h2
                      className="text-lg font-bold"
                      id={`round-${round.id}-date`}
                    >
                      <time dateTime={round.resolvedAt}>
                        {formatResolvedAt(round.resolvedAt)}
                      </time>
                    </h2>
                    <span className="rounded-full border border-[#e59a6e]/50 px-3 py-1 text-sm font-semibold">
                      {outcomeLabels[round.outcome]}
                    </span>
                  </header>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-on-surface-muted">
                        Starting virtual fund
                      </dt>
                      <dd className="mt-1 font-semibold">
                        {formatRand(round.startingFundCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-muted">
                        Final virtual fund
                      </dt>
                      <dd className="mt-1 font-semibold">
                        {formatRand(round.finalFundCents)}
                      </dd>
                    </div>
                  </dl>
                </article>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
