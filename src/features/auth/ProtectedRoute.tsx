import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center" role="status">
        <span className="loader" aria-hidden="true" />
        <span className="sr-only">Loading your session…</span>
      </div>
    )
  }

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return <Outlet />
}
