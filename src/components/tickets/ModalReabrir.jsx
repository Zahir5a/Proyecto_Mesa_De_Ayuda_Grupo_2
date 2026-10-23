import { useEffect, useRef, useState } from 'react'
import { PLAZO_REAPERTURA_DIAS } from '../../data/tickets'
import { formatearFecha } from '../../utils/formato'

const MIN_MOTIVO = 10

// Formulario del modal. Se crea de nuevo cada vez que el modal se abre, así empieza vacío.
function FormularioReapertura({ onConfirmar, onCancelar }) {
    const [motivo, setMotivo] = useState('')
    const [intentado, setIntentado] = useState(false)
    const error = motivo.trim().length < MIN_MOTIVO ? `Cuéntanos el motivo en al menos ${MIN_MOTIVO} caracteres.` : ''

    function enviar(e) {
        e.preventDefault()
        setIntentado(true)
        if (!error) onConfirmar(motivo)
    }

    return (
        <form onSubmit={enviar} noValidate>
            <div className={intentado && error ? 'campo campo--error' : 'campo'}>
                <label htmlFor="motivo-reapertura" className="campo__etiqueta">Motivo (obligatorio)</label>
                <textarea id="motivo-reapertura" className="campo__control tickets__area tickets__area--corta" value={motivo}
                    maxLength={300} autoFocus onChange={(e) => setMotivo(e.target.value)} />
                {intentado && error && <p className="campo__mensaje campo__mensaje--error">{error}</p>}
            </div>
            <p className="modal__texto">
                El ticket volverá al estado Reabierto y regresará a la cola con su prioridad original.
            </p>
            <div className="modal__acciones">
                <button type="button" className="boton" onClick={onCancelar}>Cancelar</button>
                <button type="submit" className="boton boton--destructivo">Reabrir ticket</button>
            </div>
        </form>
    )
}

// Ventana para reabrir un ticket cerrado (HU-3): pide el motivo y recuerda el plazo.
function ModalReabrir({ abierto, ticket, limite, onConfirmar, onCancelar }) {
    const ref = useRef(null)

    useEffect(() => {
        const dialogo = ref.current
        if (abierto && !dialogo.open) dialogo.showModal()
        if (!abierto && dialogo.open) dialogo.close()
    }, [abierto])

    return (
        <dialog
            ref={ref}
            className="modal modal--ancho"
            onCancel={(e) => {
                e.preventDefault()
                onCancelar()
            }}
            onClick={(e) => e.target === ref.current && onCancelar()}
        >
            <div className="modal__cabecera">
                <h2 className="modal__titulo">Reabrir {ticket.codigo}</h2>
                <button type="button" className="modal__cerrar" aria-label="Cerrar" onClick={onCancelar}>×</button>
            </div>
            <p className="modal__texto">
                Se admite reabrir hasta {PLAZO_REAPERTURA_DIAS} días después del cierre. Plazo vigente hasta el{' '}
                {formatearFecha(limite)}.
            </p>
            {abierto && <FormularioReapertura onConfirmar={onConfirmar} onCancelar={onCancelar} />}
        </dialog>
    )
}

export default ModalReabrir
