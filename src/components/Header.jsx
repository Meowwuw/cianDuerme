import { useState } from 'react'
import { useData } from '../context/DataContext'
import { inicialDe, nombreCorto } from '../lib/datos'
import MenuBebe from './MenuBebe'

export default function Header({ onIrAjustes }) {
  const { baby } = useData()
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <>
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">
            <span className="app-title__cian">Cian</span> duerme
          </h1>
          {baby && <span className="app-apodo">{nombreCorto(baby)}</span>}
        </div>
        <button
          className="avatar-btn"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú del bebé"
        >
          {baby?.emoji ? (
            <span className="avatar-emoji">{baby.emoji}</span>
          ) : (
            <span className="avatar-inicial">{inicialDe(baby)}</span>
          )}
        </button>
      </header>
      {menuAbierto && (
        <MenuBebe onCerrar={() => setMenuAbierto(false)} onIrAjustes={onIrAjustes} />
      )}
    </>
  )
}
