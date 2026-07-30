import { useState } from 'react'
import { Milk, Moon, Pencil, Plus, Sun } from 'lucide-react'
import { useData } from '../context/DataContext'
import { duracionLarga, horaCorta } from '../lib/tiempo'
import EditorRegistro from './EditorRegistro'

/** Tarjetas + lista de eventos del día. Lo comparten Hoy e Historial. */
export default function Resumen({ resumen }) {
  const {
    registros: todos,
    baby,
    addRegistro,
    editRegistro,
    deleteRegistro,
    ajustarEstadoActual,
  } = useData()

  const { msDormido, nSuenos, msDespierto, msToma, nTomas, registros, diaMs } = resumen
  const [editor, setEditor] = useState(null)

  /** ¿Este registro es el sueño abierto que sostiene el estado actual? */
  const esSuenoEnCurso = (r) =>
    r && r.fin == null && r.tipo === 'sueño' && baby?.estadoActual?.modo === 'dormido'

  async function guardar({ tipo, inicio, fin }) {
    const actual = editor
    if (actual?.nuevo) {
      await addRegistro({ tipo, inicio, fin })
    } else if (actual?.registro) {
      const r = actual.registro
      await editRegistro(r.id, { tipo, inicio, fin })
      // Si tocaste el sueño en curso, el estado del bebé tiene que seguirlo.
      if (esSuenoEnCurso(r)) {
        if (tipo === 'sueño' && fin == null) ajustarEstadoActual('dormido', inicio)
        else ajustarEstadoActual('despierto', fin ?? Date.now())
      }
    }
    setEditor(null)
  }

  async function borrar() {
    const r = editor?.registro
    if (!r) return
    await deleteRegistro(r.id)
    if (esSuenoEnCurso(r)) ajustarEstadoActual('despierto', Date.now())
    setEditor(null)
  }

  return (
    <div className="resumen">
      <div className="tarjetas">
        <Tarjeta
          Icon={Moon}
          label="Dormido"
          valor={duracionLarga(msDormido)}
          sub={`${nSuenos} sueños`}
        />
        <Tarjeta Icon={Sun} label="Despierto" valor={duracionLarga(msDespierto)} />
        <Tarjeta
          Icon={Milk}
          label="Tomas"
          valor={duracionLarga(msToma)}
          sub={`${nTomas} tomas`}
        />
      </div>

      <button className="btn-agregar" onClick={() => setEditor({ nuevo: true })}>
        <Plus size={18} strokeWidth={2} aria-hidden="true" />
        Agregar registro
      </button>

      <ul className="timeline">
        {registros.length === 0 && (
          <li className="timeline-vacio">Sin registros este día.</li>
        )}
        {registros.map((r) => {
          const esSueno = r.tipo === 'sueño'
          const Icon = esSueno ? Moon : Milk
          return (
            <li key={r.id} className="timeline-item">
              <button
                className={`evento evento--${esSueno ? 'sueno' : 'toma'}`}
                onClick={() => setEditor({ registro: r })}
              >
                <Icon
                  className="evento-icono"
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <div className="evento-cuerpo">
                  <span className="evento-titulo">{esSueno ? 'Sueño' : 'Toma'}</span>
                  <span className="evento-horas">
                    {horaCorta(r.inicio)} – {r.fin ? horaCorta(r.fin) : 'en curso'}
                  </span>
                </div>
                <span className="evento-dur">
                  {r.fin ? duracionLarga(r.fin - r.inicio) : '···'}
                </span>
                <Pencil
                  className="evento-editar"
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        })}
      </ul>

      {editor && (
        <EditorRegistro
          registro={editor.registro ?? null}
          diaMs={diaMs}
          registros={todos}
          onGuardar={guardar}
          onBorrar={borrar}
          onCancelar={() => setEditor(null)}
        />
      )}
    </div>
  )
}

function Tarjeta({ Icon, label, valor, sub }) {
  return (
    <div className="tarjeta">
      <Icon className="tarjeta-icono" size={22} strokeWidth={1.75} aria-hidden="true" />
      <span className="tarjeta-valor">{valor}</span>
      <span className="tarjeta-label">{label}</span>
      {sub && <span className="tarjeta-sub">{sub}</span>}
    </div>
  )
}
