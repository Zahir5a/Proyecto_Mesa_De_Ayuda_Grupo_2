import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Etiqueta from '../../components/ui/Etiqueta'
import { PRIORIDADES } from '../../data/contenidoPublico'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { buscarTicket } from '../../services/ticketsService'
import { formatearFecha, formatearHora } from '../../utils/formato'
import { calcularLimite } from '../../utils/plazos'
import { horasEsperadas } from '../../utils/tiempos'
import './tickets.css'

// Pantalla que se ve justo después de registrar un ticket: muestra su código y el plazo de atención.
function TicketRegistrado() {
    const { codigo } = useParams()
    const { usuario } = useAuth()
    const { categorias } = useCatalogo()
    const tickets = useTickets()
    const [copiado, setCopiado] = useState(false)

    const ticket = buscarTicket(tickets, codigo)
    if (!ticket || ticket.usuarioId !== usuario.id) return <Navigate to="/usuario/tickets" replace />

    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    const horas = horasEsperadas(ticket, categorias, PRIORIDADES)
    const limite = calcularLimite(ticket.registradoEn, horas)

    async function copiar() {
        try {
            await navigator.clipboard.writeText(ticket.codigo)
            setCopiado(true)
        } catch {
            // sin permiso para el portapapeles: el código sigue visible para copiarlo a mano
        }
    }

    return (
        <div className="registrado">
            <div className="tarjeta registrado__tarjeta">
                <span className="registrado__check" aria-hidden="true">✓</span>
                <h1>Tu ticket quedó registrado</h1>
                <p className="texto-aux">
                    Guarda el código: con él puedes buscar el ticket desde la cabecera en cualquier momento.
                </p>

                <div className="registrado__codigo">
                    <span>{ticket.codigo}</span>
                    <button type="button" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar'}</button>
                </div>

                <div className="registrado__datos">
                    <div>
                        <span className="campo__etiqueta">Prioridad asignada</span>
                        <p>
                            <Etiqueta tipo="prioridad" valor={ticket.prioridad} />{' '}
                            <Etiqueta tipo="estado" valor={ticket.estado} />
                        </p>
                    </div>
                    <div>
                        <span className="campo__etiqueta">Tiempo de atención esperado</span>
                        <p>{horas} horas hábiles · antes de las {formatearHora(limite)} del {formatearFecha(limite)}</p>
                    </div>
                    <div>
                        <span className="campo__etiqueta">Ambiente</span>
                        <p className="codigo">{ticket.ambiente} · {categoria ? categoria.nombre : ticket.categoriaId}</p>
                    </div>
                </div>

                <div className="formulario__acciones">
                    <Link to={`/usuario/tickets/${ticket.codigo}`} className="boton boton--primario">Ver el detalle del ticket</Link>
                    <Link to="/usuario/tickets" className="boton">Ir a mis tickets</Link>
                </div>
            </div>
        </div>
    )
}

export default TicketRegistrado
