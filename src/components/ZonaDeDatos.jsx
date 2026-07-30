import { useState } from 'react'
import { LogOut, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export default function ZonaDeDatos() {
  const { baby, borrarBebe, salirDelBebe } = useData()
  const { user } = useAuth()
  const [dialogo, setDialogo] = useState(null)
  const [texto, setTexto] = useState('')
  const [trabajando, setTrabajando] = useState(false)

  if (!baby) return null

  const soyCreador = user?.uid === baby.creadoPor
  const hayEquipo = (baby.cuidadores?.length || 1) > 1
  const nombre = (baby.apodo || baby.nombre || '').trim()
  // Confirmación en dos pasos: hay que escribir el nombre del bebé.
  const confirmado = texto.trim().toLowerCase() === nombre.toLowerCase()

  const cerrar = () => {
    setDialogo(null)
    setTexto('')
  }

  const borrar = async () => {
    setTrabajando(true)
    await borrarBebe()
    setTrabajando(false)
    cerrar()
  }

  const salir = async () => {
    setTrabajando(true)
    await salirDelBebe()
    setTrabajando(false)
    cerrar()
  }

  return (
    <>
      <p className="respaldo-txt">
        Estas acciones borran datos y no se pueden deshacer.
      </p>

      {!soyCreador && (
        <button className="btn-sec zona-btn" onClick={() => setDialogo('salir')}>
          <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          Salir de este bebé
        </button>
      )}

      {soyCreador && hayEquipo && (
        <p className="zona-nota">
          Como creaste este bebé, no puedes salir dejándolo a otros cuidadores. Puedes
          borrarlo por completo, o más adelante podrás transferir la administración.
        </p>
      )}

      {soyCreador && (
        <button className="btn-borrar-full" onClick={() => setDialogo('borrar')}>
          <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Borrar este bebé y sus datos
        </button>
      )}

      {dialogo === 'salir' && (
        <div className="modal-fondo" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Salir de {nombre}</h3>
            <p className="modal-sub">
              Te quitas como cuidador/a. Los datos siguen para el resto del equipo.
              Puedes volver a entrar con una invitación nueva.
            </p>
            <div className="modal-botones">
              <button className="btn-sec" onClick={cerrar} disabled={trabajando}>
                Cancelar
              </button>
              <button className="btn-pri" onClick={salir} disabled={trabajando}>
                {trabajando ? 'Saliendo…' : 'Salir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogo === 'borrar' && (
        <div className="modal-fondo" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Borrar {nombre} y sus datos</h3>
            <p className="modal-sub">
              Esto elimina el bebé, <b>todos sus registros</b> y las invitaciones
              {hayEquipo ? ', para todos los cuidadores' : ''}. No se puede deshacer.
            </p>
            <label className="ajuste-label" htmlFor="confirmBorrar">
              Escribe <b>{nombre}</b> para confirmar
            </label>
            <input
              id="confirmBorrar"
              className="input-texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={nombre}
              autoComplete="off"
            />
            <div className="modal-botones">
              <button className="btn-sec" onClick={cerrar} disabled={trabajando}>
                Cancelar
              </button>
              <button
                className="btn-peligro"
                onClick={borrar}
                disabled={trabajando || !confirmado}
              >
                {trabajando ? 'Borrando…' : 'Borrar todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
