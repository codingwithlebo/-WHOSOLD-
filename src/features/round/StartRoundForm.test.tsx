import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import StartRoundForm from './StartRoundForm'
import { formatSastInputValue, parseSastInputValue } from './roundTime'
import type { RoundSchedule } from './roundTypes'

describe('StartRoundForm', () => {
  it('creates a schedule from the selected quick preset in SAST', async () => {
    const user = userEvent.setup()
    const onCreateRound = vi
      .fn<(schedule: RoundSchedule) => Promise<void>>()
      .mockResolvedValue(undefined)

    renderWithProviders(<StartRoundForm onCreateRound={onCreateRound} />)

    await user.click(screen.getByRole('button', { name: '5 minutes' }))
    await user.click(screen.getByRole('button', { name: 'Start round' }))

    expect(onCreateRound).toHaveBeenCalledOnce()
    const schedule = onCreateRound.mock.calls[0]?.[0]
    expect(schedule).toBeDefined()
    if (!schedule)
      throw new Error('Expected the round schedule to be submitted.')
    expect(Date.parse(schedule.closesAt) - Date.parse(schedule.opensAt)).toBe(
      5 * 60 * 1000,
    )
    expect(schedule.releaseAt).toBe(schedule.closesAt)
  })

  it('shows a clear error when the round service rejects the schedule', async () => {
    const user = userEvent.setup()
    const onCreateRound = vi
      .fn<(schedule: RoundSchedule) => Promise<void>>()
      .mockRejectedValue(new Error('Round setup is unavailable.'))

    renderWithProviders(<StartRoundForm onCreateRound={onCreateRound} />)

    await user.click(screen.getByRole('button', { name: 'Start round' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Round setup is unavailable.',
    )
  })

  it('rejects a choice window shorter than five minutes', async () => {
    const user = userEvent.setup()
    const onCreateRound = vi
      .fn<(schedule: RoundSchedule) => Promise<void>>()
      .mockResolvedValue(undefined)

    renderWithProviders(<StartRoundForm onCreateRound={onCreateRound} />)

    await user.click(screen.getByRole('button', { name: '5 minutes' }))
    const opensAtInput =
      screen.getByLabelText<HTMLInputElement>('Opens (SAST)').value
    const opensAt = parseSastInputValue(opensAtInput)
    if (!opensAt) throw new Error('Expected a valid SAST opening time.')
    const closeValue = formatSastInputValue(
      new Date(opensAt.getTime() + 4 * 60 * 1000),
    )

    fireEvent.change(screen.getByLabelText('Closes (SAST)'), {
      target: { value: closeValue },
    })
    fireEvent.change(screen.getByLabelText('Results release (SAST)'), {
      target: { value: closeValue },
    })
    await user.click(screen.getByRole('button', { name: 'Start round' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The choice window must be at least 5 minutes.',
    )
    expect(onCreateRound).not.toHaveBeenCalled()
  })

  it('rejects a release time before the window closes', async () => {
    const user = userEvent.setup()
    const onCreateRound = vi
      .fn<(schedule: RoundSchedule) => Promise<void>>()
      .mockResolvedValue(undefined)

    renderWithProviders(<StartRoundForm onCreateRound={onCreateRound} />)

    await user.click(screen.getByRole('button', { name: '5 minutes' }))
    const closeValue =
      screen.getByLabelText<HTMLInputElement>('Closes (SAST)').value
    const closesAt = parseSastInputValue(closeValue)
    if (!closesAt) throw new Error('Expected a valid SAST closing time.')
    const earlierReleaseValue = formatSastInputValue(
      new Date(closesAt.getTime() - 60 * 1000),
    )

    fireEvent.change(screen.getByLabelText('Results release (SAST)'), {
      target: { value: earlierReleaseValue },
    })
    await user.click(screen.getByRole('button', { name: 'Start round' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The release time must be at or after the closing time.',
    )
    expect(onCreateRound).not.toHaveBeenCalled()
  })
})
