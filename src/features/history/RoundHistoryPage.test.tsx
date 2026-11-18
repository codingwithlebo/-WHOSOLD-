import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import RoundHistoryPage, { type RoundHistoryState } from './RoundHistoryPage'

const resolvedRounds = [
  {
    id: 'round-1',
    resolvedAt: '2026-11-17T12:00:00.000Z',
    outcome: 'doubled',
    startingFundCents: 5000000,
    finalFundCents: 10000000,
  },
  {
    id: 'round-2',
    resolvedAt: '2026-11-16T12:00:00.000Z',
    outcome: 'lost',
    startingFundCents: 5000000,
    finalFundCents: 0,
  },
  {
    id: 'round-3',
    resolvedAt: '2026-11-15T12:00:00.000Z',
    outcome: 'intact',
    startingFundCents: 5000000,
    finalFundCents: 5000000,
  },
] satisfies Extract<RoundHistoryState, { status: 'loaded' }>['rounds']

function renderHistory(state: RoundHistoryState) {
  return renderWithProviders(
    <RoundHistoryPage groupName="The Wednesday crew" state={state} />,
  )
}

describe('RoundHistoryPage', () => {
  it('shows resolved outcomes and fund amounts', () => {
    renderHistory({ status: 'loaded', rounds: resolvedRounds })

    expect(
      screen.getByRole('heading', {
        name: 'Round history — The Wednesday crew',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Intact')).toBeInTheDocument()
    expect(screen.getByText('Grown')).toBeInTheDocument()
    expect(screen.getByText('Lost')).toBeInTheDocument()
    expect(screen.getAllByText('R50 000.00')).toHaveLength(4)
    expect(screen.getByText('R100 000.00')).toBeInTheDocument()
    expect(screen.getByText('R0.00')).toBeInTheDocument()
  })

  it('shows an empty state when no rounds have resolved', () => {
    renderHistory({ status: 'loaded', rounds: [] })

    expect(
      screen.getByText('No resolved rounds for this group yet.'),
    ).toBeInTheDocument()
  })

  it('states that history is unavailable without showing sample data', () => {
    renderHistory({ status: 'unavailable' })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Round history is not connected yet. No history has been loaded.',
    )
    expect(screen.queryByText('Grown')).not.toBeInTheDocument()
  })

  it('shows service errors explicitly', () => {
    renderHistory({
      status: 'error',
      message: 'Could not load round history. Please try again.',
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load round history. Please try again.',
    )
  })

  it('announces loading state', () => {
    renderHistory({ status: 'loading' })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading round history…',
    )
  })
})
