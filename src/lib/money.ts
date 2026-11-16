/**
 * Money is stored as integer cents everywhere (see IMPLEMENTATION_PLAN §5)
 * and only formatted as Rand at the edge of the UI.
 */

function groupThousands(whole: number): string {
  return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatRand(
  cents: number,
  { cents: showCents = true }: { cents?: boolean } = {},
): string {
  const safe = Math.max(0, Math.round(cents))
  const whole = Math.floor(safe / 100)
  const rest = safe % 100
  const base = `R${groupThousands(whole)}`
  return showCents ? `${base}.${rest.toString().padStart(2, '0')}` : base
}

/** Parses user input such as "1234.5" or "R1 234.56" into cents. */
export function parseRandToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^R/i, '').replace(/[\s,]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const cents = Math.round(Number(cleaned) * 100)
  return cents > 0 ? cents : null
}
