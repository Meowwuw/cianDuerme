import { useState } from 'react'
import { conFechaDe } from '../lib/tiempo'
import DatePicker from './DatePicker'

// TODO: PASO 7 — parcial. Falta del original (bundle 43181–43403): chips de
// tipo (Sueño / Toma), chips de atajo ("Ahora", "Hace 5 min", "Hace 15 min",
// "Hace 30 min", "Hace 1 h"), el TimePicker con steppers ±1 h y ±5 min
// (aria-label "Restar una hora", "Sumar cinco minutos", …), la sección de fin,
// el switch "en curso", el aviso de solape (haySolape en lib/resumen.js), el
// botón Guardar y la confirmación de borrado.
//
// La sección "Inicio" con su DatePicker sí está, adelantada del paso 7, para
// poder abrir el calendario y verificar el locale.
export default function EditorRegistro({
  registro = null,
  diaMs,
  registros,
  onGuardar,
  onBorrar,
  onCancelar,
}) {
  const esNuevo = !registro
  const [inicio, setInicio] = useState(registro?.inicio ?? diaMs)

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{esNuevo ? 'Agregar registro' : 'Editar registro'}</h3>

        <div className="editor-seccion">
          <span className="editor-seccion-tit" id="lbl-inicio">
            Inicio
          </span>
          <div className="editor-fh" aria-labelledby="lbl-inicio">
            <DatePicker
              value={inicio}
              max={Date.now()}
              onChange={(ms) => ms != null && setInicio(conFechaDe(ms, inicio))}
            />
          </div>
        </div>

        <div className="modal-botones">
          <button className="btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
