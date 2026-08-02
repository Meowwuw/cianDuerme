/**
 * Resumen de un día y notas de fase.
 *
 * El corte de día NO es "el registro pertenece al día en que empezó": el
 * original recorta cada intervalo contra los límites del día y suma solo la
 * parte que cae adentro. Un sueño de 21:00 a 06:00 aporta 3 h al día que
 * empieza y 6 h al siguiente, y aparece en la lista de los dos.
 *
 * Las notas de fase usan otra unidad, la "noche": de las 19:00 del día
 * anterior a las 06:00 del día en curso (ver ventanaNoche).
 */

export const MINUTO = 60 * 1000
export const HORA = 60 * MINUTO

/** La noche va de las 19:00 de ayer a las 06:00 de hoy. */
const NOCHE_DESDE_HORA = 19
const NOCHE_HASTA_HORA = 6

/** Cluster feeding: 3 tomas en 2 h y un sueño hasta 60 min después. */
const CLUSTER_MIN_TOMAS = 3
const CLUSTER_VENTANA = 2 * HORA
const CLUSTER_SUENO_HASTA = 60 * MINUTO

/** Tomas cortas: más de la mitad de las tomas de la noche duran ≤ 10 min. */
const TOMA_CORTA_MAX = 10 * MINUTO
const TOMA_CORTA_MIN_TOMAS = 2
const TOMA_CORTA_PROPORCION = 0.5

/** Para comparar contra el promedio hace falta historia: 8 días y 14 en total. */
const DIAS_MIN_HISTORIA = 8
const HISTORIA_MIN_MS = 336 * HORA

/** Muchas tomas: 1.3× el promedio y al menos 2 más. */
const MUCHAS_TOMAS_FACTOR = 1.3
const MUCHAS_TOMAS_EXTRA = 2

/** Noche larga: el sueño más largo de la noche supera 1.25× el promedio. */
const NOCHE_LARGA_FACTOR = 1.25

/**
 * Días que un alimento queda en observación desde su PRIMERA aparición (no
 * desde la última: si no, mientras se la sigas dando la ventana no cerraría
 * nunca). Si cambia, hay que tocar el texto de NOTAS_COMIDA.confirmado, que
 * dice "Tres días" con todas las letras.
 */
const VIGILANCIA_DIAS = 3

export const NOTAS = {
  cluster:
    'Tomas seguiditas (cluster feeding). Muchos bebés hacen esto antes de un tramo de sueño 💚',
  nocheLarga: 'Anoche estiró un buen tramo de sueño.',
  tomaCorta: 'Anoche comió sin desvelarse del todo. 🌙',
  muchasTomas:
    'Un día de bastantes tomas. Cada bebé tiene su ritmo, y ese ritmo va cambiando.',
}

/**
 * Notas de alimentación complementaria. Son funciones porque llevan nombres y
 * cantidades adentro; las de arriba son fijas.
 *
 * Ninguna dice que un alimento sea seguro ni habla de alergia: describen lo
 * que está registrado ("sin nada anotado"), no el estado del bebé. La app no
 * opina de salud.
 */
export const NOTAS_COMIDA = {
  nuevoUno: (lista) => `Primera vez con ${lista}. Estos días se ve cómo le cae 💚`,
  nuevosVarios: (cuantos) =>
    `Hoy hubo ${cuantos} alimentos nuevos. Si aparece alguna reacción, va a costar saber cuál fue.`,
  confirmado: (lista) => `Tres días dando ${lista}, sin nada anotado 💚`,
  vigilanciaUno: (lista) =>
    `${capitalizar(lista)} sigue en los primeros días. Por ahora, sin novedad.`,
  vigilanciaVarios: (lista) =>
    `${capitalizar(lista)} siguen en los primeros días. Por ahora, sin novedad.`,
}

