import { useState } from 'react'
import { aValorInputLocal, desdeValorInputLocal } from '../lib/tiempo'

export default function ModalAjustarHora({ titulo, valor, onGuardar, onCancelar }) {
  const [texto, setTexto] = useState(aValorInputLocal(valor))

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p className="modal-sub">¿Marcaste tarde? Corrige la hora de inicio.</p>
        <input
          type="datetime-local"
          value={texto}
          max={aValorInputLocal(Date.now())}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="modal-botones">
          <button className="btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-pri" onClick={() => onGuardar(desdeValorInputLocal(texto))}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
