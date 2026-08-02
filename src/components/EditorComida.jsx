import { useState } from 'react'
import { X } from 'lucide-react'
import {
  ACEPTACIONES,
  ETIQUETA_ACEPTACION,
  ETIQUETA_MOMENTO,
  MOMENTOS,
  normalizarAlimento,
} from '../lib/datos'
import { HORA, inicioDia } from '../lib/resumen'
import { conFechaDe } from '../lib/tiempo'
import AtajosHora from './AtajosHora'
import BotonBorrar from './BotonBorrar'
import DatePicker from './DatePicker'
import Modal from './Modal'
import TimePicker from './TimePicker'

const MEDIODIA = 12 * HORA

/**
 * Editor propio, no un tercer chip de EditorRegistro: una comida es un
 * instante (no tiene fin ni solape) y tiene tres campos que sueño y toma no
 * tienen. Comparte el armazón del modal, los atajos, los pickers y el borrado.
 */
export default function EditorComida({
  comida = null,
  diaMs,
  onGuardar,
  onBorrar,
  onCancelar,
}) {
  const esNueva = comida == null
  const ahora = Date.now()

  // Mismo criterio que EditorRegistro: parado en otro día, el default es el
  // mediodía de ese día, nunca una hora futura.
  const otroDia = diaMs != null && inicioDia(diaMs) !== inicioDia(ahora)
  const base = Math.min(otroDia ? inicioDia(diaMs) + MEDIODIA : ahora, ahora)

  const [alimentos, setAlimentos] = useState(comida?.alimentos ?? [])
  const [texto, setTexto] = useState('')
  const [inicio, setInicio] = useState(comida?.inicio ?? base)
  const [momento, setMomento] = useState(comida?.momento ?? null)
  const [aceptacion, setAceptacion] = useState(comida?.aceptacion ?? null)
  const [notas, setNotas] = useState(comida?.notas ?? '')

  /** Lo tipeado y todavía no agregado cuenta igual: nadie pierde una pera. */
  const alimentosFinales = () => {
    const pendiente = normalizarAlimento(texto)
    if (!pendiente || alimentos.some((a) => a.id === pendiente.id)) return alimentos
    return [...alimentos, pendiente]
  }

  const agregarAlimento = () => {
    setAlimentos(alimentosFinales())
    setTexto('')
  }

  const quitarAlimento = (id) => setAlimentos(alimentos.filter((a) => a.id !== id))

  const alTeclear = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    agregarAlimento()
  }

  /** Volver a tocar la opción elegida la apaga: los dos campos son opcionales. */
  const alternar = (valor, actual, set) => set(actual === valor ? null : valor)

  return (
    <Modal titulo={esNueva ? 'Agregar comida' : 'Editar comida'} onCerrar={onCancelar}>
      <div className="editor-seccion">
        <span className="editor-seccion-tit" id="lbl-alimentos">
          Alimentos
        </span>
        {alimentos.length > 0 && (
          <div className="editor-alimentos">
            {alimentos.map((a) => (
              <button
                key={a.id}
                type="button"
                className="alimento-chip"
                onClick={() => quitarAlimento(a.id)}
                aria-label={`Quitar ${a.nombre}`}
              >
                {a.nombre}
                <X size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <div className="editor-alta">
          <input
            className="input-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={alTeclear}
            placeholder="Zanahoria"
            aria-labelledby="lbl-alimentos"
            autoComplete="off"
          />
          <button className="btn-sec" onClick={agregarAlimento} disabled={!texto.trim()}>
            Agregar
          </button>
        </div>
      </div>

      <div className="editor-seccion">
        <span className="editor-seccion-tit" id="lbl-cuando">
          Cuándo
        </span>
        <AtajosHora etiqueta="Atajos de hora" ahora={ahora} onElegir={setInicio} />
        <div className="editor-fh" aria-labelledby="lbl-cuando">
          <DatePicker
            value={inicio}
            max={ahora}
            onChange={(ms) => ms != null && setInicio(conFechaDe(ms, inicio))}
          />
          <TimePicker value={inicio} onChange={setInicio} />
        </div>
      </div>

      <div className="editor-seccion">
        <span className="editor-seccion-tit">Momento</span>
        <div className="editor-atajos" role="group" aria-label="Momento del día">
          {MOMENTOS.map((m) => (
            <button
              key={m}
              type="button"
              className={`editor-atajo ${momento === m ? 'editor-atajo--activo' : ''}`}
              aria-pressed={momento === m}
              onClick={() => alternar(m, momento, setMomento)}
            >
              {ETIQUETA_MOMENTO[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-seccion">
        <span className="editor-seccion-tit">Cuánto comió</span>
        <div className="editor-atajos" role="group" aria-label="Cuánto comió">
          {ACEPTACIONES.map((a) => (
            <button
              key={a}
              type="button"
              className={`editor-atajo ${aceptacion === a ? 'editor-atajo--activo' : ''}`}
              aria-pressed={aceptacion === a}
              onClick={() => alternar(a, aceptacion, setAceptacion)}
            >
              {ETIQUETA_ACEPTACION[a]}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-seccion">
        <label className="editor-seccion-tit" htmlFor="notasComida">
          Notas
        </label>
        <input
          id="notasComida"
          className="input-texto"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Opcional"
          autoComplete="off"
        />
      </div>

      <div className="modal-botones">
        <button className="btn-sec" onClick={onCancelar}>
          Cancelar
        </button>
        <button
          className="btn-pri"
          onClick={() =>
            onGuardar({
              inicio,
              momento,
              alimentos: alimentosFinales(),
              aceptacion,
              notas,
            })
          }
        >
          Guardar
        </button>
      </div>

      {!esNueva && (
        <BotonBorrar
          etiqueta="Borrar comida"
          pregunta="¿Borrar esta comida?"
          onBorrar={onBorrar}
        />
      )}
    </Modal>
  )
}
