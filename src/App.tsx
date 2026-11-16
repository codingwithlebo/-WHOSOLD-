import { MotionConfig } from 'motion/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { useAuth } from './features/auth/AuthContext'
import LoginPage from './features/auth/LoginPage'
import ProtectedRoute from './features/auth/ProtectedRoute'
import SignupPage from './features/auth/SignupPage'
import DashboardPage from './features/dashboard/DashboardPage'
import HomePage from './features/landing/HomePage'
import NotFoundPage from './pages/NotFoundPage'

/** Signed-in users skip the log-in and sign-up pages. */
function GuestOnly({ children }: { children: React.ReactElement }) {
  const { session } = useAuth()
  return session ? <Navigate replace to="/dashboard" /> : children
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route element={<Layout />}>
          <Route element={<HomePage />} index />
          <Route
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
            path="login"
          />
          <Route
            element={
              <GuestOnly>
                <SignupPage />
              </GuestOnly>
            }
            path="signup"
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardPage />} path="dashboard" />
          </Route>
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </MotionConfig>
  )
}
