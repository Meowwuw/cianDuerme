import { useState } from 'react'
import { Check } from 'lucide-react'
import { useData } from '../context/DataContext'
import { INVITE_DIAS } from '../lib/datos'

export default function PanelInvitar() {
  const { baby, generarInvite, revocarInvite } = useData()
  const [cargando, setCargando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState(null)

  const codigo = baby?.inviteActual || null
  const link = codigo ? `${window.location.origin}/join?code=${codigo}` : null

  const generar = async () => {
    setCargando(true)
    setError(null)
    try {
      await generarInvite()
    } catch (e) {
      setError(e.message || 'No se pudo generar el código.')
    } finally {
      setCargando(false)
    }
  }

  const revocar = async () => {
    setCargando(true)
    setError(null)
    try {
      await revocarInvite()
    } catch (e) {
      setError(e.message || 'No se pudo revocar.')
    } finally {
      setCargando(false)
    }
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      setError('No se pudo copiar. Copia el link a mano.')
    }
  }

  const mensaje = `Te invito a cuidar a ${baby?.nombre} en Cian duerme 🐤
Abre este link: ${link}
(o entra con el código ${codigo})`

  return (
    <div>
      <p className="ajuste-desc">
        Comparte este código con tu pareja para que registre a la par. Vale para{' '}
        <b>un uso</b> y vence en <b>{INVITE_DIAS} días</b>.
      </p>

      {!codigo && (
        <button className="btn-pri" onClick={generar} disabled={cargando}>
          {cargando ? 'Generando…' : 'Invitar cuidador'}
        </button>
      )}

      {codigo && (
        <div className="invite-box">
          <div className="invite-code" aria-label="Código de invitación">
            {codigo}
          </div>
          <div className="invite-link">{link}</div>
          <div className="invite-botones">
            <button className="btn-sec btn-con-icono" onClick={copiar}>
              {copiado && <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
              {copiado ? '¡Copiado!' : 'Copiar link'}
            </button>
            <a
              className="btn-pri btn-como-link"
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
          <div className="invite-botones-sec">
            <button className="link-sutil" onClick={generar} disabled={cargando}>
              Regenerar
            </button>
            <button
              className="link-sutil link-peligro"
              onClick={revocar}
              disabled={cargando}
            >
              Revocar
            </button>
          </div>
        </div>
      )}

      {error && <p className="login-error">{error}</p>}
    </div>
  )
}
