import { Link, Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main className="page-shell flex min-h-screen flex-col">
      <header className="site-header">
        <Link aria-label="WHOSOLD? home" className="wordmark" to="/">
          WHO<span>SOLD?</span>
        </Link>
        <span className="status-pill">A group game</span>
      </header>

      <section aria-labelledby="welcome-heading" className="welcome">
        <p className="eyebrow">YOUR GROUP. YOUR CALL.</p>
        <h1 id="welcome-heading">
          Would you risk it
          <br />
          <span>for everyone?</span>
        </h1>
        <p className="welcome-copy">
          Build a wishlist with your friends. When the moment comes, choose to
          double the group fund — or pass. One quiz, one group, everything on
          the line.
        </p>
        <div className="game-card">
          <div className="game-card-icon" aria-hidden="true">
            ?
          </div>
          <div>
            <p className="game-card-title">The game is getting ready</p>
            <p className="game-card-copy">
              Sign-in and group creation are coming soon.
            </p>
          </div>
        </div>
        <p className="virtual-note">Virtual funds only. Just a game.</p>
      </section>

      <footer className="site-footer">
        <span>WHOSOLD?</span>
        <span>Trust your crew. Trust yourself.</span>
      </footer>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="page-shell flex min-h-screen flex-col">
      <section aria-labelledby="not-found-heading" className="welcome">
        <p className="eyebrow">WRONG TURN</p>
        <h1 id="not-found-heading">This page isn’t in the game.</h1>
        <Link className="home-link" to="/">
          Back to home
        </Link>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}
