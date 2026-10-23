import { useState } from 'react'
import Modal from '../ui/Modal'
import Etiqueta from '../ui/Etiqueta'
import { MAX_TEXTO, PLAZO_REAPERTURA_DIAS } from '../../data/tickets'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { cerrarTicket } from '../../services/ticketsService'
import { formatearTiempo, horasDeAtencion } from '../../utils/etapas'
import { horasEsperadas } from '../../utils/tiempos'

// Cerrar un ticket: pide la solución aplicada y muestra el tiempo total de atención (mockup 5.4).
function ModalCierre({ ticket, categorias, onCerrar, onListo }) {
    const { usuario } = useAuth()
    const { exito } = useToast()
    const [solucion, setSolucion] = useState('')
    const [error, setError] = useState('')

    // El tiempo se calcula una vez al abrir la ventana; el valor definitivo se guarda al cerrar
    const [horas] = useState(() => horasDeAtencion(ticket, Date.now()))
    const esperadas = horasEsperadas(ticket, categorias)
    const dentro = horas <= esperadas

    function enviar(e) {
        e.preventDefault()
        const resultado = cerrarTicket(ticket.codigo, solucion, usuario)
        if (!resultado.ok) {
            setError(resultado.mensaje)
            return
        }
        exito(`Cerraste el ticket ${ticket.codigo} con la solución registrada.`)
        onListo()
    }

    return (
        <Modal
            titulo={`Cerrar ${ticket.codigo}`}
            onCerrar={onCerrar}
            acciones={(
                <>
                    <button type="button" className="boton" onClick={onCerrar}>Cancelar</button>
                    <button type="submit" form="form-cierre" className="boton boton--primario">Cerrar ticket</button>
                </>
            )}
        >
            <form id="form-cierre" onSubmit={enviar} noValidate>
                <div className={error ? 'campo campo--error' : 'campo'}>
                    <label htmlFor="solucion" className="campo__etiqueta">Solución aplicada (obligatoria)</label>
                    <textarea id="solucion" className="campo__control tickets__area" value={solucion} maxLength={MAX_TEXTO} autoFocus
                        onChange={(e) => { setSolucion(e.target.value); setError('') }} />
                    {error && <p className="campo__mensaje campo__mensaje--error">{error}</p>}
                </div>

                <div className="cierre__datos">
                    <div>
                        <span className="campo__etiqueta">Tiempo total de atención</span>
                        <p className="cierre__tiempo">{formatearTiempo(horas * 60)}</p>
                        <p className={dentro ? 'cierre__plazo cierre__plazo--bien' : 'cierre__plazo cierre__plazo--mal'}>
                            {dentro ? 'Dentro' : 'Fuera'} del tiempo esperado ({esperadas} h)
                        </p>
                    </div>
                    <div>
                        <span className="campo__etiqueta">Estado final</span>
                        <p><Etiqueta tipo="estado" valor="cerrado" /></p>
                    </div>
                </div>

                <p className="alerta-info cierre__aviso">
                    {ticket.usuarioId
                        ? `Al cerrar, ${ticket.solicitante} recibirá la encuesta de satisfacción y podrá reabrir el ticket dentro de ${PLAZO_REAPERTURA_DIAS} días.`
                        : `Al cerrar, el ticket queda registrado como resuelto para ${ticket.solicitante}.`}
                </p>
            </form>
        </Modal>
    )
}

export default ModalCierre
