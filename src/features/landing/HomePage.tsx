import { AnimatePresence, motion } from 'motion/react'
import { lazy, useReducer } from 'react'
import { Button, ButtonLink } from '../../components/ui/Button'
import Money from '../../components/ui/Money'
import TiltCard from '../../components/ui/TiltCard'
import Scene3D from '../../three/Scene3D'
import { demoReducer, initialDemoState, type DemoPhase } from './demoMachine'

const HeroScene = lazy(() => import('../../three/HeroScene'))

const RESULT_COPY: Record<
  Exclude<DemoPhase, 'idle'>,
  { title: string; body: string }
> = {
  doubled: {
    title: 'You scored for the group! Fund doubled.',
    body: 'Your crew wakes up on release day to twice the wishlist.',
  },
  lost: {
    title: 'You messed it up. Fund lost.',
    body: 'One wrong quiz and the whole group walks away with nothing.',
  },
  intact: {
    title: 'You passed. Fund intact.',
    body: 'No risk, no glory — but nobody can blame you either.',
  },
}

const STEPS = [
  {
    icon: '👥',
    title: 'Form your group',
    body: 'Create a group, share the join code and lock it once your crew is in.',
  },
  {
    icon: '🎁',
    title: 'Build the wishlist',
    body: 'Add what you actually want. The total becomes your group fund.',
  },
  {
    icon: '🤫',
    title: 'Double or Pass — in secret',
    body: 'The day before release, everyone chooses alone. Double means a quiz.',
  },
  {
    icon: '💥',
    title: 'Release day reveal',
    body: 'Intact, doubled or wiped out. Find out who scored and who sold.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export default function HomePage() {
  const [demo, dispatch] = useReducer(demoReducer, initialDemoState)
  const decided = demo.phase !== 'idle'

  return (
    <>
      <section aria-labelledby="hero-heading" className="hero">
        <motion.div
          animate="show"
          className="hero-copy"
          initial="hidden"
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.p className="eyebrow" variants={fadeUp}>
            YOUR GROUP. YOUR CALL.
          </motion.p>
          <motion.h1 id="hero-heading" variants={fadeUp}>
            Would you risk it{' '}
            <span className="text-gradient">for everyone?</span>
          </motion.h1>
          <motion.p className="hero-lead" variants={fadeUp}>
            A mystery billionaire funds your group&apos;s wishlist. The day
            before the money drops, each of you secretly chooses:{' '}
            <strong>double it</strong> with a quiz, or <strong>pass</strong>.
            One loss wipes it out for everyone.
          </motion.p>
          <motion.div className="flex flex-wrap gap-3" variants={fadeUp}>
            <ButtonLink size="lg" to="/signup" variant="primary">
              Start a group
            </ButtonLink>
            <ButtonLink size="lg" to="/login" variant="secondary">
              Log in
            </ButtonLink>
          </motion.div>
        </motion.div>

        <div className="hero-stage">
          <Scene3D className="hero-scene">
            <HeroScene phase={demo.phase} />
          </Scene3D>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="demo-panel"
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <p className="demo-label">Try it · group fund</p>
            <p className={`demo-fund demo-fund-${demo.phase}`}>
              <Money cents={demo.fundCents} wholeRand />
            </p>

            <div aria-live="polite" className="min-h-[3.25rem]">
              <AnimatePresence mode="wait">
                {decided ? (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    key={demo.phase}
                  >
                    <p className="font-semibold">
                      {
                        RESULT_COPY[demo.phase as Exclude<DemoPhase, 'idle'>]
                          .title
                      }
                    </p>
                    <p className="text-sm text-on-surface-muted">
                      {
                        RESULT_COPY[demo.phase as Exclude<DemoPhase, 'idle'>]
                          .body
                      }
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    animate={{ opacity: 1 }}
                    className="text-sm text-on-surface-muted"
                    initial={{ opacity: 0 }}
                    key="idle"
                  >
                    Make your secret call. A Double here is a 50/50 — in the
                    real game, it&apos;s a quiz.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1"
                disabled={decided}
                onClick={() =>
                  dispatch({ type: 'double', won: Math.random() < 0.5 })
                }
                variant="gold"
              >
                Double
              </Button>
              <Button
                className="flex-1"
                disabled={decided}
                onClick={() => dispatch({ type: 'pass' })}
                variant="secondary"
              >
                Pass
              </Button>
            </div>
            {decided ? (
              <Button
                className="mt-3 w-full"
                onClick={() => dispatch({ type: 'reset' })}
                variant="ghost"
              >
                Play again
              </Button>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="how">
        <motion.h2
          className="section-title"
          id="how-heading"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true, margin: '-80px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          How it works
        </motion.h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <motion.li
              initial={{ opacity: 0, y: 30 }}
              key={step.title}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true, margin: '-60px' }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <TiltCard className="step-card">
                <span aria-hidden="true" className="step-icon">
                  {step.icon}
                </span>
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </TiltCard>
            </motion.li>
          ))}
        </ol>
      </section>
    </>
  )
}
