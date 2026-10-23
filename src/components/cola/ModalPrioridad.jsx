import { useState } from 'react'
import Modal from '../ui/Modal'
import Etiqueta from '../ui/Etiqueta'
import { PRIORIDADES } from '../../data/contenidoPublico'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { cambiarPrioridadTickets, estaEnCurso } from '../../services/ticketsService'

// Cambiar la prioridad de uno o varios tickets, con un motivo obligatorio (mockup 4.3).
function ModalPrioridad({ seleccionados, onCerrar, onListo }) {
    const { usuario } = useAuth()
    const { exito, error } = useToast()
    const [nueva, setNueva] = useState(null)
    const [motivo, setMotivo] = useState('')
    const [intentado, setIntentado] = useState(false)

    const unico = seleccionados.length === 1 ? seleccionados[0] : null
    const actuales = [...new Set(seleccionados.map((t) => t.prioridad))]
    const bloqueados = seleccionados.filter((t) => !estaEnCurso(t))

    const errorNueva = intentado && !nueva ? 'Selecciona la nueva prioridad.' : ''
    const errorMotivo = intentado && !motivo.trim() ? 'El motivo es obligatorio.' : ''

    // Aviso del efecto del cambio sobre la cola y el tiempo esperado
    let aviso = null
    const indice = (id) => PRIORIDADES.findIndex((p) => p.id === id)
    if (nueva && unico && unico.prioridad !== nueva) {
        const sube = indice(nueva) < indice(unico.prioridad)
        const antes = PRIORIDADES[indice(unico.prioridad)].horas
        const despues = PRIORIDADES[indice(nueva)].horas
        aviso = `${sube ? 'El ticket subirá al inicio de la cola' : 'El ticket bajará en la cola'} y su tiempo esperado pasará de ${antes} h a ${despues} h.`
    } else if (nueva && !unico) {
        aviso = `Se actualizarán la prioridad y el tiempo esperado de ${seleccionados.length} tickets.`
    }

    function enviar(e) {
        e.preventDefault()
        setIntentado(true)
        if (!nueva || !motivo.trim() || bloqueados.length > 0) return

        const resultado = cambiarPrioridadTickets(seleccionados.map((t) => t.codigo), nueva, motivo, usuario)
        if (!resultado.ok) {
            error(resultado.mensaje)
            return
        }
        exito(
            resultado.afectados.length === 1
                ? `Prioridad de ${resultado.afectados[0].codigo} actualizada.`
                : `Prioridad actualizada en ${resultado.afectados.length} tickets.`
        )
        onListo()
    }

    return (
        <Modal
            titulo="Cambiar prioridad"
            subtitulo={unico ? unico.codigo : `${seleccionados.length} tickets seleccionados`}
            onCerrar={onCerrar}
            acciones={(
                <>
                    <button type="button" className="boton" onClick={onCerrar}>Cancelar</button>
                    <button type="submit" form="form-prioridad" className="boton boton--primario" disabled={bloqueados.length > 0}>
                        Guardar prioridad
                    </button>
                </>
            )}
        >
            <form id="form-prioridad" onSubmit={enviar} noValidate>
                {bloqueados.length > 0 && (
                    <p className="alerta-error cola__aviso" role="alert">
                        Solo se puede cambiar la prioridad de tickets en curso. Quita de la selección: {bloqueados.map((t) => t.codigo).join(', ')}.
                    </p>
                )}

                <div className="cambio-prioridad">
                    <div>
                        <span className="campo__etiqueta">Actual</span>
                        <div className="cambio-prioridad__actual">
                            {actuales.length === 1 ? <Etiqueta tipo="prioridad" valor={actuales[0]} /> : <span className="texto-aux">Varias</span>}
                        </div>
                    </div>
                    <span aria-hidden="true">→</span>
                    <div>
                        <span className="campo__etiqueta">Nueva</span>
                        <div className="prioridad-grupo" role="radiogroup" aria-label="Nueva prioridad">
                            {PRIORIDADES.map((p) => (
                                <button key={p.id} type="button" role="radio" aria-checked={nueva === p.id}
                                    className={`prioridad-btn prioridad-${p.id}${nueva === p.id ? ' activo' : ''}`}
                                    onClick={() => setNueva(p.id)}>
                                    {p.nombre}
                                </button>
                            ))}
                        </div>
                        {errorNueva && <p className="campo__mensaje campo__mensaje--error">{errorNueva}</p>}
                    </div>
                </div>

                <div className={errorMotivo ? 'campo campo--error' : 'campo'}>
                    <label htmlFor="motivo-prioridad" className="campo__etiqueta">Motivo (obligatorio)</label>
                    <textarea id="motivo-prioridad" className="campo__control tickets__area tickets__area--corta" value={motivo}
                        onChange={(e) => setMotivo(e.target.value)} />
                    {errorMotivo && <p className="campo__mensaje campo__mensaje--error">{errorMotivo}</p>}
                </div>

                {aviso && <p className="alerta-aviso cola__aviso">{aviso}</p>}
            </form>
        </Modal>
    )
}

export default ModalPrioridad
