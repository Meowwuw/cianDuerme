/**
 * Alimentación complementaria: las comidas del bebé activo.
 *
 * Va aparte de DataContext a propósito: ese ya carga con todo el estado de
 * sueño y tomas, y esto va a crecer (plan semanal, compras). Lo único que le
 * pide prestado es `listo`, el gate de suscripción.
 *
 * Las comidas se cargan enteras, igual que los registros. Es a propósito:
 * `alimentos` es un array de objetos, así que Firestore no puede filtrarlo con
 * array-contains, y cualquier búsqueda por alimento se hace en memoria. Si
 * algún día esto crece a paginado por rango de fechas, el filtro por alimento
 * sigue siendo del cliente.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  ACEPTACIONES,
  MOMENTOS,
  aTimestamp,
  normalizarAlimento,
  normalizarComida,
} from '../lib/datos'
import { useAuth } from './AuthContext'
import { useData } from './DataContext'

const ComidaContext = createContext(null)

/** El valor si está en la lista, si no null. No hay validación en las reglas. */
function opcionValida(valor, opciones) {
  return opciones.includes(valor) ? valor : null
}

/** Texto recortado, o null si quedó vacío. */
function textoONull(valor) {
  const t = String(valor ?? '').trim()
  return t || null
}

function listaAlimentos(alimentos) {
  if (!Array.isArray(alimentos)) return []
  return alimentos.map(normalizarAlimento).filter(Boolean)
}

export function ComidaProvider({ children }) {
  const { user } = useAuth()
  const { baby, listo } = useData()

  const [comidas, setComidas] = useState([])
  const [comidasCargando, setComidasCargando] = useState(true)

  useEffect(() => {
    if (!baby || !listo) {
      setComidas([])
      // Sin bebé no hay nada que esperar; con bebé sin confirmar, sí.
      setComidasCargando(!!baby)
      return
    }
    setComidasCargando(true)
    const q = query(
      collection(db, 'babies', baby.id, 'comidas'),
      orderBy('inicio', 'asc'),
    )
    return onSnapshot(
      q,
      (snap) => {
        setComidas(snap.docs.map((d) => normalizarComida(d.id, d.data())))
        setComidasCargando(false)
      },
      (e) => {
        if (e.code !== 'permission-denied') console.warn('Comidas:', e.code)
        setComidas([])
        setComidasCargando(false)
      },
    )
  }, [baby?.id, listo])

  const refComidas = useCallback(
    (id = baby?.id) => collection(db, 'babies', id, 'comidas'),
    [baby?.id],
  )

  const agregarComida = useCallback(
    async ({ inicio, nombre, momento, alimentos, aceptacion, reaccion, notas }) => {
      if (!baby) return
      await addDoc(refComidas(), {
        inicio: aTimestamp(inicio ?? Date.now()),
        nombre: textoONull(nombre),
        momento: opcionValida(momento, MOMENTOS),
        alimentos: listaAlimentos(alimentos),
        aceptacion: opcionValida(aceptacion, ACEPTACIONES),
        reaccion: textoONull(reaccion),
        notas: textoONull(notas),
        creadoPor: user?.uid || null,
      })
    },
    [baby, refComidas, user],
  )

  // Patch parcial, como editRegistro: solo viaja lo que vino en `cambios`.
  // `creadoPor` nunca se toca: es quién la cargó, no quién la editó.
  const editarComida = useCallback(
    async (id, cambios) => {
      if (!baby) return
      const patch = {}
      if ('inicio' in cambios) patch.inicio = aTimestamp(cambios.inicio)
      if ('nombre' in cambios) patch.nombre = textoONull(cambios.nombre)
      if ('momento' in cambios) {
        patch.momento = opcionValida(cambios.momento, MOMENTOS)
      }
      if ('alimentos' in cambios) patch.alimentos = listaAlimentos(cambios.alimentos)
      if ('aceptacion' in cambios) {
        patch.aceptacion = opcionValida(cambios.aceptacion, ACEPTACIONES)
      }
      if ('reaccion' in cambios) patch.reaccion = textoONull(cambios.reaccion)
      if ('notas' in cambios) patch.notas = textoONull(cambios.notas)
      if (Object.keys(patch).length === 0) return
      await updateDoc(doc(refComidas(), id), patch)
    },
    [baby, refComidas],
  )

  const borrarComida = useCallback(
    async (id) => {
      if (!baby) return
      await deleteDoc(doc(refComidas(), id))
    },
    [baby, refComidas],
  )

  const value = useMemo(
    () => ({
      comidas,
      comidasCargando,
      agregarComida,
      editarComida,
      borrarComida,
    }),
    [comidas, comidasCargando, agregarComida, editarComida, borrarComida],
  )

  return <ComidaContext.Provider value={value}>{children}</ComidaContext.Provider>
}

export function useComidas() {
  const ctx = useContext(ComidaContext)
  if (!ctx) throw new Error('useComidas debe usarse dentro de <ComidaProvider>')
  return ctx
}