/** millis -> 00:00:00.000 de ese día. */
export function inicioDia(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** millis -> 23:59:59.999 de ese día. */
export function finDia(ms) {
  const d = new Date(ms)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** Cuántos ms de [inicio, fin] caen dentro de [desde, hasta]. Recorta. */
function solapamiento(inicio, fin, desde, hasta) {
  const a = Math.max(inicio, desde)
  const b = Math.min(fin ?? Date.now(), hasta)
  return Math.max(0, b - a)
}

/** Registros que tocan el día (aunque hayan empezado antes), ordenados. */
export function registrosDelDia(registros, diaMs) {
  const desde = inicioDia(diaMs)
  const hasta = finDia(diaMs)
  return registros
    .filter((r) => {
      const fin = r.fin ?? Date.now()
      return r.inicio <= hasta && fin >= desde
    })
    .sort((a, b) => a.inicio - b.inicio)
}

/**
 * Comidas de ese día, ordenadas. A diferencia de los registros no hay que
 * recortar nada: una comida es un instante, así que o cae adentro o no.
 */
export function comidasDelDia(comidas, diaMs) {
  const desde = inicioDia(diaMs)
  const hasta = finDia(diaMs)
  return comidas
    .filter((c) => c.inicio >= desde && c.inicio <= hasta)
    .sort((a, b) => a.inicio - b.inicio)
}

/** ¿Se solapa este registro con algún otro? (lo usa el editor, paso 7) */
export function haySolape(registros, { id, inicio, fin }) {
  const finReal = fin ?? Date.now()
  return registros.some((r) => {
    if (r.id === id) return false
    const rFin = r.fin ?? Date.now()
    return inicio < rFin && r.inicio < finReal
  })
}

export function resumenDelDia(registros, diaMs) {
  const desde = inicioDia(diaMs)
  const hasta = finDia(diaMs)
  const delDia = registrosDelDia(registros, diaMs)

  let msDormido = 0
  let nSuenos = 0
  let msToma = 0
  let nTomas = 0

  for (const r of delDia) {
    const ms = solapamiento(r.inicio, r.fin, desde, hasta)
    if (r.tipo === 'sueño') {
      msDormido += ms
      nSuenos++
    } else if (r.tipo === 'toma') {
      msToma += ms
      nTomas++
    }
  }

  // Despierto = lo transcurrido del día menos lo dormido. Si el día es hoy,
  // "transcurrido" corta en el ahora, no en las 23:59.
  const corte = Math.min(hasta, Date.now())
  const transcurrido = Math.max(0, corte - desde)
  const msDespierto = Math.max(0, transcurrido - msDormido)

  return {
    diaMs,
    registros: delDia,
    msDormido,
    nSuenos,
    msDespierto,
    msToma,
    nTomas,
  }
}

/** [19:00 de ayer, 06:00 de hoy]. */
function ventanaNoche(diaMs) {
  const d0 = inicioDia(diaMs)
  return [d0 - (24 - NOCHE_DESDE_HORA) * HORA, d0 + NOCHE_HASTA_HORA * HORA]
}

/** Días distintos (a medianoche) en los que arrancó algún registro. */
function diasConRegistro(registros) {
  return new Set(registros.map((r) => inicioDia(r.inicio)))
}

/** ¿Hay historia suficiente para comparar contra un promedio? */
function hayHistoria(registros, ahora) {
  if (
    !registros.length ||
    [...diasConRegistro(registros)].filter((d) => d < inicioDia(ahora)).length <
      DIAS_MIN_HISTORIA
  )
    return false
  const primero = Math.min(...registros.map((r) => r.inicio))
  return ahora - primero >= HISTORIA_MIN_MS
}

/** 3 tomas dentro de 2 h, seguidas de un sueño que empieza hasta 60 min después. */
function hayCluster(delDia) {
  const tomas = delDia
    .filter((r) => r.tipo === 'toma')
    .sort((a, b) => a.inicio - b.inicio)
  const suenos = delDia.filter((r) => r.tipo === 'sueño')

  for (let i = 0; i + CLUSTER_MIN_TOMAS - 1 < tomas.length; i++) {
    const primera = tomas[i]
    const ultima = tomas[i + CLUSTER_MIN_TOMAS - 1]
    if (ultima.inicio - primera.inicio <= CLUSTER_VENTANA) {
      const corte = ultima.fin ?? ultima.inicio
      if (
        suenos.some(
          (s) => s.inicio >= corte - MINUTO && s.inicio <= corte + CLUSTER_SUENO_HASTA,
        )
      )
        return true
    }
  }
  return false
}

/** ¿Más de la mitad de las tomas de la noche fueron cortas? */
function tomasCortasDeNoche(registros, ahora) {
  const [desde, hasta] = ventanaNoche(ahora)
  const tomas = registros.filter(
    (r) => r.tipo === 'toma' && r.fin != null && r.inicio >= desde && r.inicio <= hasta,
  )
  if (tomas.length < TOMA_CORTA_MIN_TOMAS) return false
  const cortas = tomas.filter((r) => r.fin - r.inicio <= TOMA_CORTA_MAX).length
  return cortas / tomas.length > TOMA_CORTA_PROPORCION
}

/** Duración del sueño más largo que arrancó dentro de la noche de ese día. */
function suenoMasLargoDeNoche(registros, diaMs) {
  const [desde, hasta] = ventanaNoche(diaMs)
  let max = 0
  for (const r of registros) {
    if (r.tipo !== 'sueño' || r.fin == null) continue
    if (r.inicio >= desde && r.inicio <= hasta) max = Math.max(max, r.fin - r.inicio)
  }
  return max
}

/** ¿La noche de anoche fue más larga que el promedio de las anteriores? */
function nocheMasLargaQueElPromedio(registros, ahora) {
  const estaNoche = suenoMasLargoDeNoche(registros, ahora)
  if (estaNoche === 0) return false

  const previas = [...diasConRegistro(registros)]
    .filter((d) => d < inicioDia(ahora))
    .map((d) => suenoMasLargoDeNoche(registros, d))
    .filter((ms) => ms > 0)

  if (previas.length < DIAS_MIN_HISTORIA) return false
  const promedio = previas.reduce((a, b) => a + b, 0) / previas.length
  return promedio > 0 && estaNoche >= promedio * NOCHE_LARGA_FACTOR
}

/** Cuántas tomas tocan ese día. */
function nTomasDelDia(registros, diaMs) {
  return registrosDelDia(registros, diaMs).filter((r) => r.tipo === 'toma').length
}

/** ¿Hoy hubo bastantes más tomas que el promedio? */
function muchasTomas(registros, ahora) {
  const hoy = nTomasDelDia(registros, ahora)
  const previos = [...diasConRegistro(registros)].filter((d) => d < inicioDia(ahora))
  if (previos.length < DIAS_MIN_HISTORIA) return false
  const promedio =
    previos.map((d) => nTomasDelDia(registros, d)).reduce((a, b) => a + b, 0) /
    previos.length
  return (
    promedio > 0 &&
    hoy >= promedio * MUCHAS_TOMAS_FACTOR &&
    hoy >= promedio + MUCHAS_TOMAS_EXTRA
  )
}

/** Días de calendario entre dos millis. Redondea, así el horario de verano no corre un día. */
function diasEntre(desde, hasta) {
  return Math.round((inicioDia(hasta) - inicioDia(desde)) / (24 * HORA))
}

function capitalizar(texto) {
  return texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1)
}

/**
 * "y" pasa a "e" delante de i- o hi-, con o sin tilde, pero no de hie-:
 * "papa e hígado", "papa e iguana", "arroz y hielo". Sin regex a propósito,
 * porque la tilde de "hígado" es justo el caso que rompe la versión obvia.
 */
function conjuncion(palabra) {
  const p = palabra.toLocaleLowerCase('es')
  const sinH = p.startsWith('h') ? p.slice(1) : p
  const empiezaConI = sinH.startsWith('i') || sinH.startsWith('í')
  return empiezaConI && !p.startsWith('hie') ? 'e' : 'y'
}

/**
 * Nombres para meter en una oración: "papa", "papa e hígado de pollo",
 * "papa, pera y arroz", "4 alimentos".
 */
function listaDeNombres(nombres) {
  const ns = nombres.map((n) => String(n).toLocaleLowerCase('es'))
  if (ns.length === 0) return ''
  if (ns.length === 1) return ns[0]
  if (ns.length > 3) return `${ns.length} alimentos`
  const ultimo = ns[ns.length - 1]
  return `${ns.slice(0, -1).join(', ')} ${conjuncion(ultimo)} ${ultimo}`
}

/**
 * Primera vez que aparece cada alimento en el historial: id -> {inicio, nombre}.
 *
 * Se calcula sobre `alimentos[].id`, nunca sobre el nombre del plato: si
 * repetís "papilla con hígado", el hígado no es nuevo aunque el plato sí lo
 * parezca. Y se deriva siempre, no se persiste: editar la fecha de una comida
 * vieja recalcula todo solo.
 */
function primerasApariciones(comidas) {
  const primeras = new Map()
  for (const c of [...comidas].sort((a, b) => a.inicio - b.inicio)) {
    for (const a of c.alimentos || []) {
      if (!primeras.has(a.id)) primeras.set(a.id, { inicio: c.inicio, nombre: a.nombre })
    }
  }
  return primeras
}

/**
 * ¿Se anotó una reacción en alguna comida que llevaba este alimento, dentro
 * de su ventana de vigilancia?
 *
 * OJO antes de "mejorar" esto: la reacción se registra en la comida, no en el
 * alimento, así que bloquea a TODOS los ingredientes de esa comida. Es a
 * propósito. Si la papilla tenía hígado y zapallo y hubo sarpullido, no existe
 * el dato de cuál de los dos fue: nadie lo anotó, porque no se sabe. Dar por
 * conocido al zapallo "porque el sospechoso era el hígado" es inventar.
 * El costo de equivocarse es asimétrico: callar una reacción real es mucho
 * peor que pedir un par de días más de paciencia.
 */
function conReaccionEnVigilancia(comidas, id, desde) {
  return comidas.some(
    (c) =>
      c.reaccion &&
      String(c.reaccion).trim() !== '' &&
      c.inicio >= desde &&
      diasEntre(desde, c.inicio) <= VIGILANCIA_DIAS &&
      (c.alimentos || []).some((a) => a.id === id),
  )
}

/** Alimentos cuya primera vez en todo el historial cae en ese día. */
function alimentosNuevosDelDia(comidas, diaMs) {
  return [...primerasApariciones(comidas).values()]
    .filter((p) => diasEntre(p.inicio, diaMs) === 0)
    .map((p) => p.nombre)
}

/** Alimentos que justo hoy cumplen la ventana, y sin ninguna reacción anotada. */
function alimentosConfirmadosDelDia(comidas, diaMs) {
  return [...primerasApariciones(comidas).entries()]
    .filter(
      ([id, p]) =>
        diasEntre(p.inicio, diaMs) === VIGILANCIA_DIAS &&
        !conReaccionEnVigilancia(comidas, id, p.inicio),
    )
    .map(([, p]) => p.nombre)
}

/** Alimentos en el medio de la ventana: ya no son de hoy, todavía no cumplen. */
function alimentosEnVigilancia(comidas, diaMs) {
  return [...primerasApariciones(comidas).entries()]
    .filter(([id, p]) => {
      const d = diasEntre(p.inicio, diaMs)
      return d >= 1 && d < VIGILANCIA_DIAS && !conReaccionEnVigilancia(comidas, id, p.inicio)
    })
    .map(([, p]) => p.nombre)
}

/**
 * Nota de fase del día, o null. El orden importa: la primera que da true gana.
 *
 * Las de comida solo le ganan a las de sueño cuando hoy pasó algo concreto:
 * entró un alimento nuevo, o se cumplió una ventana. La de vigilancia va
 * última justamente porque describe que NO pasó nada; si el bebé hizo cluster
 * o estiró la noche, eso es más interesante que "seguimos esperando".
 *
 * cluster no pide historia previa; las otras tres sí (hayHistoria), salvo
 * tomaCorta, que se evalúa sola sobre la noche.
 */
export function notaDeFase(registros, comidas = [], ahora = Date.now()) {
  const regs = registros || []
  const coms = comidas || []
  if (regs.length === 0 && coms.length === 0) return null

  const nuevos = alimentosNuevosDelDia(coms, ahora)
  if (nuevos.length === 1) return NOTAS_COMIDA.nuevoUno(listaDeNombres(nuevos))
  if (nuevos.length > 1) return NOTAS_COMIDA.nuevosVarios(nuevos.length)

  const confirmados = alimentosConfirmadosDelDia(coms, ahora)
  if (confirmados.length > 0) return NOTAS_COMIDA.confirmado(listaDeNombres(confirmados))

  const delDia = registrosDelDia(regs, ahora)
  if (hayCluster(delDia)) return NOTAS.cluster
  if (hayHistoria(regs, ahora) && nocheMasLargaQueElPromedio(regs, ahora))
    return NOTAS.nocheLarga
  if (tomasCortasDeNoche(regs, ahora)) return NOTAS.tomaCorta
  if (hayHistoria(regs, ahora) && muchasTomas(regs, ahora)) return NOTAS.muchasTomas

  const enVigilancia = alimentosEnVigilancia(coms, ahora)
  if (enVigilancia.length === 1)
    return NOTAS_COMIDA.vigilanciaUno(listaDeNombres(enVigilancia))
  if (enVigilancia.length > 1)
    return NOTAS_COMIDA.vigilanciaVarios(listaDeNombres(enVigilancia))
  return null
}
