import { ButtonLink } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-heading" className="not-found">
      <p className="eyebrow">WRONG TURN</p>
      <h1 id="not-found-heading">This page is not in the game.</h1>
      <ButtonLink className="mt-6" to="/" variant="secondary">
        Back to home
      </ButtonLink>
    </section>
  )
}
