import { useEffect, useState } from 'react'
import { cronoTexto } from '../lib/tiempo'

/**
 * Cronómetro que cuenta desde `desde` (millis) hasta ahora.
 *
 * El tick es un setInterval de 1s que solo fuerza el re-render; el valor sale
 * siempre de `Date.now() - desde`, así que si la pestaña se congela en
 * segundo plano el número se corrige solo al volver. Por eso el original no
 * necesita escuchar visibilitychange.
 */
export default function Crono({ desde, className = '' }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const ms = desde ? Date.now() - desde : 0
  return <span className={`crono ${className}`}>{cronoTexto(ms)}</span>
}
