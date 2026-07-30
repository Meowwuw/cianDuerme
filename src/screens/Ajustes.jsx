import { useState } from 'react'
import { ChevronRight, Plus, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import PanelInvitar from '../components/PanelInvitar'
import Respaldo from '../components/Respaldo'
import ZonaDeDatos from '../components/ZonaDeDatos'
import Onboarding from './Onboarding'
import Privacidad from './Privacidad'

export default function Ajustes() {
  const {
    baby,
    babies,
    activeBabyId,
    setActiveBaby,
    setNombre,
    setApodo,
    notasContextoActivas,
    setNotasContexto,
  } = useData()
  const { themes, themeId, setTheme } = useTheme()
  const { user, logout } = useAuth()

  const [agregando, setAgregando] = useState(false)
  const [viendoPrivacidad, setViendoPrivacidad] = useState(false)

  if (viendoPrivacidad) return <Privacidad onVolver={() => setViendoPrivacidad(false)} />

  if (agregando)
    return (
      <div className="pantalla">
        <Onboarding onListo={() => setAgregando(false)} />
        <button className="link-sutil onb-cancelar" onClick={() => setAgregando(false)}>
          Cancelar
        </button>
      </div>
    )

  return (
    <div className="pantalla">
      <h2 className="pantalla-titulo">Ajustes</h2>

      {user && (
        <section className="ajuste-bloque cuenta">
          {user.photoURL && <img className="cuenta-foto" src={user.photoURL} alt="" />}
          <div className="cuenta-info">
            <span className="cuenta-nombre">{user.displayName || 'Cuidador/a'}</span>
            <span className="cuenta-email">{user.email}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            Salir
          </button>
        </section>
      )}

      <section className="ajuste-bloque">
        <span className="ajuste-label">Bebés</span>
        <div className="baby-lista">
          {babies.map((b) => (
            <button
              key={b.id}
              className={`baby-item ${b.id === activeBabyId ? 'baby-item--activo' : ''}`}
              onClick={() => setActiveBaby(b.id)}
            >
              <span className="baby-item-emoji">{b.emoji || '🐤'}</span>
              <span className="baby-item-nombre">{b.nombre}</span>
              <span className="baby-item-cuid">
                {b.cuidadores.length} cuidador{b.cuidadores.length !== 1 ? 'es' : ''}
              </span>
            </button>
          ))}
        </div>
        <button className="btn-sec btn-agregar-baby" onClick={() => setAgregando(true)}>
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          Agregar otro bebé
        </button>
      </section>

      {baby && (
        <section className="ajuste-bloque">
          <label className="ajuste-label">Nombre del bebé</label>
          <input
            className="input-texto"
            value={baby.nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <label className="ajuste-label" style={{ marginTop: 12 }}>
            Apodo (para mostrar en la app)
          </label>
          <input
            className="input-texto"
            value={baby.apodo || ''}
            onChange={(e) => setApodo(e.target.value)}
            placeholder={baby.nombre?.split(/\s+/)[0] || 'Corto y cariñoso'}
            maxLength={14}
          />
        </section>
      )}

      {baby && (
        <section className="ajuste-bloque">
          <span className="ajuste-label">Invitar cuidador</span>
          <PanelInvitar />
        </section>
      )}

      <section className="ajuste-bloque">
        <label className="ajuste-label">Tema</label>
        <div className="tema-opciones">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`tema-chip ${themeId === t.id ? 'tema-chip--activo' : ''}`}
              onClick={() => setTheme(t.id)}
              style={{
                background: t.vars['--bg'],
                color: t.vars['--deep'],
                borderColor: t.vars['--accent'],
              }}
            >
              <span
                className="tema-chip-punto"
                style={{ background: t.vars['--accent'] }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {baby && (
        <section className="ajuste-bloque">
          <span className="ajuste-label">Respaldo</span>
          <Respaldo />
        </section>
      )}

      {baby && (
        <section className="ajuste-bloque">
          <span className="ajuste-label">Notas de contexto</span>
          <div className="switch-fila">
            <span className="switch-txt">
              Mostrar notas de contexto
              <span className="switch-sub">
                Mensajes suaves sobre el ritmo de tu bebé. Puedes apagarlos cuando
                quieras.
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={notasContextoActivas}
              aria-label="Mostrar notas de contexto"
              className={`switch ${notasContextoActivas ? 'switch--on' : ''}`}
              onClick={() => setNotasContexto(!notasContextoActivas)}
            >
              <span className="switch-bolita" />
            </button>
          </div>
        </section>
      )}

      <section className="ajuste-bloque">
        <span className="ajuste-label">Privacidad</span>
        <button className="privacidad-link" onClick={() => setViendoPrivacidad(true)}>
          <span className="privacidad-link-txt">
            <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
            Política de privacidad
          </span>
          <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </section>

      {baby && (
        <section className="ajuste-bloque">
          <span className="ajuste-label">Zona de datos</span>
          <ZonaDeDatos />
        </section>
      )}
    </div>
  )
}
