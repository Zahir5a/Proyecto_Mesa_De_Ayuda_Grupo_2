import { useState } from 'react'
import Modal from '../ui/Modal'
import { MAX_TEXTO, TRANSICIONES, nombreEstado } from '../../data/tickets'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { cambiarEstadoTicket } from '../../services/ticketsService'

// Estados que se muestran en la lista y lo que significa cada uno (mockup 5.3).
const OPCIONES = [
    { id: 'en_atencion', detalle: 'se empieza o se retoma el trabajo' },
    { id: 'en_espera', detalle: 'falta un repuesto o depende de un tercero' },
    { id: 'resuelto', detalle: 'la falla ya no se presenta' },
    { id: 'abierto', detalle: 'vuelve al inicio de la cola' },
]

// Cambiar el estado de un ticket: solo se pueden elegir las transiciones permitidas desde el estado actual.
function ModalEstado({ ticket, onCerrar, onListo }) {
    const { usuario } = useAuth()
    const { exito } = useToast()
    const [estado, setEstado] = useState('')
    const [motivo, setMotivo] = useState('')
    const [retorno, setRetorno] = useState('')
    const [errores, setErrores] = useState({})

    const permitidos = TRANSICIONES[ticket.estado] ?? []

    function enviar(e) {
        e.preventDefault()
        if (!estado) {
            setErrores({ estado: 'Elige el nuevo estado.' })
            return
        }
        const resultado = cambiarEstadoTicket(ticket.codigo, estado, { motivoEspera: motivo, retornoEstimado: retorno }, usuario)
        if (!resultado.ok) {
            setErrores({ [resultado.campo ?? 'general']: resultado.mensaje })
            return
        }
        exito(`El ticket ${ticket.codigo} pasó a ${nombreEstado(estado)}.`)
        onListo()
    }

    return (
        <Modal
            titulo={`Cambiar estado de ${ticket.codigo}`}
            subtitulo={`Estado actual: ${nombreEstado(ticket.estado)}. Solo se ofrecen las transiciones permitidas.`}
            onCerrar={onCerrar}
            acciones={(
                <>
                    <button type="button" className="boton" onClick={onCerrar}>Cancelar</button>
                    <button type="submit" form="form-estado" className="boton boton--primario">Guardar estado</button>
                </>
            )}
        >
            <form id="form-estado" onSubmit={enviar} noValidate>
                <fieldset className="estados">
                    <legend className="visualmente-oculto">Nuevo estado</legend>
                    {OPCIONES.filter((o) => o.id !== ticket.estado).map((o) => {
                        const disponible = permitidos.includes(o.id)
                        return (
                            <label key={o.id}
                                className={`estados__opcion${estado === o.id ? ' estados__opcion--elegida' : ''}${disponible ? '' : ' estados__opcion--bloqueada'}`}>
                                <input type="radio" name="estado" className="visualmente-oculto" disabled={!disponible}
                                    checked={estado === o.id} onChange={() => { setEstado(o.id); setErrores({}) }} />
                                <span className="estados__marca" aria-hidden="true" />
                                <span>
                                    <strong>{nombreEstado(o.id)}</strong>
                                    {' · '}
                                    {disponible ? o.detalle : `no disponible desde ${nombreEstado(ticket.estado)}`}
                                </span>
                            </label>
                        )
                    })}
                    {errores.estado && <p className="campo__mensaje campo__mensaje--error">{errores.estado}</p>}
                </fieldset>

                {estado === 'en_espera' && (
                    <div className="estados__espera">
                        <div className={errores.motivoEspera ? 'campo campo--error' : 'campo'}>
                            <label htmlFor="motivo-espera" className="campo__etiqueta">Motivo de espera (obligatorio)</label>
                            <textarea id="motivo-espera" className="campo__control tickets__area tickets__area--corta" value={motivo}
                                maxLength={MAX_TEXTO} onChange={(e) => { setMotivo(e.target.value); setErrores({}) }} />
                            {errores.motivoEspera && <p className="campo__mensaje campo__mensaje--error">{errores.motivoEspera}</p>}
                        </div>
                        <div className={errores.retornoEstimado ? 'campo campo--error' : 'campo'}>
                            <label htmlFor="retorno" className="campo__etiqueta">Fecha estimada de retorno</label>
                            <input id="retorno" type="datetime-local" className="campo__control" value={retorno}
                                onChange={(e) => { setRetorno(e.target.value); setErrores({}) }} />
                            {errores.retornoEstimado && <p className="campo__mensaje campo__mensaje--error">{errores.retornoEstimado}</p>}
                        </div>
                    </div>
                )}

                {estado === 'en_espera' && <p className="texto-aux">El tiempo de atención se pausa durante la espera.</p>}
                {errores.general && <p className="alerta-error" role="alert">{errores.general}</p>}
            </form>
        </Modal>
    )
}

export default ModalEstado
