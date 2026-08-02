import { HORA, MINUTO } from '../lib/resumen'

/** Atajos de hora del editor. `resta` son ms hacia atrás desde ahora. */
export const ATAJOS = [
  { label: 'Ahora', resta: 0 },
  { label: 'Hace 5 min', resta: 5 * MINUTO },
  { label: 'Hace 15 min', resta: 15 * MINUTO },
  { label: 'Hace 30 min', resta: 30 * MINUTO },
  { label: 'Hace 1 h', resta: HORA },
]

/**
 * Fila de píldoras "Ahora / Hace 5 min / …". Sin `etiqueta` no pone role ni
 * aria-label, que es como estaba el atajo suelto del campo Fin.
 */
export default function AtajosHora({ atajos = ATAJOS, etiqueta, ahora, onElegir }) {
  return (
    <div
      className="editor-atajos"
      role={etiqueta ? 'group' : undefined}
      aria-label={etiqueta}
    >
      {atajos.map((a) => (
        <button
          key={a.label}
          type="button"
          className="editor-atajo"
          onClick={() => onElegir(ahora - a.resta)}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
