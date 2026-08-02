import { useState } from 'react'
import { Trash2 } from 'lucide-react'

/**
 * Link de borrar que primero pide confirmación en la misma línea.
 * Extraído de EditorRegistro; los textos por defecto son los de allá.
 */
export default function BotonBorrar({
  etiqueta = 'Borrar registro',
  pregunta = '¿Borrar este registro?',
  onBorrar,
}) {
  const [confirmando, setConfirmando] = useState(false)

  if (confirmando)
    return (
      <div className="editor-borrar-confirm">
        <span>{pregunta}</span>
        <button className="btn-sec" onClick={() => setConfirmando(false)}>
          No
        </button>
        <button className="btn-peligro" onClick={onBorrar}>
          Sí, borrar
        </button>
      </div>
    )

  return (
    <button className="btn-borrar-link" onClick={() => setConfirmando(true)}>
      <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
      {etiqueta}
    </button>
  )
}
