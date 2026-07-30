export default function NotaCalma({ mensaje }) {
  if (!mensaje) return null
  return (
    <div className="notacalma" role="note">
      <p className="notacalma-txt">{mensaje}</p>
      <p className="notacalma-pie">
        Cian duerme te acompaña, no reemplaza a tu pediatra.
      </p>
    </div>
  )
}
