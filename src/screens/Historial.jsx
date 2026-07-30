import { useState } from 'react'
import { useData } from '../context/DataContext'
import { inicioDia, resumenDelDia } from '../lib/resumen'
import { fechaLarga } from '../lib/tiempo'
import Resumen from '../components/Resumen'

const UN_DIA = 1440 * 60 * 1000

export default function Historial() {
  const { registros } = useData()
  const [dia, setDia] = useState(() => inicioDia(Date.now()))

  const esHoy = dia === inicioDia(Date.now())
  const resumen = resumenDelDia(registros, dia)

  return (
    <div className="pantalla">
      <div className="hist-nav">
        <button
          className="btn-nav"
          onClick={() => setDia((d) => d - UN_DIA)}
          aria-label="Día anterior"
        >
          ‹
        </button>
        <span className="hist-fecha">{esHoy ? 'Hoy' : fechaLarga(dia)}</span>
        <button
          className="btn-nav"
          onClick={() => setDia((d) => d + UN_DIA)}
          disabled={esHoy}
          aria-label="Día siguiente"
        >
          ›
        </button>
      </div>
      <Resumen resumen={resumen} />
    </div>
  )
}
