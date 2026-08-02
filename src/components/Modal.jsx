/**
 * Armazón del modal: fondo que cierra al tocar afuera, caja que no propaga
 * el click, y el título. Extraído de EditorRegistro sin cambiarle nada para
 * que lo comparta el editor de comidas.
 */
export default function Modal({ titulo, onCerrar, children }) {
  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  )
}
