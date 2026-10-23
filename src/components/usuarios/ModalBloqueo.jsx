import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal'
import { MAX_TEXTO } from '../../data/tickets'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { estaEnCurso, tecnicoDeUsuario, ticketsDeUsuario } from '../../services/ticketsService'
import { bloquearUsuario } from '../../services/usuariosService'

// Bloquear una cuenta con un motivo obligatorio (mockup "Modal de bloqueo de cuenta").
// Un técnico con tickets críticos en curso no se puede bloquear hasta reasignarlos.
function ModalBloqueo({ persona, tickets, onCerrar, onListo }) {
    const { usuario } = useAuth()
    const { exito, error } = useToast()
    const [motivo, setMotivo] = useState('')
    const [notificar, setNotificar] = useState(false)
    const [errorMotivo, setErrorMotivo] = useState('')

    const nombre = `${persona.nombres} ${persona.apellidos}`
    const ticketsReportados = ticketsDeUsuario(tickets, persona.id).length
    const tecnico = persona.rol === 'tecnico' ? tecnicoDeUsuario(persona) : null
    const tecnicoId = tecnico ? tecnico.id : null
    const criticosAbiertos = tecnico
        ? tickets.filter((t) => t.tecnicoId === tecnico.id && t.prioridad === 'critica' && estaEnCurso(t)).length
        : 0
    const impedido = criticosAbiertos > 0

    function enviar(e) {
        e.preventDefault()
        if (!motivo.trim()) {
            setErrorMotivo('El motivo del bloqueo es obligatorio.')
            return
        }
        const resultado = bloquearUsuario(persona.id, motivo, usuario)
        if (!resultado.ok) {
            error('No pudimos bloquear la cuenta. Vuelve a intentarlo en unos minutos.')
            return
        }
        exito(`Cuenta bloqueada. ${nombre} ya no puede iniciar sesión.${notificar ? ' Se registró el aviso por correo.' : ''}`)
        onListo()
    }

    return (
        <Modal
            titulo={`Bloquear la cuenta de ${nombre}`}
            subtitulo={`La persona no podrá iniciar sesión ni registrar tickets. Sus ${ticketsReportados} tickets existentes se mantienen y siguen su curso.`}
            onCerrar={onCerrar}
            acciones={(
                <>
                    <button type="button" className="boton" onClick={onCerrar}>Cancelar</button>
                    <button type="submit" form="form-bloqueo" className="boton boton--destructivo" disabled={impedido}>Bloquear cuenta</button>
                </>
            )}
        >
            <form id="form-bloqueo" onSubmit={enviar} noValidate>
                {impedido && (
                    <p className="alerta-aviso usuarios__aviso" role="alert">
                        Esta cuenta tiene {criticosAbiertos} {criticosAbiertos === 1 ? 'ticket crítico abierto' : 'tickets críticos abiertos'}.
                        Reasígnalos antes de bloquearla.{' '}
                        <Link to={`/supervisor/cola?tecnico=${tecnicoId}`}>Ver en la cola</Link>
                    </p>
                )}
                <div className={errorMotivo ? 'campo campo--error' : 'campo'}>
                    <label htmlFor="motivo-bloqueo" className="campo__etiqueta">Motivo del bloqueo (obligatorio)</label>
                    <textarea id="motivo-bloqueo" className="campo__control tickets__area tickets__area--corta" value={motivo}
                        maxLength={MAX_TEXTO} onChange={(e) => { setMotivo(e.target.value); setErrorMotivo('') }} />
                    {errorMotivo && <p className="campo__mensaje campo__mensaje--error">{errorMotivo}</p>}
                </div>
                <label className="casilla usuarios__casilla">
                    <input type="checkbox" checked={notificar} onChange={(e) => setNotificar(e.target.checked)} />
                    <span>Notificar a la persona por correo</span>
                </label>
                <p className="texto-aux">En esta versión no se envían correos: el aviso queda registrado en la cuenta.</p>
            </form>
        </Modal>
    )
}

export default ModalBloqueo
