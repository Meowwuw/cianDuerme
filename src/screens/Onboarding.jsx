import Mascota from '../components/Mascota'

// TODO: PASO 7 — stub. El original (bundle 44189–44666) es la pantalla de
// onboarding completa: elige entre "Agregar nuevo bebé" y "Unirme con código",
// con los dos formularios. Acá solo está el cascarón exterior, que sí es fiel.
// Se muestra cuando no hay bebés o cuando la URL trae ?code=.
export default function Onboarding({ codigoInicial = null, onListo }) {
  return (
    <div className="onb">
      <Mascota estado="despierto" size={150} />
      <h1 className="onb-titulo">Hola</h1>
      <p className="onb-sub">¿Cómo quieres empezar?</p>
      {/* TODO: onb-opciones (crear / unir) + los dos formularios.
          Props ya cableadas: codigoInicial={codigoInicial}, onListo={onListo} */}
    </div>
  )
}
