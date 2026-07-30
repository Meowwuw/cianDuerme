// TODO: PASO 7 — stub. El original (bundle 43181–43403) es el editor completo:
// chips de tipo (Sueño / Toma), timepicker con steppers ±1 h y ±5 min
// (aria-label "Restar una hora", "Sumar cinco minutos", …), chips de atajo
// ("Ahora", "Hace 5 min", "Hace 15 min", "Hace 30 min", "Hace 1 h"), switch
// "en curso", aviso de solape (haySolape en lib/resumen.js) y confirmación de
// borrado. Acá solo está el cascarón, que sí es fiel.
export default function EditorRegistro({
  registro = null,
  diaMs,
  registros,
  onGuardar,
  onBorrar,
  onCancelar,
}) {
  const esNuevo = !registro

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{esNuevo ? 'Agregar registro' : 'Editar registro'}</h3>
        {/* TODO: editor-tipos, timepicker, editor-atajos, editor-encurso,
            editor-nota de solape y editor-borrar-confirm. */}
        <div className="modal-botones">
          <button className="btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
