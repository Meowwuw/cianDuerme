import { useState } from 'react'
import { Check, LogOut, Palette, Plus, Settings, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { inicialDe, nombreCorto } from '../lib/datos'
import PanelInvitar from './PanelInvitar'

export default function MenuBebe({ onCerrar, onIrAjustes }) {
  const { baby, babies, activeBabyId, setActiveBaby } = useData()
  const { themes, themeId, setTheme } = useTheme()
  const { logout } = useAuth()
  const [invitarAbierto, setInvitarAbierto] = useState(false)

  const irAjustes = () => {
    onIrAjustes?.()
    onCerrar()
  }

  return (
    <div className="sheet-fondo" onClick={onCerrar}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Menú del bebé"
      >
        <div className="sheet-handle" />

        <div className="sheet-baby">
          <span className="sheet-baby-avatar">{baby?.emoji || inicialDe(baby)}</span>
          <div className="sheet-baby-info">
            <span className="sheet-baby-apodo">{nombreCorto(baby)}</span>
            {baby?.nombre && baby.nombre !== nombreCorto(baby) && (
              <span className="sheet-baby-nombre">{baby.nombre}</span>
            )}
          </div>
        </div>

        <div className="sheet-seccion">
          <div className="sheet-seccion-tit">
            <Users size={16} strokeWidth={1.75} /> Cambiar de bebé
          </div>
          <div className="sheet-babylist">
            {babies.map((b) => (
              <button
                key={b.id}
                className={`sheet-babyitem ${b.id === activeBabyId ? 'sheet-babyitem--activo' : ''}`}
                onClick={() => {
                  setActiveBaby(b.id)
                  onCerrar()
                }}
              >
                <span className="sheet-babyitem-avatar">{b.emoji || inicialDe(b)}</span>
                <span className="sheet-babyitem-nombre">{nombreCorto(b)}</span>
                {b.id === activeBabyId && (
                  <Check size={16} strokeWidth={2.5} className="sheet-babyitem-check" />
                )}
              </button>
            ))}
            <button className="sheet-babyitem sheet-babyitem--add" onClick={irAjustes}>
              <Plus size={18} strokeWidth={2} /> Agregar bebé
            </button>
          </div>
        </div>

        <div className="sheet-seccion">
          <button
            className="sheet-accion"
            onClick={() => setInvitarAbierto((v) => !v)}
          >
            <UserPlus size={18} strokeWidth={1.75} />
            <span>Invitar cuidador</span>
          </button>
          {invitarAbierto && (
            <div className="sheet-invite">
              <PanelInvitar />
            </div>
          )}
        </div>

        <div className="sheet-seccion">
          <div className="sheet-seccion-tit">
            <Palette size={16} strokeWidth={1.75} /> Tema
          </div>
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
        </div>

        <div className="sheet-seccion sheet-seccion--acciones">
          <button className="sheet-accion" onClick={irAjustes}>
            <Settings size={18} strokeWidth={1.75} />
            <span>Ajustes</span>
          </button>
          <button className="sheet-accion sheet-accion--salir" onClick={logout}>
            <LogOut size={18} strokeWidth={1.75} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  )
}
