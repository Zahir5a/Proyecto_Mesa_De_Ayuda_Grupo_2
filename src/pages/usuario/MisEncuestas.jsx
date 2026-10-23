import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEncuestas } from '../../hooks/useEncuestas'
import { useTickets } from '../../hooks/useTickets'
import { buscarTecnico } from '../../services/catalogoService'
import { dentroDelPlazo, encuestasDeUsuario, limiteEncuesta, promedio } from '../../services/encuestasService'
import { buscarTicket, esperaEncuesta, ticketsDeUsuario } from '../../services/ticketsService'
import { formatearFecha } from '../../utils/formato'
import '../../components/categorias/TablaCategoria.css'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import './encuestas.css'

// Listado de las encuestas que respondió el usuario, con el plazo para editarlas (HU-6).
function MisEncuestas() {
    const { usuario } = useAuth()
    const tickets = useTickets()
    const respondidas = encuestasDeUsuario(useEncuestas(), usuario.id).sort((a, b) => new Date(b.respondidaEn) - new Date(a.respondidaEn))
    const pendientes = ticketsDeUsuario(tickets, usuario.id).filter(esperaEncuesta)
    const media = promedio(respondidas.map((e) => e.general))

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Mis encuestas</h1>
                    <p className="texto-aux">
                        {respondidas.length} {respondidas.length === 1 ? 'encuesta respondida' : 'encuestas respondidas'} · {pendientes.length} {pendientes.length === 1 ? 'pendiente' : 'pendientes'}
                        {respondidas.length > 0 && <> · promedio que diste: {media.toFixed(1)} de 5</>}
                    </p>
                </div>
            </div>

            {pendientes.map((t) => (
                <div key={t.codigo} className="alerta-aviso encuestas__pendiente">
                    <span>
                        Tienes 1 encuesta pendiente del ticket <strong className="codigo">{t.codigo}</strong>. El plazo vence el {formatearFecha(limiteEncuesta(t))}.
                    </span>
                    <Link to={`/usuario/encuesta/${t.codigo}`} className="boton boton--aviso boton--chico">Responder ahora</Link>
                </div>
            ))}

            {respondidas.length === 0 ? (
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>Aún no respondes encuestas</h2>
                    <p>Cuando se cierre uno de tus tickets te pediremos calificar la atención.</p>
                    <Link to="/usuario/tickets" className="boton boton--primario">Ver mis tickets</Link>
                </div>
            ) : (
                <div className="tabla-container">
                    <div className="tabla-desplazable">
                        <table className="tabla-categorias tabla-encuestas">
                            <thead>
                                <tr>
                                    <th>TICKET</th><th>ASUNTO</th><th>TÉCNICO</th><th>RESPONDIDA</th><th>PUNTAJE</th><th>PLAZO DE EDICIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {respondidas.map((e) => {
                                    const ticket = buscarTicket(tickets, e.codigo)
                                    const tecnico = e.tecnicoId ? buscarTecnico(e.tecnicoId) : null
                                    const editable = ticket !== null && dentroDelPlazo(ticket)
                                    return (
                                        <tr key={e.codigo}>
                                            <td><Link to={`/usuario/tickets/${e.codigo}`} className="codigo-ticket">{e.codigo}</Link></td>
                                            <td>{ticket ? ticket.asunto : '—'}</td>
                                            <td className="celda-suave">{tecnico ? `${tecnico.nombres} ${tecnico.apellidos}` : '—'}</td>
                                            <td className="celda-suave">{formatearFecha(e.respondidaEn)}</td>
                                            <td><strong className="encuestas__puntaje">{e.general} / 5</strong></td>
                                            <td className="celda-suave">
                                                {editable
                                                    ? <>Editable hasta el {formatearFecha(limiteEncuesta(ticket))} · <Link to={`/usuario/encuesta/${e.codigo}`} className="codigo-ticket">Editar</Link></>
                                                    : 'Plazo vencido'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MisEncuestas
