import { useState } from 'react'
import { Apple, Milk, Moon, Pencil, Plus, Sun } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useComidas } from '../context/ComidaContext'
import { ETIQUETA_ACEPTACION, ETIQUETA_MOMENTO } from '../lib/datos'
import { comidasDelDia } from '../lib/resumen'
import { duracionLarga, horaCorta } from '../lib/tiempo'
import EditorComida from './EditorComida'
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
  const { comidas, agregarComida, editarComida, borrarComida } = useComidas()

  const { msDormido, nSuenos, msDespierto, msToma, nTomas, registros, diaMs } = resumen
  const [editor, setEditor] = useState(null)
  const [editorComida, setEditorComida] = useState(null)

  const comidasDia = comidasDelDia(comidas, diaMs)
  const nAlimentos = new Set(comidasDia.flatMap((c) => c.alimentos.map((a) => a.id))).size

  // Sueños, tomas y comidas en una sola línea de tiempo, por hora de inicio.
  const eventos = [
    ...registros.map((r) => ({ clase: 'registro', ms: r.inicio, dato: r })),
    ...comidasDia.map((c) => ({ clase: 'comida', ms: c.inicio, dato: c })),
  ].sort((a, b) => a.ms - b.ms)

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

  // Las comidas no tocan `estadoActual`: no hay nada en curso que corregir.
  async function guardarComida(datos) {
    const actual = editorComida
    if (actual?.nueva) await agregarComida(datos)
    else if (actual?.comida) await editarComida(actual.comida.id, datos)
    setEditorComida(null)
  }

  async function borrarComidaActual() {
    const c = editorComida?.comida
    if (!c) return
    await borrarComida(c.id)
    setEditorComida(null)
  }

  return (
    <div className="resumen">
      <div className={`tarjetas ${comidasDia.length > 0 ? 'tarjetas--cuatro' : ''}`}>
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
        {comidasDia.length > 0 && (
          <Tarjeta
            Icon={Apple}
            label="Comidas"
            valor={String(comidasDia.length)}
            sub={nAlimentos > 0 ? `${nAlimentos} alimentos` : null}
          />
        )}
      </div>

      <button className="btn-agregar" onClick={() => setEditor({ nuevo: true })}>
        <Plus size={18} strokeWidth={2} aria-hidden="true" />
        Agregar registro
      </button>

      <button className="btn-agregar" onClick={() => setEditorComida({ nueva: true })}>
        <Plus size={18} strokeWidth={2} aria-hidden="true" />
        Agregar comida
      </button>

      <ul className="timeline">
        {eventos.length === 0 && (
          <li className="timeline-vacio">Sin registros este día.</li>
        )}
        {eventos.map(({ clase, dato }) =>
          clase === 'registro' ? (
            <EventoRegistro
              key={`reg-${dato.id}`}
              registro={dato}
              onEditar={() => setEditor({ registro: dato })}
            />
          ) : (
            <EventoComida
              key={`com-${dato.id}`}
              comida={dato}
              onEditar={() => setEditorComida({ comida: dato })}
            />
          ),
        )}
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

      {editorComida && (
        <EditorComida
          comida={editorComida.comida ?? null}
          diaMs={diaMs}
          onGuardar={guardarComida}
          onBorrar={borrarComidaActual}
          onCancelar={() => setEditorComida(null)}
        />
      )}
    </div>
  )
}

function EventoRegistro({ registro: r, onEditar }) {
  const esSueno = r.tipo === 'sueño'
  const Icon = esSueno ? Moon : Milk
  return (
    <li className="timeline-item">
      <button
        className={`evento evento--${esSueno ? 'sueno' : 'toma'}`}
        onClick={onEditar}
      >
        <Icon className="evento-icono" size={20} strokeWidth={1.75} aria-hidden="true" />
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
}

/** Cuántos alimentos entran en el título antes de resumir el resto. */
const ALIMENTOS_VISIBLES = 3

function tituloDeComida(alimentos) {
  const nombres = alimentos.map((a) => a.nombre)
  if (nombres.length === 0) return 'Comida'
  if (nombres.length <= ALIMENTOS_VISIBLES) return nombres.join(', ')
  const visibles = nombres.slice(0, ALIMENTOS_VISIBLES).join(', ')
  return `${visibles} y ${nombres.length - ALIMENTOS_VISIBLES} más`
}

function EventoComida({ comida: c, onEditar }) {
  const titulo = tituloDeComida(c.alimentos)
  const momento = c.momento ? ` · ${ETIQUETA_MOMENTO[c.momento] ?? c.momento}` : ''
  return (
    <li className="timeline-item">
      <button className="evento evento--comida" onClick={onEditar}>
        <Apple className="evento-icono" size={20} strokeWidth={1.75} aria-hidden="true" />
        <div className="evento-cuerpo">
          <span className="evento-titulo">{titulo}</span>
          <span className="evento-horas">
            {horaCorta(c.inicio)}
            {momento}
          </span>
        </div>
        {c.aceptacion && (
          <span className="evento-dur">{ETIQUETA_ACEPTACION[c.aceptacion]}</span>
        )}
        <Pencil
          className="evento-editar"
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
    </li>
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
