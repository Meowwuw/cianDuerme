import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * Hora y minutos con steppers. La hora salta de a 1 y da la vuelta en 24;
 * los minutos saltan de a 5 y arrastran la hora al cruzar (todo en minutos
 * del día, módulo 1440), así que 23:58 + 5 min queda en 00:00 del mismo día.
 */
export default function TimePicker({ value, onChange }) {
  const d = new Date(value)
  const horas = d.getHours()
  const minutos = d.getMinutes()

  const fijar = (h, m) => {
    const nueva = new Date(value)
    nueva.setHours(h, m, 0, 0)
    onChange(nueva.getTime())
  }

  const pasoHora = (n) => fijar((horas + n + 24) % 24, minutos)

  const pasoMinuto = (n) => {
    // Redondea a múltiplo de 5 antes de sumar, para no arrastrar restos.
    const base = Math.round(minutos / 5) * 5
    let total = horas * 60 + base + n * 5
    total = ((total % 1440) + 1440) % 1440
    fijar(Math.floor(total / 60), total % 60)
  }

  return (
    <div className="timepicker" role="group" aria-label="Hora">
      <GrupoTP
        titulo="Hora"
        valor={horas}
        max={23}
        etiqueta="Hora"
        labelMenos="Restar una hora"
        labelMas="Sumar una hora"
        onStep={pasoHora}
        onCommit={(h) => fijar(h, minutos)}
      />
      <GrupoTP
        titulo="Min"
        valor={minutos}
        max={59}
        etiqueta="Minutos"
        labelMenos="Restar cinco minutos"
        labelMas="Sumar cinco minutos"
        onStep={pasoMinuto}
        onCommit={(m) => fijar(horas, m)}
      />
    </div>
  )
}

function GrupoTP({
  titulo,
  valor,
  max,
  etiqueta,
  labelMenos,
  labelMas,
  onStep,
  onCommit,
}) {
  // Mientras escribís, el input manda; al salir se normaliza y se confirma.
  const [borrador, setBorrador] = useState(null)
  const mostrado = borrador ?? pad2(valor)

  const confirmar = () => {
    if (borrador == null) return
    const n = Math.min(max, Math.max(0, parseInt(borrador || '0', 10) || 0))
    onCommit(n)
    setBorrador(null)
  }

  return (
    <div className="tp-grupo">
      <span className="tp-etiqueta" aria-hidden="true">
        {titulo}
      </span>
      <button
        type="button"
        className="tp-step"
        aria-label={labelMenos}
        onClick={() => onStep(-1)}
      >
        <Minus size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <input
        className="tp-num"
        type="text"
        inputMode="numeric"
        aria-label={etiqueta}
        value={mostrado}
        onFocus={(e) => {
          setBorrador(String(valor))
          e.target.select()
        }}
        onChange={(e) => setBorrador(e.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            confirmar()
            e.target.blur()
          }
        }}
      />
      <button
        type="button"
        className="tp-step"
        aria-label={labelMas}
        onClick={() => onStep(1)}
      >
        <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  )
}
