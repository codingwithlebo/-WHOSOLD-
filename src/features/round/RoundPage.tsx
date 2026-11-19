import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { formatRand } from '../../lib/money'
import { formatCountdown, formatSastDateTime } from './roundTime'
import type { RoundChoice } from './roundTypes'

interface RoundPageProps {
  groupName: string
  startingFundCents: number
  opensAt: string
  closesAt: string
  releaseAt: string
  answeredCount: number
  memberCount: number
  myChoice: RoundChoice | null
  onSubmitChoice: (choice: RoundChoice) => Promise<void>
}

function choiceCopy(choice: RoundChoice) {
  return choice === 'pass'
    ? {
        title: 'Confirm Pass?',
        body: "You will skip the quiz. This choice is final. Other members' quiz results can still affect the group's fund.",
        confirm: 'Confirm Pass',
      }
    : {
        title: 'Confirm Double?',
        body: "You will take one timed quiz. Score at least 4 out of 5 and the group's virtual fund doubles once; a lower score or an unfinished quiz means the group loses its fund. This choice is final, and your result stays hidden until release.",
        confirm: 'Confirm Double',
      }
}

export default function RoundPage({
  groupName,
  startingFundCents,
  opensAt,
  closesAt,
  releaseAt,
  answeredCount,
  memberCount,
  myChoice,
  onSubmitChoice,
}: RoundPageProps) {
  const [now, setNow] = useState(0)
  const [confirmation, setConfirmation] = useState<RoundChoice | null>(null)
  const [submittedChoice, setSubmittedChoice] = useState<RoundChoice | null>(
    null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const opensAtMs = Date.parse(opensAt)
  const closesAtMs = Date.parse(closesAt)
  const releaseAtMs = Date.parse(releaseAt)
  const scheduleValid =
    Number.isFinite(opensAtMs) &&
    Number.isFinite(closesAtMs) &&
    Number.isFinite(releaseAtMs) &&
    opensAtMs < closesAtMs &&
    closesAtMs <= releaseAtMs
  const windowNotOpen = scheduleValid && now < opensAtMs
  const windowClosed = !scheduleValid || now >= closesAtMs
  const isOpen = !windowNotOpen && !windowClosed
  const currentChoice = myChoice ?? submittedChoice

  useEffect(() => {
    const updateTime = () => setNow(Date.now())
    updateTime()
    const intervalId = window.setInterval(updateTime, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (confirmation) {
      dialogRef.current
        ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
        ?.focus()
    }
  }, [confirmation])

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setConfirmation(null)
      return
    }

    if (event.key !== 'Tab') return

    const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>(
      'button:not(:disabled)',
    )
    if (!buttons?.length) return

    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  async function confirmChoice() {
    if (!confirmation) return
    if (!isOpen) {
      setConfirmation(null)
      setError('The choice window is closed.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmitChoice(confirmation)
      setSubmittedChoice(confirmation)
      setConfirmation(null)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not submit your choice. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-2xl flex-1 content-start gap-5 px-4 py-8 sm:px-6">
      <header>
        <p className="eyebrow">YOUR CREW · PRIVATE ROUND</p>
        <h1 className="dashboard-title">Double or Pass?</h1>
        <p className="mt-2 text-on-surface-muted">{groupName}</p>
      </header>

      <Card className="p-5 sm:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-on-surface-muted">
          Virtual fund at stake
        </p>
        <p className="mt-1 text-3xl font-black">
          {formatRand(startingFundCents)}
        </p>
        <p className="mt-4 leading-relaxed">
          Your choice is private. Your group can see how many members have
          responded, but not who chose what. Choices and quiz results stay
          hidden until the scheduled release time.
        </p>
      </Card>

      <Card className="grid gap-4 p-5 sm:p-6">
        {!scheduleValid ? (
          <p className="form-error" role="alert">
            This round schedule is unavailable. Please contact your group
            leader.
          </p>
        ) : windowNotOpen ? (
          <p className="text-on-surface-muted" role="status">
            Choice window opens {formatSastDateTime(opensAt)}.
          </p>
        ) : windowClosed ? (
          <p className="text-on-surface-muted" role="status">
            The choice window is closed. Members who did not respond are treated
            as Pass.
          </p>
        ) : (
          <>
            <p
              aria-label={`Choice window closes in ${formatCountdown(closesAtMs - now)}`}
              aria-live="off"
              className="font-semibold"
              role="timer"
            >
              Closes in {formatCountdown(closesAtMs - now)}
            </p>
            <p className="text-on-surface-muted">
              {answeredCount} of {memberCount} have answered.
            </p>
          </>
        )}

        {currentChoice ? (
          <div aria-live="polite" className="notice">
            <h2 className="font-bold">Choice submitted</h2>
            <p className="mt-1">
              You chose{' '}
              <strong>{currentChoice === 'pass' ? 'Pass' : 'Double'}</strong>.
              You cannot change this choice. Your group can see the response
              count, but not your choice. Results are revealed on{' '}
              {formatSastDateTime(releaseAt)} SAST.
            </p>
          </div>
        ) : null}

        {!currentChoice && isOpen ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e59a6e]/40 bg-white/70 p-4">
              <h2 className="text-lg font-extrabold">Pass</h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-muted">
                Skip the quiz. Your choice will not put the fund at risk. Other
                members&apos; choices can still affect the group&apos;s outcome.
              </p>
              <Button
                className="mt-4 w-full"
                onClick={() => setConfirmation('pass')}
                variant="secondary"
              >
                Choose Pass
              </Button>
            </div>
            <div className="rounded-2xl border border-[#e59a6e]/40 bg-white/70 p-4">
              <h2 className="text-lg font-extrabold">Double</h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-muted">
                Take one quiz of 5 questions, with 20 seconds per question.
                Score at least 4 correct and the group&apos;s virtual fund
                doubles once. Score 3 or fewer, or leave the quiz unfinished,
                and the group loses its fund. Your quiz result stays hidden
                until release.
              </p>
              <Button
                className="mt-4 w-full"
                onClick={() => setConfirmation('double')}
                variant="primary"
              >
                Choose Double
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        {confirmation ? (
          <div
            aria-labelledby={`${confirmation}-confirmation-title`}
            aria-modal="true"
            className="grid gap-3 rounded-2xl border-2 border-[#a879e8]/50 bg-white p-5 shadow-lg"
            onKeyDown={handleDialogKeyDown}
            ref={dialogRef}
            role="dialog"
          >
            <h2
              className="text-lg font-extrabold"
              id={`${confirmation}-confirmation-title`}
            >
              {choiceCopy(confirmation).title}
            </h2>
            <p className="leading-relaxed text-on-surface-muted">
              {choiceCopy(confirmation).body}
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                disabled={submitting}
                onClick={() => setConfirmation(null)}
                variant="ghost"
              >
                Go back
              </Button>
              <Button
                disabled={submitting}
                onClick={() => void confirmChoice()}
                variant={confirmation === 'pass' ? 'secondary' : 'primary'}
              >
                {submitting ? 'Submitting…' : choiceCopy(confirmation).confirm}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </main>
  )
}
