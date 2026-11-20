import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import {
  answerQuestion,
  getGroupRound,
  getQuizState,
  startQuiz,
  type GroupRound,
  type QuizState,
} from './roundService'

interface QuizQuestionProps {
  state: QuizState
  onAnswer: (questionId: string, choice: number | null) => Promise<void>
}

function QuizQuestion({ state, onAnswer }: QuizQuestionProps) {
  const [secondsLeft, setSecondsLeft] = useState(state.secondsLeft)
  const [submitting, setSubmitting] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const submit = useCallback(
    async (choice: number | null) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)
      setPendingChoice(choice)
      setError(null)
      try {
        if (!state.questionId)
          throw new Error('Your quiz question is unavailable.')
        await onAnswer(state.questionId, choice)
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Your answer could not be submitted. Please retry.',
        )
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [onAnswer, state.questionId],
  )

  useEffect(() => {
    const deadline = Date.now() + state.secondsLeft * 1000
    let timeoutSent = false
    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0 && !timeoutSent) {
        timeoutSent = true
        void submit(null)
      }
    }, 200)

    return () => window.clearInterval(intervalId)
  }, [state.questionId, state.secondsLeft, submit])

  if (!state.prompt || !state.options || !state.attemptId) {
    return (
      <p className="form-error" role="alert">
        The current question is unavailable. Return to the round and retry.
      </p>
    )
  }

  return (
    <section aria-labelledby="quiz-question" className="grid gap-5">
      <header>
        <p className="eyebrow">
          QUESTION {state.questionIndex} OF {state.total}
        </p>
        <h1 className="dashboard-title" id="quiz-question">
          {state.prompt}
        </h1>
      </header>
      <p aria-live="off" className="font-semibold" role="timer">
        {secondsLeft} seconds remaining
      </p>
      <div className="grid gap-3">
        {state.options.map((option, index) => (
          <Button
            className="justify-start"
            disabled={submitting || Boolean(error)}
            key={`${state.questionId}-${option}`}
            onClick={() => void submit(index)}
            variant="secondary"
          >
            {option}
          </Button>
        ))}
      </div>
      {submitting ? <p role="status">Submitting your answer…</p> : null}
      {error ? (
        <div>
          <p className="form-error" role="alert">
            {error}
          </p>
          <Button
            className="mt-3"
            onClick={() => void submit(pendingChoice)}
            variant="secondary"
          >
            Retry answer
          </Button>
        </div>
      ) : null}
    </section>
  )
}

export default function QuizRoute() {
  const { groupId } = useParams<{ groupId: string }>()
  const [round, setRound] = useState<GroupRound | null>(null)
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQuiz = useCallback(async () => {
    try {
      if (!groupId) {
        await Promise.resolve()
        throw new Error('This group could not be found.')
      }

      const currentRound = await getGroupRound(groupId)
      if (!currentRound) throw new Error('No round has been scheduled.')
      if (currentRound.myChoice !== 'double') {
        throw new Error(
          'Choose Double on the round page before taking the quiz.',
        )
      }
      setRound(currentRound)
      setQuiz(await getQuizState(currentRound.id))
      setError(null)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not load your quiz. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadQuiz(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadQuiz])

  async function handleStartQuiz() {
    if (!round) return
    setStarting(true)
    setError(null)
    try {
      setQuiz(await startQuiz(round.id))
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The quiz could not be started. Please try again.',
      )
    } finally {
      setStarting(false)
    }
  }

  const attemptId = quiz?.attemptId
  const handleAnswer = useCallback(
    async (questionId: string, choice: number | null) => {
      if (!attemptId) throw new Error('Your quiz attempt is unavailable.')
      setQuiz(await answerQuestion(attemptId, questionId, choice))
    },
    [attemptId],
  )

  if (loading) {
    return (
      <main className="grid flex-1 place-items-center" role="status">
        Loading your quiz…
      </main>
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-2xl flex-1 content-start gap-5 px-4 py-8 sm:px-6">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {groupId ? (
        <Link
          className="font-semibold underline"
          to={`/groups/${groupId}/round`}
        >
          Back to round
        </Link>
      ) : null}
      {!quiz ? (
        <Button onClick={() => void loadQuiz()} variant="secondary">
          Retry
        </Button>
      ) : quiz.status === 'not_started' ? (
        <section className="grid gap-4">
          <header>
            <p className="eyebrow">DOUBLE QUIZ</p>
            <h1 className="dashboard-title">Ready to double?</h1>
            <p className="mt-2 text-on-surface-muted">
              Answer five questions, with 20 seconds for each. Score at least
              four correct to double the group fund. Your score stays private
              until the results release.
            </p>
          </header>
          <Button
            disabled={starting}
            onClick={() => void handleStartQuiz()}
            variant="primary"
          >
            {starting ? 'Starting quiz…' : 'Start quiz'}
          </Button>
        </section>
      ) : quiz.status === 'finished' ? (
        <section className="grid gap-3">
          <h1 className="dashboard-title">Quiz submitted</h1>
          <p className="text-on-surface-muted">
            Your score is hidden until the scheduled results release.
          </p>
        </section>
      ) : (
        <QuizQuestion
          key={quiz.questionId}
          onAnswer={handleAnswer}
          state={quiz}
        />
      )}
    </main>
  )
}
