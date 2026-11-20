import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import QuizRoute from './QuizRoute'

const roundService = vi.hoisted(() => ({
  answerQuestion: vi.fn(),
  getGroupRound: vi.fn(),
  getQuizState: vi.fn(),
  startQuiz: vi.fn(),
}))

vi.mock('./roundService', () => roundService)

describe('QuizRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    roundService.getGroupRound.mockResolvedValue({
      id: 'round-1',
      groupId: 'group-1',
      groupName: 'Crew',
      startingFundCents: 5000,
      opensAt: '2026-11-20T08:00:00.000Z',
      closesAt: '2026-11-20T10:00:00.000Z',
      releaseAt: '2026-11-20T10:00:00.000Z',
      status: 'open',
      answeredCount: 1,
      memberCount: 2,
      myChoice: 'double',
    })
    roundService.getQuizState.mockResolvedValue({
      status: 'in_progress',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      questionIndex: 1,
      total: 5,
      prompt: 'Question one?',
      options: ['A', 'B', 'C', 'D'],
      secondsLeft: 20,
    })
    roundService.answerQuestion.mockReturnValue(new Promise(() => undefined))
  })

  it('keeps the active question deadline while an answer is submitting', async () => {
    renderWithProviders(
      <Routes>
        <Route element={<QuizRoute />} path="/groups/:groupId/round/quiz" />
      </Routes>,
      { route: '/groups/group-1/round/quiz' },
    )

    expect(await screen.findByText('Question one?')).toBeInTheDocument()

    await new Promise((resolve) => window.setTimeout(resolve, 2200))
    expect(screen.getByRole('timer')).not.toHaveTextContent(
      '20 seconds remaining',
    )

    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(roundService.answerQuestion).toHaveBeenCalledWith(
      'attempt-1',
      'question-1',
      0,
    )
    await new Promise((resolve) => window.setTimeout(resolve, 250))
    expect(screen.getByRole('timer')).not.toHaveTextContent(
      '20 seconds remaining',
    )
  }, 10_000)
})
