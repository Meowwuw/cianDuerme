import Mascota from '../components/Mascota'

export default function Bienvenida({ onEmpezar }) {
  return (
    <div className="bienvenida-fondo">
      <div className="bienvenida-card">
        <div className="bienvenida-mascota">
          <Mascota estado="despierto" size={116} />
        </div>
        <h1 className="bienvenida-titulo">Hola 💚</h1>
        <div className="bienvenida-texto">
          <p>Cian duerme es para acompañarte, no para evaluarte.</p>
          <p>
            Aquí no hay metas que cumplir ni bebés con quién compararse. Solo el ritmo
            de tu bebé, para que lo conozcas con calma.
          </p>
          <p>
            Anota lo que puedas, cuando puedas. Y cuando no, mira a tu bebé en vez de
            la pantalla.
          </p>
        </div>
        <button className="btn-gota bienvenida-btn" onClick={onEmpezar}>
          Empezar
        </button>
      </div>
    </div>
  )
}
