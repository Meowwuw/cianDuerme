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

/** millis -> "20:58". */
export function horaCorta(ms) {
  if (ms == null) return '--:--'
  return new Date(ms).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })
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
