import { useState } from 'react'
import { Baby, KeyRound } from 'lucide-react'
import { useData } from '../context/DataContext'
import Mascota from '../components/Mascota'
import DatePicker from '../components/DatePicker'

const EMOJIS = ['🐤', '🍼', '🌙', '⭐️', '🐻', '🐰', '🦆', '🌸']

export default function Onboarding({ codigoInicial = null, onListo }) {
  const [modo, setModo] = useState(codigoInicial ? 'unir' : null)

  return (
    <div className="onb">
      <Mascota estado="despierto" size={150} />
      <h1 className="onb-titulo">Hola</h1>

      {modo === null && (
        <>
          <p className="onb-sub">¿Cómo quieres empezar?</p>
          <div className="onb-opciones">
            <button className="onb-card" onClick={() => setModo('crear')}>
              <Baby
                className="onb-card-icono"
                size={30}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="onb-card-titulo">Agregar nuevo bebé</span>
              <span className="onb-card-sub">Registra su sueño y tomas desde cero.</span>
            </button>
            <button className="onb-card" onClick={() => setModo('unir')}>
              <KeyRound
                className="onb-card-icono"
                size={30}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="onb-card-titulo">Tengo un código de invitación</span>
              <span className="onb-card-sub">Súmate al bebé de la familia.</span>
            </button>
          </div>
        </>
      )}

      {modo === 'crear' && (
        <FormAgregarBebe onVolver={() => setModo(null)} onListo={onListo} />
      )}
      {modo === 'unir' && (
        <FormUnirse
          codigoInicial={codigoInicial}
          onVolver={() => setModo(null)}
          onListo={onListo}
        />
      )}
    </div>
  )
}

function FormAgregarBebe({ onVolver, onListo }) {
  const { crearBebe } = useData()
  const [nombre, setNombre] = useState('')
  const [apodo, setApodo] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState(null)
  const [emoji, setEmoji] = useState('🐤')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('Pon el nombre del bebé.')
    setEnviando(true)
    setError(null)
    try {
      await crearBebe({ nombre, apodo, emoji, fechaNacimiento })
      onListo?.()
    } catch (err) {
      setError(err.message || 'No se pudo crear.')
      setEnviando(false)
    }
  }

  return (
    <form className="onb-form" onSubmit={enviar}>
      <button type="button" className="link-sutil onb-volver" onClick={onVolver}>
        ‹ Volver
      </button>
      <h2 className="onb-form-titulo">Agregar bebé</h2>

      <label className="ajuste-label">Nombre</label>
      <input
        className="input-texto"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="¿Cómo se llama?"
        autoFocus
      />

      <label className="ajuste-label">Apodo (para mostrar en la app)</label>
      <input
        className="input-texto"
        value={apodo}
        onChange={(e) => setApodo(e.target.value)}
        placeholder={nombre.trim() ? nombre.trim().split(/\s+/)[0] : 'Corto y cariñoso'}
        maxLength={14}
      />

      <label className="ajuste-label">Fecha de nacimiento (opcional)</label>
      <DatePicker
        value={fechaNacimiento}
        onChange={setFechaNacimiento}
        max={Date.now()}
        placeholder="Elegir fecha"
      />

      <label className="ajuste-label">Emoji (opcional)</label>
      <div className="emoji-fila">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className={`emoji-chip ${emoji === e ? 'emoji-chip--sel' : ''}`}
            onClick={() => setEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>

      {error && <p className="login-error">{error}</p>}

      <button className="btn-pri onb-submit" disabled={enviando}>
        {enviando ? 'Creando…' : 'Crear y empezar'}
      </button>
    </form>
  )
}

function FormUnirse({ codigoInicial, onVolver, onListo }) {
  const { unirseConCodigo } = useData()
  const [codigo, setCodigo] = useState(codigoInicial || '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await unirseConCodigo(codigo)
      onListo?.()
    } catch (err) {
      setError(err.message || 'No se pudo unir.')
      setEnviando(false)
    }
  }

  return (
    <form className="onb-form" onSubmit={enviar}>
      <button type="button" className="link-sutil onb-volver" onClick={onVolver}>
        ‹ Volver
      </button>
      <h2 className="onb-form-titulo">Unirme con un código</h2>
      <p className="onb-sub">Pega el código que te compartió tu pareja.</p>
      <input
        className="input-texto input-codigo"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        placeholder="ABC123"
        maxLength={8}
        autoFocus
        autoCapitalize="characters"
        autoCorrect="off"
      />
      {error && <p className="login-error">{error}</p>}
      <button className="btn-pri onb-submit" disabled={enviando || !codigo.trim()}>
        {enviando ? 'Uniéndome…' : 'Unirme'}
      </button>
    </form>
  )
}
