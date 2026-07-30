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
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../lib/firebase'
import {
  CLAVE_BABY_ACTIVO,
  INVITE_DIAS,
  aTimestamp,
  claveRegistro,
  codigoDeUrl,
  generarCodigo,
  normalizarBebe,
  normalizarRegistro,
} from '../lib/datos'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

/** Firestore limita a 500 ops por batch; 450 deja aire. */
async function commitEnLotes(ops, colRef) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db)
    for (const op of ops.slice(i, i + 450)) {
      if (op.tipo === 'del') {
        batch.delete(doc(colRef, op.id))
      } else {
        batch.set(doc(colRef), {
          tipo: op.data.tipo,
          inicio: aTimestamp(op.data.inicio),
          fin: op.data.fin != null ? aTimestamp(op.data.fin) : null,
        })
      }
    }
    await batch.commit()
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid

  const [babies, setBabies] = useState([])
  const [babiesCargando, setBabiesCargando] = useState(true)
  const [registros, setRegistros] = useState([])
  const [codigoUrl, setCodigoUrl] = useState(codigoDeUrl)
  const [prefs, setPrefs] = useState({})
  const [prefsCargadas, setPrefsCargadas] = useState(false)
  // Bebés ya confirmados por el server. Sin esto, suscribirse a la
  // subcolección de un bebé recién creado localmente da permission-denied,
  // porque las reglas todavía no lo ven como existente.
  const [confirmados, setConfirmados] = useState(() => new Set())
  const [activeBabyId, setActiveBabyId] = useState(
    () => localStorage.getItem(CLAVE_BABY_ACTIVO) || null,
  )

  // --- bebés donde soy cuidador ---
  useEffect(() => {
    if (!uid) return
    setBabiesCargando(true)
    setConfirmados(new Set())

    const q = query(
      collection(db, 'babies'),
      where('cuidadores', 'array-contains', uid),
    )

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const lista = snap.docs.map((d) => normalizarBebe(d.id, d.data()))
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre))
        setBabies(lista)
        setBabiesCargando(false)

        const desdeServer = snap.docs
          .filter((d) => !d.metadata.hasPendingWrites)
          .map((d) => d.id)
        setConfirmados((prev) => {
          let cambio = false
          const next = new Set(prev)
          for (const id of desdeServer) {
            if (!next.has(id)) {
              next.add(id)
              cambio = true
            }
          }
          return cambio ? next : prev
        })
      },
      (e) => {
        console.error('Error leyendo bebés:', e)
        setBabiesCargando(false)
      },
    )
  }, [uid])

  // --- preferencias del usuario ---
  useEffect(() => {
    if (!uid) {
      setPrefs({})
      setPrefsCargadas(false)
      return
    }
    setPrefsCargadas(false)
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        setPrefs(snap.exists() ? snap.data() : {})
        setPrefsCargadas(true)
      },
      (e) => {
        console.error('Error leyendo preferencias:', e)
        setPrefsCargadas(true)
      },
    )
  }, [uid])

  const baby = useMemo(() => {
    if (babies.length === 0) return null
    return babies.find((b) => b.id === activeBabyId) || babies[0]
  }, [babies, activeBabyId])

  useEffect(() => {
    if (baby && baby.id !== activeBabyId) setActiveBabyId(baby.id)
  }, [baby, activeBabyId])

  useEffect(() => {
    if (activeBabyId) localStorage.setItem(CLAVE_BABY_ACTIVO, activeBabyId)
  }, [activeBabyId])

  const listo = !!baby && confirmados.has(baby.id)

  // --- registros del bebé activo ---
  useEffect(() => {
    if (!baby || !listo) {
      setRegistros([])
      return
    }
    const q = query(
      collection(db, 'babies', baby.id, 'registros'),
      orderBy('inicio', 'asc'),
    )
    return onSnapshot(
      q,
      (snap) => setRegistros(snap.docs.map((d) => normalizarRegistro(d.id, d.data()))),
      (e) => {
        if (e.code !== 'permission-denied') console.warn('Registros:', e.code)
        setRegistros([])
      },
    )
  }, [baby?.id, listo])

  const refBaby = useCallback(
    (id = baby?.id) => doc(db, 'babies', id),
    [baby?.id],
  )
  const refRegistros = useCallback(
    (id = baby?.id) => collection(db, 'babies', id, 'registros'),
    [baby?.id],
  )

  // --- sueño ---
  const seDurmio = useCallback(async () => {
    if (!baby || baby.estadoActual.modo === 'dormido') return
    const ahora = Date.now()
    const batch = writeBatch(db)
    batch.update(refBaby(), {
      'estadoActual.modo': 'dormido',
      'estadoActual.desde': aTimestamp(ahora),
    })
    batch.set(doc(refRegistros()), {
      tipo: 'sueño',
      inicio: aTimestamp(ahora),
      fin: null,
    })
    await batch.commit()
  }, [baby, refBaby, refRegistros])

  const seDesperto = useCallback(async () => {
    if (!baby || baby.estadoActual.modo === 'despierto') return
    const ahora = Date.now()
    const batch = writeBatch(db)
    batch.update(refBaby(), {
      'estadoActual.modo': 'despierto',
      'estadoActual.desde': aTimestamp(ahora),
    })
    // Cierra el último sueño abierto.
    const abierto = [...registros]
      .reverse()
      .find((r) => r.tipo === 'sueño' && r.fin == null)
    if (abierto) {
      batch.update(doc(refRegistros(), abierto.id), { fin: aTimestamp(ahora) })
    }
    await batch.commit()
  }, [baby, registros, refBaby, refRegistros])

  // --- tomas ---
  const empezarToma = useCallback(async () => {
    if (!baby || baby.tomaActiva) return
    await updateDoc(refBaby(), {
      tomaActiva: { inicio: aTimestamp(Date.now()) },
    })
  }, [baby, refBaby])

  const terminarToma = useCallback(async () => {
    if (!baby || !baby.tomaActiva) return
    const ahora = Date.now()
    const batch = writeBatch(db)
    batch.set(doc(refRegistros()), {
      tipo: 'toma',
      inicio: aTimestamp(baby.tomaActiva.inicio),
      fin: aTimestamp(ahora),
    })
    batch.update(refBaby(), { tomaActiva: null })
    await batch.commit()
  }, [baby, refBaby, refRegistros])

  // --- ajustes de hora ("desde 20:58 · ajustar") ---
  const ajustarInicioEstado = useCallback(
    async (millis) => {
      if (!baby) return
      const batch = writeBatch(db)
      batch.update(refBaby(), { 'estadoActual.desde': aTimestamp(millis) })
      // Si está dormido, el registro abierto tiene que moverse igual.
      if (baby.estadoActual.modo === 'dormido') {
        const abierto = [...registros]
          .reverse()
          .find((r) => r.tipo === 'sueño' && r.fin == null)
        if (abierto) {
          batch.update(doc(refRegistros(), abierto.id), {
            inicio: aTimestamp(millis),
          })
        }
      }
      await batch.commit()
    },
    [baby, registros, refBaby, refRegistros],
  )

  const ajustarInicioToma = useCallback(
    async (millis) => {
      if (!baby || !baby.tomaActiva) return
      await updateDoc(refBaby(), { 'tomaActiva.inicio': aTimestamp(millis) })
    },
    [baby, refBaby],
  )

  const ajustarEstadoActual = useCallback(
    async (modo, desde) => {
      if (!baby) return
      await updateDoc(refBaby(), {
        estadoActual: { modo, desde: aTimestamp(desde) },
      })
    },
    [baby, refBaby],
  )

  // --- CRUD de registros ---
  const addRegistro = useCallback(
    async ({ tipo, inicio, fin }) => {
      if (!baby) return
      await addDoc(refRegistros(), {
        tipo,
        inicio: aTimestamp(inicio),
        fin: fin != null ? aTimestamp(fin) : null,
      })
    },
    [baby, refRegistros],
  )

  const editRegistro = useCallback(
    async (id, cambios) => {
      if (!baby) return
      const patch = {}
      if ('tipo' in cambios) patch.tipo = cambios.tipo
      if ('inicio' in cambios) patch.inicio = aTimestamp(cambios.inicio)
      if ('fin' in cambios) {
        patch.fin = cambios.fin != null ? aTimestamp(cambios.fin) : null
      }
      await updateDoc(doc(refRegistros(), id), patch)
    },
    [baby, refRegistros],
  )

  const deleteRegistro = useCallback(
    async (id) => {
      if (!baby) return
      await deleteDoc(doc(refRegistros(), id))
    },
    [baby, refRegistros],
  )

  // --- importar / respaldo ---
  const importarRegistros = useCallback(
    async (nuevos, modo = 'merge') => {
      if (!baby) return { agregados: 0, omitidos: 0 }
      const colRef = refRegistros()

      if (modo === 'replace') {
        const ops = [
          ...registros.map((r) => ({ tipo: 'del', id: r.id })),
          ...nuevos.map((r) => ({ tipo: 'set', data: r })),
        ]
        await commitEnLotes(ops, colRef)
        return { agregados: nuevos.length, omitidos: 0 }
      }

      // merge: deduplica por tipo+inicio+fin
      const vistos = new Set(registros.map(claveRegistro))
      let omitidos = 0
      const aAgregar = nuevos.filter((r) => {
        const k = claveRegistro(r)
        if (vistos.has(k)) {
          omitidos++
          return false
        }
        vistos.add(k)
        return true
      })
      await commitEnLotes(
        aAgregar.map((r) => ({ tipo: 'set', data: r })),
        colRef,
      )
      return { agregados: aAgregar.length, omitidos }
    },
    [baby, registros, refRegistros],
  )

  // --- borrar / salir ---
  const borrarBebe = useCallback(
    async (id = baby?.id) => {
      if (!id) return
      const colRef = collection(db, 'babies', id, 'registros')
      const snap = await getDocs(colRef)
      await commitEnLotes(
        snap.docs.map((d) => ({ tipo: 'del', id: d.id })),
        colRef,
      )
      const b = babies.find((x) => x.id === id)
      if (b?.inviteActual) {
        await deleteDoc(doc(db, 'invites', b.inviteActual)).catch(() => {})
      }
      await deleteDoc(doc(db, 'babies', id))
    },
    [baby, babies],
  )

  const salirDelBebe = useCallback(
    async (id = baby?.id) => {
      if (!id || !uid) return
      await updateDoc(doc(db, 'babies', id), { cuidadores: arrayRemove(uid) })
    },
    [baby, uid],
  )

  // --- preferencias ---
  const notasContextoActivas = baby
    ? !(prefs.notasOcultas || []).includes(baby.id)
    : true

  const setNotasContexto = useCallback(
    async (activas) => {
      if (!uid || !baby) return
      await setDoc(
        doc(db, 'users', uid),
        {
          notasOcultas: activas ? arrayRemove(baby.id) : arrayUnion(baby.id),
        },
        { merge: true },
      )
    },
    [uid, baby],
  )

  const bienvenidaVista = !!prefs.bienvenidaVista

  const marcarBienvenida = useCallback(async () => {
    if (!uid) return
    await setDoc(doc(db, 'users', uid), { bienvenidaVista: true }, { merge: true })
  }, [uid])

  // --- datos del bebé ---
  const setNombre = useCallback(
    async (nombre) => {
      if (baby) await updateDoc(refBaby(), { nombre })
    },
    [baby, refBaby],
  )

  const setApodo = useCallback(
    async (apodo) => {
      if (baby) await updateDoc(refBaby(), { apodo })
    },
    [baby, refBaby],
  )

  const setEmoji = useCallback(
    async (emoji) => {
      if (baby) await updateDoc(refBaby(), { emoji })
    },
    [baby, refBaby],
  )

  const crearBebe = useCallback(
    async ({ nombre, apodo, fechaNacimiento, emoji }) => {
      if (!uid) throw new Error('No hay sesión')
      const nombreFinal = nombre.trim() || 'Bebé'
      const ref = await addDoc(collection(db, 'babies'), {
        nombre: nombreFinal,
        apodo: (apodo || '').trim() || nombreFinal.split(/\s+/)[0],
        emoji: emoji || null,
        fechaNacimiento: fechaNacimiento != null ? aTimestamp(fechaNacimiento) : null,
        cuidadores: [uid],
        creadoPor: uid,
        creadoEn: serverTimestamp(),
        estadoActual: { modo: 'despierto', desde: aTimestamp(Date.now()) },
        tomaActiva: null,
        inviteActual: null,
      })
      setActiveBabyId(ref.id)
      return ref.id
    },
    [uid],
  )

  // --- invitaciones ---
  const unirseConCodigo = useCallback(
    async (codigo) => {
      if (!uid) throw new Error('No hay sesión')
      const code = String(codigo || '').trim().toUpperCase()
      if (!code) throw new Error('Escribe un código.')

      // El canje va por Cloud Function: el cliente no puede agregarse
      // a cuidadores[] por su cuenta.
      const canjear = httpsCallable(functions, 'canjearInvite')
      let babyId
      try {
        babyId = (await canjear({ code })).data?.babyId
      } catch (e) {
        throw new Error(e?.message || 'No se pudo canjear el código.')
      }
      if (!babyId) throw new Error('No se pudo canjear el código.')

      setActiveBabyId(babyId)
      setCodigoUrl(null)
      // Limpia el ?code= de la URL para que no se re-canjee al recargar.
      if (window.history?.replaceState) {
        window.history.replaceState({}, '', window.location.pathname)
      }
      return babyId
    },
    [uid],
  )

  const generarInvite = useCallback(async () => {
    if (!baby || !uid) throw new Error('No hay bebé activo')
    const code = generarCodigo(6)
    const expiraEn = aTimestamp(Date.now() + INVITE_DIAS * 24 * 3600 * 1000)

    await setDoc(doc(db, 'invites', code), {
      babyId: baby.id,
      creadoPor: uid,
      creadoEn: serverTimestamp(),
      expiraEn,
      usado: false,
    })
    // Un solo código vivo por bebé: el anterior se borra.
    if (baby.inviteActual && baby.inviteActual !== code) {
      await deleteDoc(doc(db, 'invites', baby.inviteActual)).catch(() => {})
    }
    await updateDoc(refBaby(), { inviteActual: code })
    return code
  }, [baby, uid, refBaby])

  const revocarInvite = useCallback(async () => {
    if (!baby) return
    if (baby.inviteActual) {
      await deleteDoc(doc(db, 'invites', baby.inviteActual)).catch(() => {})
    }
    await updateDoc(refBaby(), { inviteActual: null })
  }, [baby, refBaby])

  const value = useMemo(
    () => ({
      babies,
      babiesCargando,
      activeBabyId: baby?.id || null,
      setActiveBaby: setActiveBabyId,
      codigoUrl,
      limpiarCodigoUrl: () => setCodigoUrl(null),
      baby,
      registros,
      seDurmio,
      seDesperto,
      empezarToma,
      terminarToma,
      ajustarInicioEstado,
      ajustarInicioToma,
      ajustarEstadoActual,
      addRegistro,
      editRegistro,
      deleteRegistro,
      importarRegistros,
      borrarBebe,
      salirDelBebe,
      notasContextoActivas,
      setNotasContexto,
      bienvenidaVista,
      bienvenidaCargada: prefsCargadas,
      marcarBienvenida,
      setNombre,
      setApodo,
      setEmoji,
      crearBebe,
      unirseConCodigo,
      generarInvite,
      revocarInvite,
    }),
    [
      babies,
      babiesCargando,
      baby,
      codigoUrl,
      registros,
      seDurmio,
      seDesperto,
      empezarToma,
      terminarToma,
      ajustarInicioEstado,
      ajustarInicioToma,
      ajustarEstadoActual,
      addRegistro,
      editRegistro,
      deleteRegistro,
      importarRegistros,
      borrarBebe,
      salirDelBebe,
      prefs,
      prefsCargadas,
      setNotasContexto,
      marcarBienvenida,
      setNombre,
      setApodo,
      setEmoji,
      crearBebe,
      unirseConCodigo,
      generarInvite,
      revocarInvite,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>')
  return ctx
}

// Alias que usan los componentes; en el bundle los tres apuntan al mismo hook.
export const useBaby = useData
export const useBabyCtx = useData
