import { getSupabaseClient, toError } from '../../lib/supabase'
import type { Database, Json } from '../../lib/database.types'
import type { RoundChoice, RoundSchedule } from './roundTypes'

type RoundRow =
  Database['public']['Functions']['get_group_round']['Returns'][number]
type QuizRow =
  Database['public']['Functions']['get_quiz_state']['Returns'][number]

export type RoundStatus = 'open' | 'closed' | 'resolved'
export type RoundOutcome = 'intact' | 'doubled' | 'lost'
export type MemberRoundResult =
  'passed' | 'doubled_and_won' | 'doubled_and_lost'

export interface GroupRound {
  id: string
  groupId: string
  groupName: string
  startingFundCents: number
  opensAt: string
  closesAt: string
  releaseAt: string
  status: RoundStatus
  answeredCount: number
  memberCount: number
  myChoice: RoundChoice | null
}

export interface QuizState {
  status: 'not_started' | 'in_progress' | 'finished'
  attemptId: string | null
  questionId: string | null
  questionIndex: number
  total: number
  prompt: string | null
  options: string[] | null
  secondsLeft: number
}

export interface RevealMember {
  displayName: string
  result: MemberRoundResult
}

export interface RoundReveal {
  outcome: RoundOutcome
  startingFundCents: number
  finalFundCents: number
  releaseAt: string
  members: RevealMember[]
}

function mapRound(row: RoundRow): GroupRound {
  if (!['open', 'closed', 'resolved'].includes(row.status)) {
    throw new Error('The round status is invalid.')
  }
  if (
    row.my_choice !== null &&
    row.my_choice !== 'pass' &&
    row.my_choice !== 'double'
  ) {
    throw new Error('Your saved choice is invalid.')
  }

  return {
    id: row.round_id,
    groupId: row.group_id,
    groupName: row.group_name,
    startingFundCents: row.starting_fund_cents,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    releaseAt: row.release_at,
    status: row.status as RoundStatus,
    answeredCount: row.answered_count,
    memberCount: row.member_count,
    myChoice: row.my_choice,
  }
}

function mapQuizState(row: QuizRow): QuizState {
  if (!['not_started', 'in_progress', 'finished'].includes(row.status)) {
    throw new Error('The quiz status is invalid.')
  }

  return {
    status: row.status as QuizState['status'],
    attemptId: row.attempt_id,
    questionId: row.question_id,
    questionIndex: row.question_index,
    total: row.total,
    prompt: row.prompt,
    options: row.options,
    secondsLeft: row.seconds_left,
  }
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mapMembers(value: Json): RevealMember[] {
  if (!Array.isArray(value)) {
    throw new Error('The released member results are invalid.')
  }

  return value.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error('The released member results are invalid.')
    }

    const displayName = entry.display_name
    const result = entry.result
    if (
      typeof displayName !== 'string' ||
      typeof result !== 'string' ||
      !['passed', 'doubled_and_won', 'doubled_and_lost'].includes(result)
    ) {
      throw new Error('The released member results are invalid.')
    }

    return {
      displayName,
      result: result as MemberRoundResult,
    }
  })
}

export async function getGroupRound(
  groupId: string,
): Promise<GroupRound | null> {
  const { data, error } = await getSupabaseClient().rpc('get_group_round', {
    target_group_id: groupId,
  })
  if (error) throw toError(error)
  const row = data[0]
  return row ? mapRound(row) : null
}

export async function getRoundStatus(roundId: string): Promise<GroupRound> {
  const { data, error } = await getSupabaseClient().rpc('get_round_status', {
    target_round_id: roundId,
  })
  if (error) throw toError(error)
  const row = data[0]
  if (!row) throw new Error('This round could not be found.')
  return mapRound(row)
}

export async function startRound(
  groupId: string,
  schedule: RoundSchedule,
): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('start_round', {
    target_group_id: groupId,
    opens_at: schedule.opensAt,
    closes_at: schedule.closesAt,
    release_at: schedule.releaseAt,
  })
  if (error) throw toError(error)
  return data
}

export async function submitChoice(
  roundId: string,
  choice: RoundChoice,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc('submit_choice', {
    target_round_id: roundId,
    selected_choice: choice,
  })
  if (error) throw toError(error)
}

export async function getQuizState(roundId: string): Promise<QuizState> {
  const { data, error } = await getSupabaseClient().rpc('get_quiz_state', {
    target_round_id: roundId,
  })
  if (error) throw toError(error)
  const row = data[0]
  if (!row) throw new Error('The quiz state could not be loaded.')
  return mapQuizState(row)
}

export async function startQuiz(roundId: string): Promise<QuizState> {
  const { data, error } = await getSupabaseClient().rpc('start_quiz', {
    target_round_id: roundId,
  })
  if (error) throw toError(error)
  const row = data[0]
  if (!row) throw new Error('The quiz could not be started.')
  return mapQuizState(row)
}

export async function answerQuestion(
  attemptId: string,
  questionId: string,
  chosenIndex: number | null,
): Promise<QuizState> {
  const { data, error } = await getSupabaseClient().rpc('answer_question', {
    target_attempt_id: attemptId,
    expected_question_id: questionId,
    chosen_index: chosenIndex,
  })
  if (error) throw toError(error)
  const row = data[0]
  if (!row) throw new Error('The quiz could not be updated.')
  return mapQuizState(row)
}

export async function getReveal(roundId: string): Promise<RoundReveal> {
  const { data, error } = await getSupabaseClient().rpc('get_reveal', {
    target_round_id: roundId,
  })
  if (error) throw toError(error)
  const row = data[0]
  if (!row) throw new Error('The round results are unavailable.')
  if (!['intact', 'doubled', 'lost'].includes(row.outcome)) {
    throw new Error('The round outcome is invalid.')
  }

  return {
    outcome: row.outcome as RoundOutcome,
    startingFundCents: row.starting_fund_cents,
    finalFundCents: row.final_fund_cents,
    releaseAt: row.released_at,
    members: mapMembers(row.members),
  }
}
