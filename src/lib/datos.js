import { Timestamp } from 'firebase/firestore'

/** Días que vive un código de invitación antes de vencer. */
export const INVITE_DIAS = 7

/** Clave de localStorage donde se guarda el bebé activo. */
export const CLAVE_BABY_ACTIVO = 'cian.babyActivo'

/**
 * Cualquier forma de fecha que venga de Firestore -> millis.
 * Acepta Timestamp, número, o el objeto plano {seconds, nanoseconds}
 * que aparece cuando el dato viene del cache local.
 */
export function aMillis(valor) {
  if (valor == null) return null
  if (valor instanceof Timestamp) return valor.toMillis()
  if (typeof valor === 'number') return valor
  if (typeof valor.seconds === 'number') {
    return valor.seconds * 1000 + (valor.nanoseconds || 0) / 1e6
  }
  return null
}

/** millis -> Timestamp, para escribir. */
export function aTimestamp(millis) {
  return Timestamp.fromMillis(millis)
}

/** Documento de babies -> objeto de app, con todos los defaults puestos. */
export function normalizarBebe(id, data) {
  return {
    id,
    nombre: data.nombre || 'Bebé',
    apodo: data.apodo || null,
    emoji: data.emoji || null,
    fechaNacimiento: aMillis(data.fechaNacimiento),
    cuidadores: data.cuidadores || [],
    creadoPor: data.creadoPor || null,
    inviteActual: data.inviteActual || null,
    estadoActual: {
      modo: data.estadoActual?.modo || 'despierto',
      desde: aMillis(data.estadoActual?.desde) || Date.now(),
    },
    tomaActiva: data.tomaActiva
      ? { inicio: aMillis(data.tomaActiva.inicio) }
      : null,
  }
}

/** Documento de registros -> objeto de app. */
export function normalizarRegistro(id, data) {
  return {
    id,
    tipo: data.tipo,
    inicio: aMillis(data.inicio),
    fin: aMillis(data.fin),
  }
}

/** Ranuras del día. `extra` es lo que no cae en ninguna comida formal. */
export const MOMENTOS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'extra']

/** Cuánto entró. Son ids, por eso `probo` va sin acento. */
export const ACEPTACIONES = ['todo', 'parte', 'probo', 'rechazo']

/** Cómo se muestran esos ids en pantalla. */
export const ETIQUETA_MOMENTO = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  extra: 'Entre horas',
}

// "Parte" suelto, en la columna donde los otros eventos muestran la duración,
// se lee como palabra cortada. "A medias" se sostiene solo.
export const ETIQUETA_ACEPTACION = {
  todo: 'Todo',
  parte: 'A medias',
  probo: 'Probó',
  rechazo: 'Rechazó',
}

/**
 * Nombre de alimento -> id estable: sin acentos, en minúsculas, con guiones.
 * "Plátano maduro" -> "platano-maduro".
 *
 * OJO: normaliza mayúsculas y acentos, NO sinónimos. Si un cuidador escribe
 * "plátano" y el otro "banana" quedan dos ids distintos y nada los cruza, así
 * que la regla de los 3 días no los va a ver como el mismo alimento. Se
 * resuelve con un catálogo chico con alias cuando exista la UI, no acá.
 * Por eso `alimentos` guarda objetos y no strings: ese día no hace falta
 * migrar nada, alcanza con agregarle un campo al objeto.
 */
export function idAlimento(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Un alimento suelto -> { id, nombre }, o null si no tiene nombre usable.
 * Acepta el string pelado por comodidad de quien lo escribe.
 */
export function normalizarAlimento(alimento) {
  const nombre = (
    typeof alimento === 'string' ? alimento : alimento?.nombre || ''
  ).trim()
  if (!nombre) return null
  // Si el nombre es solo emojis o signos el slug queda vacío; ahí cae al
  // nombre en minúsculas, para que el id nunca sea ''.
  return { id: alimento?.id || idAlimento(nombre) || nombre.toLowerCase(), nombre }
}

/** Documento de comidas -> objeto de app. */
export function normalizarComida(id, data) {
  return {
    id,
    inicio: aMillis(data.inicio),
    momento: data.momento || null,
    alimentos: Array.isArray(data.alimentos)
      ? data.alimentos.map(normalizarAlimento).filter(Boolean)
      : [],
    aceptacion: data.aceptacion || null,
    reaccion: data.reaccion || null,
    notas: data.notas || null,
    creadoPor: data.creadoPor || null,
  }
}

/**
 * Código de invitación legible en voz alta: sin I, L, O, 0, 1
 * para que no se confundan al dictarlo por teléfono.
 */
export function generarCodigo(largo = 6) {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(largo)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < largo; i++) out += alfabeto[bytes[i] % alfabeto.length]
  return out
}

/** Apodo si hay, si no el primer nombre. */
export function nombreCorto(baby) {
  if (!baby) return 'Bebé'
  if (baby.apodo && baby.apodo.trim()) return baby.apodo.trim()
  return (baby.nombre || '').trim().split(/\s+/)[0] || 'Bebé'
}

/** Inicial para el avatar cuando no hay emoji. */
export function inicialDe(baby) {
  return nombreCorto(baby).charAt(0).toUpperCase()
}

/** Huella de un registro, para deduplicar al importar. */
export function claveRegistro(r) {
  return `${r.tipo}|${r.inicio}|${r.fin ?? 'null'}`
}

/** Código de invitación en la URL (?code=ABC123), para links compartidos. */
export function codigoDeUrl() {
  try {
    const code = new URLSearchParams(window.location.search).get('code')
    return code ? code.trim().toUpperCase() : null
  } catch {
    return null
  }
}
