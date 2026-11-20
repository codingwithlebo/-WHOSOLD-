import { useId, useState, type SyntheticEvent } from 'react'
import { Button } from '../../components/ui/Button'
import type { RoundSchedule } from './roundTypes'
import { formatSastInputValue, parseSastInputValue } from './roundTime'

const MINIMUM_WINDOW_MS = 5 * 60 * 1000
const PRESETS = [
  { label: '5 minutes', durationMs: MINIMUM_WINDOW_MS },
  { label: '1 hour', durationMs: 60 * 60 * 1000 },
  { label: '24 hours', durationMs: 24 * 60 * 60 * 1000 },
] as const

type ScheduleField = keyof RoundSchedule
type PresetLabel = (typeof PRESETS)[number]['label']

interface ScheduleInputs {
  opensAt: string
  closesAt: string
  releaseAt: string
}

interface StartRoundFormProps {
  onCreateRound: (schedule: RoundSchedule) => Promise<void>
}

function nextMinute() {
  return new Date(Math.ceil(Date.now() / 60_000) * 60_000)
}

function inputsForPreset(durationMs: number): ScheduleInputs {
  const opensAt = nextMinute()
  const closesAt = new Date(opensAt.getTime() + durationMs)
  const closesAtInput = formatSastInputValue(closesAt)

  return {
    opensAt: formatSastInputValue(opensAt),
    closesAt: closesAtInput,
    releaseAt: closesAtInput,
  }
}

function toSchedule(inputs: ScheduleInputs): RoundSchedule | null {
  const opensAt = parseSastInputValue(inputs.opensAt)
  const closesAt = parseSastInputValue(inputs.closesAt)
  const releaseAt = parseSastInputValue(inputs.releaseAt)

  if (!opensAt || !closesAt || !releaseAt) return null

  return {
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    releaseAt: releaseAt.toISOString(),
  }
}

export default function StartRoundForm({ onCreateRound }: StartRoundFormProps) {
  const id = useId()
  const [inputs, setInputs] = useState(() =>
    inputsForPreset(PRESETS[2].durationMs),
  )
  const [selectedPreset, setSelectedPreset] = useState<PresetLabel | null>(
    '24 hours',
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function applyPreset(label: PresetLabel, durationMs: number) {
    setInputs(inputsForPreset(durationMs))
    setSelectedPreset(label)
    setError(null)
  }

  function updateField(field: ScheduleField, value: string) {
    setInputs((current) => ({ ...current, [field]: value }))
    setSelectedPreset(null)
    setError(null)
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    const schedule = toSchedule(inputs)
    if (!schedule) {
      setError('Enter valid opening, closing and release times in SAST.')
      return
    }

    const opensAt = Date.parse(schedule.opensAt)
    const closesAt = Date.parse(schedule.closesAt)
    const releaseAt = Date.parse(schedule.releaseAt)

    if (opensAt < Date.now()) {
      setError('The opening time cannot be in the past.')
      return
    }
    if (closesAt - opensAt < MINIMUM_WINDOW_MS) {
      setError('The choice window must be at least 5 minutes.')
      return
    }
    if (releaseAt < closesAt) {
      setError('The release time must be at or after the closing time.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onCreateRound(schedule)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not start this round. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fields: { field: ScheduleField; label: string }[] = [
    { field: 'opensAt', label: 'Opens (SAST)' },
    { field: 'closesAt', label: 'Closes (SAST)' },
    { field: 'releaseAt', label: 'Results release (SAST)' },
  ]

  return (
    <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
      <header>
        <p className="eyebrow">ROUND SETUP</p>
        <h2 className="text-xl font-extrabold">Schedule a round</h2>
        <p className="mt-1 text-on-surface-muted">
          Choose when the private choice window opens, closes and results are
          released.
        </p>
      </header>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-bold">Quick presets</legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ label, durationMs }) => (
            <Button
              aria-pressed={selectedPreset === label}
              key={label}
              onClick={() => applyPreset(label, durationMs)}
              type="button"
              variant="ghost"
            >
              {label}
            </Button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ field, label }) => (
          <div className="field" key={field}>
            <label className="field-label" htmlFor={`${id}-${field}`}>
              {label}
            </label>
            <input
              className="field-input"
              id={`${id}-${field}`}
              onChange={(event) => updateField(field, event.target.value)}
              required
              type="datetime-local"
              value={inputs[field]}
            />
          </div>
        ))}
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button disabled={submitting} type="submit" variant="primary">
        {submitting ? 'Starting round…' : 'Start round'}
      </Button>
    </form>
  )
}
