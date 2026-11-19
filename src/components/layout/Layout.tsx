import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { Button, ButtonLink } from '../ui/Button'

export default function Layout() {
  const { session, displayName, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const outlet = useOutlet()

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      await navigate('/')
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link aria-label="WHOSOLD? home" className="wordmark" to="/">
          WHO<span>SOLD?</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-on-surface-muted sm:inline">
                {displayName ?? 'Player'}
              </span>
              <ButtonLink to="/dashboard" variant="ghost">
                Dashboard
              </ButtonLink>
              <Button onClick={() => void handleSignOut()} variant="secondary">
                Log out
              </Button>
            </>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost">
                Log in
              </ButtonLink>
              <ButtonLink to="/signup" variant="primary">
                Start a group
              </ButtonLink>
            </>
          )}
        </nav>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col"
          exit={{ opacity: 0, y: -12 }}
          id="main"
          initial={{ opacity: 0, y: 12 }}
          key={location.pathname}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>

      <footer className="site-footer">
        <span>WHOSOLD?</span>
        <span>Virtual funds only. Trust your crew. Trust yourself.</span>
      </footer>
    </div>
  )
}
