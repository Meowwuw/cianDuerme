import { useState } from 'react'
import { Milk, Moon, Trash2 } from 'lucide-react'
import { haySolape, inicioDia, HORA, MINUTO } from '../lib/resumen'
import { conFechaDe, duracionLarga } from '../lib/tiempo'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'

const MEDIA_HORA = 30 * MINUTO
const MEDIODIA = 12 * HORA

const ATAJOS = [
  { label: 'Ahora', resta: 0 },
  { label: 'Hace 5 min', resta: 5 * MINUTO },
  { label: 'Hace 15 min', resta: 15 * MINUTO },
  { label: 'Hace 30 min', resta: 30 * MINUTO },
  { label: 'Hace 1 h', resta: HORA },
]

export default function EditorRegistro({
  registro = null,
  diaMs,
  registros,
  onGuardar,
  onBorrar,
  onCancelar,
}) {
  const esNuevo = registro == null
  const ahora = Date.now()

  // Si estás parado en otro día, el default no puede ser "ahora": se usa el
  // mediodía de ese día (acotado a ahora, por si el día es futuro).
  const otroDia = diaMs != null && inicioDia(diaMs) !== inicioDia(ahora)
  const base = Math.min(otroDia ? inicioDia(diaMs) + MEDIODIA : ahora, ahora)

  const [tipo, setTipo] = useState(registro?.tipo ?? 'sueño')
  const [inicio, setInicio] = useState(registro?.inicio ?? base - MEDIA_HORA)
  const [fin, setFin] = useState(registro?.fin ?? base)
  // Al editar hereda si el registro estaba abierto; al crear, solo se asume
  // "en curso" si estás en el día de hoy.
  const [enCurso, setEnCurso] = useState(registro ? registro.fin == null : !otroDia)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  const finFinal = enCurso ? null : fin
  const finAntesDeInicio = !enCurso && fin < inicio
  const solapa = haySolape(registros, { id: registro?.id, inicio, fin: finFinal })
  const puedeGuardar = !finAntesDeInicio
  const duracion = duracionLarga(Math.max(0, (enCurso ? ahora : fin) - inicio))

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{esNuevo ? 'Agregar registro' : 'Editar registro'}</h3>

        <div className="editor-tipos" role="group" aria-label="Tipo de registro">
          <button
            type="button"
            className={`tipo-chip ${tipo === 'sueño' ? 'tipo-chip--activo' : ''}`}
            aria-pressed={tipo === 'sueño'}
            onClick={() => setTipo('sueño')}
          >
            <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
            Sueño
          </button>
          <button
            type="button"
            className={`tipo-chip ${tipo === 'toma' ? 'tipo-chip--activo' : ''}`}
            aria-pressed={tipo === 'toma'}
            onClick={() => setTipo('toma')}
          >
            <Milk size={18} strokeWidth={1.75} aria-hidden="true" />
            Toma
          </button>
        </div>

        <div className="editor-seccion">
          <span className="editor-seccion-tit" id="lbl-inicio">
            Inicio
          </span>
          <div className="editor-atajos" role="group" aria-label="Atajos de hora de inicio">
            {ATAJOS.map((a) => (
              <button
                key={a.label}
                type="button"
                className="editor-atajo"
                onClick={() => setInicio(ahora - a.resta)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="editor-fh" aria-labelledby="lbl-inicio">
            <DatePicker
              value={inicio}
              max={ahora}
              onChange={(ms) => ms != null && setInicio(conFechaDe(ms, inicio))}
            />
            <TimePicker value={inicio} onChange={setInicio} />
          </div>
        </div>

        <div className="editor-seccion">
          <span className="editor-seccion-tit" id="lbl-fin">
            Fin
          </span>
          <label className="editor-encurso">
            <input
              type="checkbox"
              checked={enCurso}
              onChange={(e) => setEnCurso(e.target.checked)}
            />
            En curso (sin hora de fin)
          </label>
          {!enCurso && (
            <>
              <div className="editor-atajos">
                <button
                  type="button"
                  className="editor-atajo"
                  onClick={() => setFin(ahora)}
                >
                  Ahora
                </button>
              </div>
              <div className="editor-fh" aria-labelledby="lbl-fin">
                <DatePicker
                  value={fin}
                  max={ahora}
                  onChange={(ms) => ms != null && setFin(conFechaDe(ms, fin))}
                />
                <TimePicker value={fin} onChange={setFin} />
              </div>
            </>
          )}
        </div>

        <p className="editor-duracion">
          Duración: <strong>{duracion}</strong>
          {enCurso && ' · en curso'}
        </p>

        {finAntesDeInicio && (
          <p className="editor-nota">El fin quedó antes del inicio. Ajústalo para guardar.</p>
        )}
        {!finAntesDeInicio && solapa && (
          <p className="editor-nota">Se superpone con otro registro. Igual puedes guardarlo.</p>
        )}

        <div className="modal-botones">
          <button className="btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            className="btn-pri"
            disabled={!puedeGuardar}
            onClick={() => onGuardar({ tipo, inicio, fin: finFinal })}
          >
            Guardar
          </button>
        </div>

        {!esNuevo &&
          (confirmandoBorrado ? (
            <div className="editor-borrar-confirm">
              <span>¿Borrar este registro?</span>
              <button className="btn-sec" onClick={() => setConfirmandoBorrado(false)}>
                No
              </button>
              <button className="btn-peligro" onClick={onBorrar}>
                Sí, borrar
              </button>
            </div>
          ) : (
            <button
              className="btn-borrar-link"
              onClick={() => setConfirmandoBorrado(true)}
            >
              <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
              Borrar registro
            </button>
          ))}
      </div>
    </div>
  )
}
