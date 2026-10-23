import { useEffect, useRef } from 'react'

// Ventana modal con título, contenido y botones de acción. Usa la etiqueta nativa <dialog>:
// oscurece el fondo, mantiene el foco dentro y se cierra con Esc o al pulsar fuera.
// Quien la usa la dibuja solo cuando hace falta (por eso siempre nace abierta).
function Modal({ titulo, subtitulo, onCerrar, acciones, children }) {
    const ref = useRef(null)

    useEffect(() => {
        const dialogo = ref.current
        if (!dialogo.open) dialogo.showModal()
    }, [])

    return (
        <dialog
            ref={ref}
            className="modal modal--ancho"
            onCancel={(e) => {
                e.preventDefault()
                onCerrar()
            }}
            onClick={(e) => e.target === ref.current && onCerrar()}
        >
            <div className="modal__cabecera">
                <div>
                    <h2 className="modal__titulo">{titulo}</h2>
                    {subtitulo && <p className="modal__subtitulo">{subtitulo}</p>}
                </div>
                <button type="button" className="modal__cerrar" aria-label="Cerrar" onClick={onCerrar}>×</button>
            </div>
            <div className="modal__contenido">{children}</div>
            <div className="modal__acciones">{acciones}</div>
        </dialog>
    )
}

export default Modal
