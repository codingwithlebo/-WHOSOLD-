import { useLocation } from 'react-router-dom'
import RevealPage from './RevealPage'

function getGroupName(state: unknown): string | null {
  if (
    typeof state === 'object' &&
    state !== null &&
    'groupName' in state &&
    typeof state.groupName === 'string'
  ) {
    return state.groupName
  }

  return null
}

/**
 * Stays "not connected" until Mandla ships `get_reveal` (see
 * docs/contracts/get-reveal.md). It is deliberately not registered in the
 * router yet, so production never serves sample results. Integration swaps
 * the fixed state for `loadReveal(roundId, (args) => supabase.rpc('get_reveal', args))`.
 */
export default function RevealRoute() {
  const location = useLocation()

  return (
    <RevealPage
      groupName={getGroupName(location.state)}
      state={{ status: 'unavailable' }}
    />
  )
}
