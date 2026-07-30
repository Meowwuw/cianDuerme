import { useState } from 'react'
import { CircleStop, Milk, Moon, Sun } from 'lucide-react'
import { useData } from '../context/DataContext'
import { horaCorta } from '../lib/tiempo'
import Mascota from '../components/Mascota'
import Crono from '../components/Crono'
import ModalAjustarHora from '../components/ModalAjustarHora'

export default function Ahora() {
  const {
    baby,
    seDurmio,
    seDesperto,
    empezarToma,
    terminarToma,
    ajustarInicioEstado,
    ajustarInicioToma,
  } = useData()

  const [ajustando, setAjustando] = useState(null)

  const dormido = baby.estadoActual.modo === 'dormido'
  const tomando = !!baby.tomaActiva
  const estado = tomando ? 'tomando' : dormido ? 'dormido' : 'despierto'

  return (
    <div className="pantalla ahora">
      <div className="ahora-hero">
        <Mascota estado={estado} size={220} />

        <p className="ahora-estado-txt">
          {dormido ? 'Durmiendo' : 'Despierto'}
          {tomando && (
            <>
              {' · tomando '}
              <Milk
                className="icono-inline"
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </>
          )}
        </p>

        <Crono desde={baby.estadoActual.desde} className="crono--grande" />

        <button className="link-sutil" onClick={() => setAjustando('estado')}>
          desde {horaCorta(baby.estadoActual.desde)} · ajustar
        </button>
      </div>

      <div className="ahora-acciones">
        <button
          className={`btn-grande btn-gota ${dormido ? 'btn-grande--despertar' : 'btn-grande--dormir'}`}
          onClick={dormido ? seDesperto : seDurmio}
        >
          {dormido ? (
            <Sun size={26} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Moon size={26} strokeWidth={1.75} aria-hidden="true" />
          )}
          {dormido ? 'Se despertó' : 'Se durmió'}
        </button>

        <div className="toma-fila">
          <button
            className={`btn-toma ${tomando ? 'btn-toma--activa' : ''}`}
            onClick={tomando ? terminarToma : empezarToma}
          >
            {tomando ? (
              <CircleStop size={22} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Milk size={22} strokeWidth={1.75} aria-hidden="true" />
            )}
            {tomando ? 'Terminar toma' : 'Empezar toma'}
          </button>

          {tomando && (
            <div className="toma-info">
              <Crono desde={baby.tomaActiva.inicio} />
              <button className="link-sutil" onClick={() => setAjustando('toma')}>
                ajustar inicio
              </button>
            </div>
          )}
        </div>
      </div>

      {ajustando && (
        <ModalAjustarHora
          titulo={
            ajustando === 'estado' ? 'Inicio del estado actual' : 'Inicio de la toma'
          }
          valor={
            ajustando === 'estado' ? baby.estadoActual.desde : baby.tomaActiva.inicio
          }
          onGuardar={(ms) => {
            if (ajustando === 'estado') ajustarInicioEstado(ms)
            else ajustarInicioToma(ms)
            setAjustando(null)
          }}
          onCancelar={() => setAjustando(null)}
        />
      )}
    </div>
  )
}
