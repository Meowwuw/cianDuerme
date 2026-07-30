import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { DataProvider, useData } from './context/DataContext'
import Cargando from './components/Cargando'
import Header from './components/Header'
import BarraTabs from './components/BarraTabs'
import Login from './screens/Login'
import Bienvenida from './screens/Bienvenida'
import Onboarding from './screens/Onboarding'
import Ahora from './screens/Ahora'
import Hoy from './screens/Hoy'
import Historial from './screens/Historial'
import Ajustes from './screens/Ajustes'

const PANTALLAS = {
  ahora: Ahora,
  hoy: Hoy,
  historial: Historial,
  ajustes: Ajustes,
}

export default function App() {
  const { user, cargando } = useAuth()

  if (cargando) return <Cargando />
  if (!user) return <Login />

  return (
    <DataProvider>
      <Ruteo />
    </DataProvider>
  )
}

function Ruteo() {
  const { babies, babiesCargando, codigoUrl, limpiarCodigoUrl } = useData()

  if (babiesCargando) return <Cargando />
  if (codigoUrl) return <Onboarding codigoInicial={codigoUrl} onListo={limpiarCodigoUrl} />
  if (babies.length === 0) return <Onboarding />
  return <Tabs />
}

function Tabs() {
  const [activa, setActiva] = useState('ahora')
  const { bienvenidaVista, bienvenidaCargada, marcarBienvenida } = useData()
  const Pantalla = PANTALLAS[activa]

  if (!bienvenidaCargada) return <Cargando />
  if (!bienvenidaVista) return <Bienvenida onEmpezar={marcarBienvenida} />

  return (
    <div className="app">
      <Header onIrAjustes={() => setActiva('ajustes')} />
      <main className="app-main">
        <Pantalla />
      </main>
      <BarraTabs activa={activa} onChange={setActiva} />
    </div>
  )
}
