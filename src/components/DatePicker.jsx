import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import { CalendarDays, ChevronDown } from 'lucide-react'

/**
 * Campo de fecha con calendario desplegable.
 *
 * El español sale de dos lados distintos:
 *  - el texto del campo lo arma toLocaleDateString('es', …) (Intl)
 *  - el calendario usa el locale `es` de react-day-picker/locale, que es
 *    {...esDeDateFns, labels: {…en español}}. Los aria-label ("Elegir el mes",
 *    "Ir al mes siguiente", "Número de semana", …) vienen de ahí, no de un
 *    objeto labels propio. Ver nota en el commit.
 *
 * Los dropdowns de mes y año se reemplazan por MenuCal para poder estilarlos;
 * los <select> nativos no se pueden pintar.
 */
export default function DatePicker({
  value,
  onChange,
  max,
  placeholder = 'Elegir fecha',
}) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)

  const seleccionada = value != null ? new Date(value) : undefined
  const maxima = max != null ? new Date(max) : undefined

  useEffect(() => {
    if (!abierto) return
    const afuera = (e) => {
      if (caja.current && !caja.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', afuera)
    document.addEventListener('touchstart', afuera)
    return () => {
      document.removeEventListener('mousedown', afuera)
      document.removeEventListener('touchstart', afuera)
    }
  }, [abierto])

  const texto = seleccionada
    ? seleccionada.toLocaleDateString('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : placeholder

  const elegir = (d) => {
    if (!d) return
    onChange(d.getTime())
    setAbierto(false)
  }

  return (
    <div className="datepicker" ref={caja}>
      <button
        type="button"
        className={`datepicker-field ${seleccionada ? '' : 'datepicker-field--vacio'}`}
        onClick={() => setAbierto((v) => !v)}
      >
        <span className="datepicker-field-txt">
          <CalendarDays size={18} strokeWidth={1.75} aria-hidden="true" />
          {texto}
        </span>
        <ChevronDown
          className={`datepicker-chevron ${abierto ? 'datepicker-chevron--abierto' : ''}`}
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div className="datepicker-panel">
          <DayPicker
            className="datepicker-cal"
            mode="single"
            locale={es}
            selected={seleccionada}
            onSelect={elegir}
            defaultMonth={seleccionada || maxima}
            captionLayout="dropdown"
            startMonth={new Date(2015, 0)}
            endMonth={maxima}
            disabled={maxima ? { after: maxima } : undefined}
            components={{ MonthsDropdown: MenuCal, YearsDropdown: MenuCal }}
          />
          <div className="datepicker-acciones">
            <button
              type="button"
              className="datepicker-accion"
              onClick={() => elegir(maxima && maxima < new Date() ? maxima : new Date())}
            >
              Hoy
            </button>
            <button
              type="button"
              className="datepicker-accion"
              onClick={() => {
                onChange(null)
                setAbierto(false)
              }}
            >
              Borrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Reemplazo estilable de los <select> de mes y año del calendario. */
function MenuCal({ options = [], value, onChange, disabled, ...resto }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)
  const menu = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const afuera = (e) => {
      if (caja.current && !caja.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', afuera)
    document.addEventListener('touchstart', afuera)
    return () => {
      document.removeEventListener('mousedown', afuera)
      document.removeEventListener('touchstart', afuera)
    }
  }, [abierto])

  useEffect(() => {
    if (abierto && menu.current) {
      const sel = menu.current.querySelector('[aria-selected="true"]')
      if (sel) sel.scrollIntoView({ block: 'center' })
    }
  }, [abierto])

  const actual = options.find((o) => o.value === value)

  const elegir = (o) => {
    if (o.disabled) return
    onChange?.({ target: { value: o.value } })
    setAbierto(false)
  }

  return (
    <div className="caldd" ref={caja}>
      <button
        type="button"
        className="caldd-btn"
        disabled={disabled}
        aria-label={resto['aria-label']}
        onClick={() => setAbierto((v) => !v)}
      >
        <span>{actual?.label}</span>
        <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />
      </button>
      {abierto && (
        <ul className="caldd-menu" role="listbox" ref={menu}>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                disabled={o.disabled}
                className={`caldd-opt ${o.value === value ? 'caldd-opt--sel' : ''}`}
                onClick={() => elegir(o)}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
