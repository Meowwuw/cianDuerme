import Mascota from './Mascota'

export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="splash">
      <Mascota estado="dormido" size={160} />
      <p className="splash-txt">{texto}</p>
    </div>
  )
}
