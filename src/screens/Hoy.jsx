import { useData } from '../context/DataContext'
import { notaDeFase, resumenDelDia } from '../lib/resumen'
import Resumen from '../components/Resumen'
import NotaCalma from '../components/NotaCalma'

export default function Hoy() {
  const { registros, notasContextoActivas } = useData()
  const ahora = Date.now()
  const resumen = resumenDelDia(registros, ahora)
  const nota = notasContextoActivas ? notaDeFase(registros, ahora) : null

  return (
    <div className="pantalla">
      <h2 className="pantalla-titulo">Hoy</h2>
      <Resumen resumen={resumen} />
      <NotaCalma mensaje={nota} />
    </div>
  )
}
