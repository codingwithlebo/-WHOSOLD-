import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import RoundPage from './RoundPage'

function makeProps() {
  return {
    groupName: 'Wednesday crew',
    startingFundCents: 2749900,
    opensAt: new Date(Date.now() - 60_000).toISOString(),
    closesAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    releaseAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    answeredCount: 3,
    memberCount: 5,
    myChoice: null as 'pass' | 'double' | null,
    onSubmitChoice: vi.fn().mockResolvedValue(undefined),
  }
}

describe('RoundPage', () => {
  it('requires confirmation before submitting a private choice', async () => {
    const user = userEvent.setup()
    const props = makeProps()

    renderWithProviders(<RoundPage {...props} />)

    expect(screen.getByText('3 of 5 have answered.')).toBeInTheDocument()
    expect(
      screen.queryByText(/chose pass|chose double/i),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose Double' }))
    expect(
      screen.getByRole('dialog', { name: 'Confirm Double?' }),
    ).toBeInTheDocument()
    expect(props.onSubmitChoice).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Go back' }))
    expect(props.onSubmitChoice).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Choose Pass' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Pass' }))
    expect(props.onSubmitChoice).toHaveBeenCalledExactlyOnceWith('pass')
  })

  it('shows only the current member choice after submission', () => {
    const props = { ...makeProps(), myChoice: 'double' as const }

    renderWithProviders(<RoundPage {...props} />)

    expect(screen.getByText('Double')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Choose Pass' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Choose Double' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('3 of 5 have answered.')).toBeInTheDocument()
  })

  it('does not allow a choice before the scheduled window opens', () => {
    const props = makeProps()
    props.opensAt = new Date(Date.now() + 60_000).toISOString()

    renderWithProviders(<RoundPage {...props} />)

    expect(screen.getByRole('status')).toHaveTextContent(/choice window opens/i)
    expect(
      screen.queryByRole('button', { name: 'Choose Double' }),
    ).not.toBeInTheDocument()
  })

  it('does not allow a choice after the scheduled window closes', () => {
    const props = makeProps()
    props.closesAt = new Date(Date.now() - 60_000).toISOString()

    renderWithProviders(<RoundPage {...props} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      /choice window is closed/i,
    )
    expect(
      screen.queryByRole('button', { name: 'Choose Pass' }),
    ).not.toBeInTheDocument()
  })

  it('keeps choices unavailable when the schedule is invalid', () => {
    const props = makeProps()
    props.opensAt = 'not-a-date'

    renderWithProviders(<RoundPage {...props} />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This round schedule is unavailable.',
    )
    expect(
      screen.queryByRole('button', { name: 'Choose Pass' }),
    ).not.toBeInTheDocument()
  })

  it('locks the selected choice locally after a successful submission', async () => {
    const user = userEvent.setup()
    const props = makeProps()

    renderWithProviders(<RoundPage {...props} />)

    await user.click(screen.getByRole('button', { name: 'Choose Double' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Double' }))

    expect(await screen.findByText('Choice submitted')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Choose Pass' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Choose Double' }),
    ).not.toBeInTheDocument()
  })

  it('shows a service error without falsely locking the choice', async () => {
    const user = userEvent.setup()
    const props = makeProps()
    props.onSubmitChoice.mockRejectedValue(
      new Error('Choice service is unavailable.'),
    )

    renderWithProviders(<RoundPage {...props} />)

    await user.click(screen.getByRole('button', { name: 'Choose Pass' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Pass' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choice service is unavailable.',
    )
    expect(screen.getByRole('button', { name: 'Choose Pass' })).toBeEnabled()
    expect(screen.queryByText('Choice submitted')).not.toBeInTheDocument()
  })
})
