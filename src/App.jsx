// TODO: PASO 2 — este archivo es un andamio provisorio, no es el App original.
//
// La estructura real está al final del bundle (líneas 44765–44809 de
// recuperado/assets/index-BLha0cqC.js) y es:
//
//   App()            -> user ? <DataProvider><Ruteo/></DataProvider> : <Login/>
//   Ruteo()          -> babiesCargando ? <Cargando/>
//                       : codigoUrl     ? <Unirse codigoInicial={codigoUrl} onListo={limpiarCodigoUrl}/>
//                       : babies.length === 0 ? <Unirse/>
//                       : <Tabs/>
//   Tabs()           -> useState('ahora'); bienvenidaCargada
//                       ? (bienvenidaVista
//                            ? <div className="app"><Header onIrAjustes={...}/>
//                                <main className="app-main"><Pantalla/></main>
//                                <BarraNav activa={...} onChange={...}/></div>
//                            : <Bienvenida onEmpezar={marcarBienvenida}/>)
//                       : <Cargando/>
//
// Requiere: DataContext, Login, Cargando, Unirse, Header, BarraNav, Bienvenida
// y las 4 pantallas. Ninguno existe todavía.

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'var(--fuente-body)' }}>
      <h1 style={{ fontFamily: 'var(--fuente-titulo)' }}>Cian duerme</h1>
      <p>Andamio del paso 1: Vite, fuentes, CSS y tema cargados.</p>
    </div>
  )
}
