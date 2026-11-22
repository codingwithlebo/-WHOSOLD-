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

  it('starts the quiz from the rules screen', async () => {
    roundService.getQuizState.mockResolvedValueOnce({ status: 'not_started' })
    roundService.startQuiz.mockResolvedValueOnce({
      status: 'in_progress',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      questionIndex: 1,
      total: 5,
      prompt: 'Question one?',
      options: ['A', 'B', 'C', 'D'],
      secondsLeft: 20,
    })

    renderWithProviders(
      <Routes>
        <Route element={<QuizRoute />} path="/groups/:groupId/round/quiz" />
      </Routes>,
      { route: '/groups/group-1/round/quiz' },
    )

    expect(await screen.findByText(/20 seconds for each/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Start quiz' }))

    expect(roundService.startQuiz).toHaveBeenCalledWith('round-1')
    expect(await screen.findByText('Question one?')).toBeInTheDocument()
  })

  it('resumes with the server-provided time remaining', async () => {
    roundService.getQuizState.mockResolvedValueOnce({
      status: 'in_progress',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      questionIndex: 2,
      total: 5,
      prompt: 'Question two?',
      options: ['A', 'B', 'C', 'D'],
      secondsLeft: 8,
    })

    renderWithProviders(
      <Routes>
        <Route element={<QuizRoute />} path="/groups/:groupId/round/quiz" />
      </Routes>,
      { route: '/groups/group-1/round/quiz' },
    )

    expect(await screen.findByText('Question two?')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('8 seconds remaining')
  })

  it('announces countdown milestones without announcing every second', async () => {
    roundService.getQuizState.mockResolvedValueOnce({
      status: 'in_progress',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      questionIndex: 1,
      total: 5,
      prompt: 'Question one?',
      options: ['A', 'B', 'C', 'D'],
      secondsLeft: 10,
    })

    renderWithProviders(
      <Routes>
        <Route element={<QuizRoute />} path="/groups/:groupId/round/quiz" />
      </Routes>,
      { route: '/groups/group-1/round/quiz' },
    )

    expect(await screen.findByRole('timer')).toHaveAttribute('aria-live', 'off')
    const announcement = await screen.findByRole('status')
    expect(announcement).toHaveAttribute('aria-live', 'polite')
    expect(announcement).toHaveTextContent('10 seconds remaining')
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    expect(announcement).toHaveTextContent('10 seconds remaining')
  })

  it('submits one answer and disables the answer buttons while pending', async () => {
    renderWithProviders(
      <Routes>
        <Route element={<QuizRoute />} path="/groups/:groupId/round/quiz" />
      </Routes>,
      { route: '/groups/group-1/round/quiz' },
    )

    await screen.findByText('Question one?')
    const answer = screen.getByRole('button', { name: 'B' })
    fireEvent.click(answer)
    fireEvent.click(answer)

    expect(roundService.answerQuestion).toHaveBeenCalledTimes(1)
    expect(roundService.answerQuestion).toHaveBeenCalledWith(
      'attempt-1',
      'question-1',
      1,
    )
    screen
      .getAllByRole('button', { name: /^[A-D]$/ })
      .forEach((button) => expect(button).toBeDisabled())
  })

  it('submits an empty answer when the server-provided timer expires', async () => {
    roundService.getQuizState.mockResolvedValueOnce({
      status: 'in_progress',
      attemptId: 'attempt-1',
      questionId: 'question-1',
      questionIndex: 1,
      total: 5,
      prompt: 'Question one?',
      options: ['A', 'B', 'C', 'D'],
      secondsLeft: 1,
    })

    renderWithProviders(
      <Routes>
        <Route element={<QuizRoute />} path="/groups/:groupId/round/quiz" />
      </Routes>,
      { route: '/groups/group-1/round/quiz' },
    )

    await screen.findByText('Question one?')
    await new Promise((resolve) => window.setTimeout(resolve, 1250))

    expect(roundService.answerQuestion).toHaveBeenCalledWith(
      'attempt-1',
      'question-1',
      null,
    )
  })

  it('announces quiz completion without showing the score', async () => {
    roundService.getQuizState.mockResolvedValueOnce({ status: 'finished' })

    renderWithProviders(
      <Routes>
        <Route element={<QuizRoute />} path="/groups/:groupId/round/quiz" />
      </Routes>,
      { route: '/groups/group-1/round/quiz' },
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Quiz complete — results on release day',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^[A-D]$/ })).toBeNull()
    expect(screen.queryByText(/score|correct|incorrect/i)).toBeNull()
  })
})
