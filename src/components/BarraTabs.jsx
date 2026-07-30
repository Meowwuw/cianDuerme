import { CalendarDays, Clock, Settings, Sun } from 'lucide-react'

const TABS = [
  { id: 'ahora', label: 'Ahora', Icon: Clock },
  { id: 'hoy', label: 'Hoy', Icon: Sun },
  { id: 'historial', label: 'Historial', Icon: CalendarDays },
  { id: 'ajustes', label: 'Ajustes', Icon: Settings },
]

export default function BarraTabs({ activa, onChange }) {
  return (
    <nav className="tabbar" aria-label="Navegación principal">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab ${activa === id ? 'tab--activa' : ''}`}
          onClick={() => onChange(id)}
          aria-current={activa === id ? 'page' : undefined}
        >
          <Icon className="tab-icon" size={24} strokeWidth={1.75} aria-hidden="true" />
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
