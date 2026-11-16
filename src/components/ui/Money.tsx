import { animate } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { formatRand } from '../../lib/money'

interface MoneyProps {
  cents: number
  /** Hide the cents, e.g. for big headline numbers. */
  wholeRand?: boolean
  className?: string
}

/** Shows a Rand amount and counts up or down when the value changes. */
export default function Money({
  cents,
  wholeRand = false,
  className,
}: MoneyProps) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(cents)
  const current = useRef(cents)

  useEffect(() => {
    const controls = animate(current.current, cents, {
      duration: reduced ? 0 : 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        current.current = value
        setDisplay(value)
      },
    })
    return () => controls.stop()
  }, [cents, reduced])

  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {formatRand(display, { cents: !wholeRand })}
    </span>
  )
}
