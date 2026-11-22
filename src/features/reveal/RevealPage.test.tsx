import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import RevealPage from './RevealPage'
import RevealRoute from './RevealRoute'
import type { RevealOutcome, RevealState, RoundReveal } from './revealTypes'

function reveal(
  outcome: RevealOutcome,
  startingFundCents: number,
  finalFundCents: number,
): RoundReveal {
  return {
    roundId: 'round-1',
    outcome,
    startingFundCents,
    finalFundCents,
    releasedAt: '2026-11-20T16:00:00.000Z',
    members: [
      { userId: 'u-1', displayName: 'Alice', result: 'doubled_won' },
      { userId: 'u-2', displayName: 'Bob', result: 'passed' },
    ],
  }
}

function renderReveal(
  state: RevealState,
  extra: Partial<Parameters<typeof RevealPage>[0]> = {},
) {
  return renderWithProviders(
    <RevealPage groupName="The Wednesday crew" state={state} {...extra} />,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('RevealPage', () => {
  it.each([
    ['intact', 'Intact', 5_000_000, 5_000_000, 'R50 000.00', 'R50 000.00'],
    ['doubled', 'Grown', 5_000_000, 10_000_000, 'R50 000.00', 'R100 000.00'],
    ['lost', 'Lost', 5_000_000, 0, 'R50 000.00', 'R0.00'],
  ] as const)(
    'renders the %s outcome with fund before and after',
    (outcome, label, start, end, startText, endText) => {
      renderReveal({ status: 'revealed', reveal: reveal(outcome, start, end) })

      expect(
        screen.getByRole('heading', { level: 2, name: label }),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Virtual fund before').nextSibling,
      ).toHaveTextContent(startText)
      expect(
        screen.getByText('Virtual fund after').nextSibling,
      ).toHaveTextContent(endText)
    },
  )

  it('shows the named breakdown after release', () => {
    renderReveal({
      status: 'revealed',
      reveal: reveal('doubled', 100, 200),
    })

    const list = screen.getByRole('list', { name: 'Who did what' })
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('AliceDoubled and won')
    expect(items[1]).toHaveTextContent('BobPassed')
  })

  it('always states that funds are virtual', () => {
    renderReveal({ status: 'loading' })
    expect(screen.getByText(/Virtual funds — this is a game/)).toBeVisible()
  })

  it('shows only a countdown before release, with no outcome or members', () => {
    const now = () => Date.parse('2026-11-20T15:00:00.000Z')
    renderReveal(
      { status: 'waiting', releaseAt: '2026-11-20T16:00:00.000Z' },
      { now },
    )

    expect(screen.getByRole('timer')).toHaveTextContent('1h 00m 00s')
    expect(screen.getByText(/20 Nov 2026/)).toBeInTheDocument()
    expect(screen.queryByText(/Grown|Intact|Lost/)).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('ticks down and asks for a refetch when release time arrives', () => {
    vi.useFakeTimers()
    let current = Date.parse('2026-11-20T15:59:58.000Z')
    const onReleaseDue = vi.fn()
    renderReveal(
      { status: 'waiting', releaseAt: '2026-11-20T16:00:00.000Z' },
      { now: () => current, onReleaseDue },
    )
    expect(screen.getByRole('timer')).toHaveTextContent('0m 02s')

    act(() => {
      current += 1000
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('0m 01s')
    expect(onReleaseDue).not.toHaveBeenCalled()

    act(() => {
      current += 1000
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('Releasing now…')
    expect(onReleaseDue).toHaveBeenCalledTimes(1)

    act(() => {
      current += 5000
      vi.advanceTimersByTime(5000)
    })
    expect(onReleaseDue).toHaveBeenCalledTimes(1)
  })

  it('shows a readable error with retry', () => {
    const onRetry = vi.fn()
    renderReveal(
      { status: 'error', message: 'You are not a member of this group.' },
      { onRetry },
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You are not a member of this group.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('RevealRoute', () => {
  it('serves no results until get_reveal is connected', () => {
    renderWithProviders(<RevealRoute />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'The reveal is not connected yet.',
    )
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
