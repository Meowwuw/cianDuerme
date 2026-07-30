/**
 * Helpers de formato de tiempo.
 *
 * En el bundle estos están todos juntos (38076–38118), justo antes del
 * cronómetro, así que muy probablemente eran un módulo propio. El resto del
 * grupo (duración larga "1h 05m", límites del día, fechas largas) lo usan Hoy
 * e Historial; se agrega en los pasos 4 y 5.
 */

/** millis -> "H:MM:SS" si pasó una hora, si no "MM:SS". Para el cronómetro. */
export function cronoTexto(ms) {
  if (ms == null || ms < 0) ms = 0
  const totalSeg = Math.floor(ms / 1000)
  const h = Math.floor(totalSeg / 3600)
  const m = Math.floor((totalSeg % 3600) / 60)
  const s = totalSeg % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** millis -> "1h 05m" / "23m 10s" / "45s". Para duraciones, no para el crono. */
export function duracionLarga(ms) {
  if (ms == null || ms < 0) ms = 0
  const totalSeg = Math.floor(ms / 1000)
  const h = Math.floor(totalSeg / 3600)
  const m = Math.floor((totalSeg % 3600) / 60)
  const s = totalSeg % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

/** millis -> "20:58". */
export function horaCorta(ms) {
  if (ms == null) return '--:--'
  return new Date(ms).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** millis -> "lun, 12 ene". */
export function fechaCorta(ms) {
  return new Date(ms).toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** millis -> "lunes, 12 de enero". Es el que se ve en hist-fecha. */
export function fechaLarga(ms) {
  return new Date(ms).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Toma el día de `fecha` y la hora de `hora`. */
export function conFechaDe(fecha, hora) {
  const d = new Date(fecha)
  const h = new Date(hora)
  d.setHours(h.getHours(), h.getMinutes(), 0, 0)
  return d.getTime()
}

/** millis -> valor de <input type="datetime-local"> (hora local, sin zona). */
export function aValorInputLocal(ms) {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Valor de <input type="datetime-local"> -> millis. */
export function desdeValorInputLocal(valor) {
  return new Date(valor).getTime()
}
