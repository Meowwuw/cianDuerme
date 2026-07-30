import { ArrowLeft } from 'lucide-react'

const CONTACTO = 'paredesponcemagenta@gmail.com'
const ACTUALIZADA = '11 de julio de 2026'

export default function Privacidad({ onVolver }) {
  return (
    <div className="pantalla politica">
      <button className="politica-volver" onClick={onVolver}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        Volver
      </button>

      <h2 className="pantalla-titulo">Política de privacidad</h2>
      <p className="politica-fecha">Última actualización: {ACTUALIZADA}</p>

      <p className="politica-intro">
        <b>Cian duerme</b> es una app para registrar el sueño y las tomas de un bebé
        entre las personas que lo cuidan. Cuidamos tus datos y los del bebé. Aquí te
        contamos, en simple, qué se guarda y qué puedes hacer.
      </p>

      <Seccion titulo="Qué guardamos">
        <ul>
          <li>
            <b>Datos del bebé</b> que cargas: nombre, apodo, fecha de nacimiento y un
            emoji/imagen opcional.
          </li>
          <li>
            <b>Registros</b> de sueño y tomas (horarios de inicio y fin) que tú y los
            demás cuidadores anotan.
          </li>
          <li>
            <b>Tu cuenta de Google</b>: nombre, email y foto de perfil, para iniciar
            sesión e identificar a cada cuidador.
          </li>
          <li>
            <b>Códigos de invitación</b> que generás para sumar a otro cuidador.
          </li>
        </ul>
        <p>
          No pedimos ni guardamos datos de salud sensibles más allá de esos horarios, ni
          ubicación, ni contactos.
        </p>
      </Seccion>

      <Seccion titulo="Dónde se guardan">
        <p>
          En <b>Firebase (Google Cloud)</b>: la base de datos Firestore y el sistema de
          inicio de sesión de Google. Los datos viajan cifrados y se alojan en los
          servidores de Google. No tenemos servidores propios ni bases de datos aparte.
        </p>
      </Seccion>

      <Seccion titulo="Con quién se comparten">
        <p>
          Con <b>nadie más que los cuidadores</b> que tú agregas a ese bebé. No vendemos
          ni compartimos los datos con terceros, ni los usamos para publicidad. Cada
          familia solo ve su propio bebé; nadie puede ver bebés de otras familias.
        </p>
      </Seccion>

      <Seccion titulo="Cuánto tiempo se guardan">
        <p>
          Se guardan mientras el bebé exista en la app. Tú tienes el control: puedes
          <b> exportar</b> una copia (Ajustes → Respaldo) o <b>borrar</b> todo cuando
          quieras.
        </p>
      </Seccion>

      <Seccion titulo="Cómo borrar tus datos">
        <ul>
          <li>
            <b>Borrar el bebé y sus datos</b>: en <b>Ajustes → Zona de datos</b>. Elimina
            el bebé, todos sus registros y las invitaciones, para todos los cuidadores.
          </li>
          <li>
            <b>Salir de un bebé</b>: te quita como cuidador sin borrar los datos de los
            demás.
          </li>
          <li>
            <b>Borrar tu cuenta de Google del todo</b>: escríbenos a{' '}
            <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> y eliminamos lo que haya
            asociado a tu usuario.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Menores de edad">
        <p>
          La app la usan personas adultas que cuidan al bebé. Los datos del bebé los
          cargas y controlas tú como responsable.
        </p>
      </Seccion>

      <Seccion titulo="Contacto">
        <p>
          Dudas o pedidos sobre tus datos:{' '}
          <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
        </p>
      </Seccion>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <section className="politica-seccion">
      <h3>{titulo}</h3>
      {children}
    </section>
  )
}
