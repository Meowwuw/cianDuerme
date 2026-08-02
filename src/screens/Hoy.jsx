import { useData } from '../context/DataContext'
import { useComidas } from '../context/ComidaContext'
import { notaDeFase, resumenDelDia } from '../lib/resumen'
import Resumen from '../components/Resumen'
import NotaCalma from '../components/NotaCalma'

export default function Hoy() {
  const { registros, notasContextoActivas } = useData()
  const { comidas } = useComidas()
  const ahora = Date.now()
  const resumen = resumenDelDia(registros, ahora)
  // El interruptor es uno solo: apagar las notas de contexto apaga también
  // las de alimentación.
  const nota = notasContextoActivas ? notaDeFase(registros, comidas, ahora) : null

  return (
    <div className="pantalla">
      <h2 className="pantalla-titulo">Hoy</h2>
      <Resumen resumen={resumen} />
      <NotaCalma mensaje={nota} />
    </div>
  )
}
