import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useData } from '../context/DataContext'
import { claveRegistro } from '../lib/datos'
import { fechaCorta } from '../lib/tiempo'

const TIPOS_VALIDOS = new Set(['sueño', 'toma'])

/** Un registro del archivo, o null si no sirve. */
function normalizarImportado(r) {
  if (!r || !TIPOS_VALIDOS.has(r.tipo)) return null
  const inicio = Number(r.inicio)
  if (!Number.isFinite(inicio)) return null
  const fin = r.fin == null ? null : Number(r.fin)
  if (fin != null && (!Number.isFinite(fin) || fin < inicio)) return null
  return { tipo: r.tipo, inicio, fin }
}

/** Acepta el archivo entero o solo el array. null si no hay nada usable. */
function leerRegistros(json) {
  const lista = Array.isArray(json)
    ? json
    : Array.isArray(json?.registros)
      ? json.registros
      : null
  return lista ? lista.map(normalizarImportado).filter(Boolean) : null
}

export default function Respaldo() {
  const { baby, registros, importarRegistros } = useData()
  const inputFile = useRef(null)
  const [pendientes, setPendientes] = useState(null)
  const [error, setError] = useState(null)
  const [paso, setPaso] = useState(null)
  const [trabajando, setTrabajando] = useState(false)
  const [resultado, setResultado] = useState(null)

  if (!baby) return null

  const exportar = () => {
    const datos = {
      app: 'cian-duerme',
      version: 1,
      exportadoEn: Date.now(),
      baby: {
        nombre: baby.nombre,
        apodo: baby.apodo,
        emoji: baby.emoji,
        fechaNacimiento: baby.fechaNacimiento,
      },
      registros: registros.map((r) => ({ tipo: r.tipo, inicio: r.inicio, fin: r.fin })),
    }
    const blob = new Blob([JSON.stringify(datos, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = (baby.apodo || baby.nombre || 'bebe').toLowerCase().replace(/\s+/g, '-')
    a.href = url
    a.download = `cian-duerme-${slug}-${fechaCorta(Date.now()).replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const abrirArchivo = () => {
    setError(null)
    setResultado(null)
    inputFile.current?.click()
  }

  const alElegirArchivo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const texto = await file.text()
      const json = JSON.parse(texto)
      const lista = leerRegistros(json)
      if (!lista) {
        setError('El archivo no tiene registros válidos.')
        return
      }
      if (lista.length === 0) {
        setError('No se encontraron registros para importar.')
        return
      }
      setPendientes(lista)
      setPaso('preview')
    } catch {
      setError('No pude leer el archivo (¿es un JSON válido?).')
    }
  }

  // Cuántos entrarían y cuántos se omitirían por duplicado.
  const conteo = (() => {
    if (!pendientes) return { agregados: 0, omitidos: 0 }
    const yaEstan = new Set(registros.map(claveRegistro))
    const vistos = new Set()
    let agregados = 0
    let omitidos = 0
    for (const r of pendientes) {
      const k = claveRegistro(r)
      if (yaEstan.has(k) || vistos.has(k)) omitidos++
      else {
        agregados++
        vistos.add(k)
      }
    }
    return { agregados, omitidos }
  })()

  const cerrar = () => {
    setPaso(null)
    setPendientes(null)
  }

  const agregar = async () => {
    setTrabajando(true)
    const r = await importarRegistros(pendientes, 'merge')
    setTrabajando(false)
    setResultado({ ...r, modo: 'merge' })
    cerrar()
  }

  const reemplazar = async () => {
    setTrabajando(true)
    const r = await importarRegistros(pendientes, 'replace')
    setTrabajando(false)
    setResultado({ ...r, modo: 'replace' })
    cerrar()
  }

  return (
    <>
      <p className="respaldo-txt">
        Descarga una copia de los datos de {baby.apodo || baby.nombre} o restaura desde
        un archivo.
      </p>

      <div className="respaldo-botones">
        <button className="btn-sec respaldo-btn" onClick={exportar}>
          <Download size={18} strokeWidth={1.75} aria-hidden="true" />
          Exportar JSON
        </button>
        <button className="btn-sec respaldo-btn" onClick={abrirArchivo}>
          <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
          Importar JSON
        </button>
      </div>

      <input
        ref={inputFile}
        type="file"
        accept="application/json,.json"
        onChange={alElegirArchivo}
        hidden
      />

      {error && <p className="editor-nota">{error}</p>}

      {resultado && (
        <p className="respaldo-ok">
          {resultado.modo === 'replace'
            ? `Listo: se reemplazaron los datos (${resultado.agregados} registros).`
            : `Listo: se agregaron ${resultado.agregados}${resultado.omitidos ? ` · ${resultado.omitidos} duplicados omitidos` : ''}.`}
        </p>
      )}

      {paso === 'preview' && (
        <div className="modal-fondo" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Importar registros</h3>
            <p className="modal-sub">Se agregan a lo que ya existe, sin duplicar.</p>
            <p className="respaldo-resumen">
              Se agregarán <strong>{conteo.agregados}</strong>
              {conteo.omitidos > 0 && (
                <>
                  {' · se omitirán '}
                  <strong>{conteo.omitidos}</strong> duplicados
                </>
              )}
              .
            </p>
            <div className="modal-botones">
              <button className="btn-sec" onClick={cerrar} disabled={trabajando}>
                Cancelar
              </button>
              <button
                className="btn-pri"
                onClick={agregar}
                disabled={trabajando || conteo.agregados === 0}
              >
                {trabajando ? 'Importando…' : 'Agregar'}
              </button>
            </div>
            <button
              className="btn-borrar-link"
              onClick={() => setPaso('confirmReplace')}
              disabled={trabajando}
            >
              Reemplazar todo (borra los actuales)
            </button>
          </div>
        </div>
      )}

      {paso === 'confirmReplace' && (
        <div className="modal-fondo" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>¿Reemplazar todo?</h3>
            <p className="modal-sub">
              Esto borra los <strong>{registros.length}</strong> registros actuales de{' '}
              {baby.apodo || baby.nombre} y deja solo los{' '}
              <strong>{pendientes?.length ?? 0}</strong> del archivo. No se puede
              deshacer.
            </p>
            <div className="modal-botones">
              <button
                className="btn-sec"
                onClick={() => setPaso('preview')}
                disabled={trabajando}
              >
                Volver
              </button>
              <button className="btn-peligro" onClick={reemplazar} disabled={trabajando}>
                {trabajando ? 'Reemplazando…' : 'Sí, reemplazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
