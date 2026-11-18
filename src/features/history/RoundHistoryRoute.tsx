import { useLocation } from 'react-router-dom'
import RoundHistoryPage from './RoundHistoryPage'

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

export default function RoundHistoryRoute() {
  const location = useLocation()

  return (
    <RoundHistoryPage
      groupName={getGroupName(location.state)}
      state={{ status: 'unavailable' }}
    />
  )
}
