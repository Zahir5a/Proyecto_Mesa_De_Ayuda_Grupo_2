import { useEffect, useRef } from 'react'

// Ventana de confirmación para acciones destructivas. Usa la etiqueta nativa <dialog>:
// oscurece el fondo, mantiene el foco dentro y se cierra con la tecla Esc.
function ConfirmDialog({
    abierto,
    titulo,
    children,
    textoConfirmar = 'Confirmar',
    destructivo = false,
    onConfirmar,
    onCancelar,
}) {
    const ref = useRef(null)

    useEffect(() => {
        const dialogo = ref.current
        if (abierto && !dialogo.open) dialogo.showModal()
        if (!abierto && dialogo.open) dialogo.close()
    }, [abierto])

    return (
        <dialog
            ref={ref}
            className="modal"
            onCancel={(e) => {
                e.preventDefault()
                onCancelar()
            }}
            onClick={(e) => e.target === ref.current && onCancelar()}
        >
            <h2 className="modal__titulo">{titulo}</h2>
            <div className="modal__cuerpo">{children}</div>
            <div className="modal__acciones">
                <button type="button" className="boton" onClick={onCancelar}>Cancelar</button>
                <button
                    type="button"
                    className={destructivo ? 'boton boton--destructivo' : 'boton boton--primario'}
                    onClick={onConfirmar}
                >
                    {textoConfirmar}
                </button>
            </div>
        </dialog>
    )
}

export default ConfirmDialog
