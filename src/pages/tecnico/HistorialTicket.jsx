import { Link, useParams } from 'react-router-dom'
import { useAhora } from '../../hooks/useAhora'
import { useAuth } from '../../hooks/useAuth'
import { useTickets } from '../../hooks/useTickets'
import { buscarTecnico } from '../../services/catalogoService'
import { buscarTicket, puedeVerAtencion } from '../../services/ticketsService'
import { formatearFecha, formatearFechaHora } from '../../utils/formato'
import { formatearTiempo, lineaDeTiempo, minutosPorEtapa, porcentajeEnEspera } from '../../utils/etapas'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import './atencion.css'

const ETIQUETA_EVENTO = {
    abierto: 'Abierto',
    reabierto: 'Reabierto',
    asignado: 'Asignado',
    reasignado: 'Reasignado',
    en_atencion: 'En atención',
    en_espera: 'En espera',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
    cancelado: 'Cancelado',
    devuelto: 'Devuelto a la cola',
    prioridad: 'Prioridad cambiada',
}

const BARRAS = [
    { clave: 'abierto', nombre: 'Abierto' },
    { clave: 'en_atencion', nombre: 'En atención' },
    { clave: 'en_espera', nombre: 'En espera' },
    { clave: 'resuelto', nombre: 'Resuelto → cerrado' },
]

// Historial de cambios de un ticket (HU-5): cada evento con su autor y momento, y el tiempo por etapa.
function HistorialTicket() {
    const { codigo } = useParams()
    const { usuario } = useAuth()
    const tickets = useTickets()
    const ahora = useAhora()

    const esSupervisor = usuario.rol === 'supervisor'
    const base = esSupervisor ? '/supervisor/cola' : '/tecnico/tickets'
    const ticket = buscarTicket(tickets, codigo)

    if (!ticket || !puedeVerAtencion(ticket, usuario)) {
        return (
            <div className="estado-vacio">
                <span className="estado-vacio__icono" aria-hidden="true" />
                <h1>No encontramos este ticket</h1>
                <p>Revisa el código o vuelve a tu lista.</p>
                <Link to={esSupervisor ? '/supervisor/cola' : '/tecnico'} className="boton boton--primario">
                    {esSupervisor ? 'Ir a la cola' : 'Ir a mi bandeja'}
                </Link>
            </div>
        )
    }

    const eventos = lineaDeTiempo(ticket, ahora)
    const minutos = minutosPorEtapa(ticket, ahora)
    const mayor = Math.max(1, ...BARRAS.map((b) => minutos[b.clave]))
    const espera = porcentajeEnEspera(ticket, ahora)
    const totalMin = (new Date(ticket.cerradoEn ?? ahora) - new Date(ticket.registradoEn)) / 60000

    function descripcion(e) {
        if (e.tipo === 'asignado' || e.tipo === 'reasignado') {
            const tecnico = ticket.tecnicoId ? buscarTecnico(ticket.tecnicoId) : null
            const nombre = e.detalle ?? (tecnico ? `${tecnico.nombres} ${tecnico.apellidos}` : '')
            return nombre ? `${ETIQUETA_EVENTO[e.tipo]} a ${nombre}` : ETIQUETA_EVENTO[e.tipo]
        }
        if (e.tipo === 'en_espera' && e.motivo) return `En espera · ${e.motivo}`
        if (e.tipo === 'prioridad') return e.detalle
        if (e.tipo === 'cerrado') return 'Cerrado'
        return ETIQUETA_EVENTO[e.tipo] ?? e.tipo
    }

    return (
        <div>
            <p className="detalle__ruta">
                <Link to={esSupervisor ? '/supervisor/cola' : '/tecnico'}>{esSupervisor ? 'Cola de atención' : 'Mi bandeja'}</Link>
                {' · '}<Link to={`${base}/${ticket.codigo}`} className="codigo">{ticket.codigo}</Link> · Historial de cambios
            </p>
            <h1>Historial de cambios</h1>
            <p className="texto-aux historial__sub">
                {ticket.asunto} · {ticket.ambiente}
                {ticket.cerradoEn && <> · cerrado el {formatearFecha(ticket.cerradoEn)}</>}
                {' '}· tiempo total {formatearTiempo(totalMin)}
            </p>

            <div className="detalle__rejilla">
                <section className="tarjeta">
                    <ol className="historial">
                        {eventos.map((e, i) => (
                            <li key={i} className={`historial__evento historial__evento--${e.tipo}`}>
                                <strong>{descripcion(e)}</strong>
                                <span className="texto-aux">
                                    {formatearFechaHora(e.fecha)} · {e.autor}
                                    {e.retornoEstimado && <> · retorno estimado {formatearFecha(e.retornoEstimado)}</>}
                                    {e.motivo && e.tipo === 'asignado' && <> · {e.motivo}</>}
                                </span>
                                {e.tipo === 'cerrado' && e.detalle && <span className="texto-aux">{e.detalle}</span>}
                                {e.tipo !== 'cerrado' && e.tipo !== 'cancelado' && (
                                    <span className="texto-aux">Permaneció {formatearTiempo(e.ms / 60000)} en este estado</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>

                <aside className="detalle__lateral">
                    <section className="tarjeta">
                        <h2>Tiempo por etapa</h2>
                        <ul className="barras">
                            {BARRAS.map((b) => (
                                <li key={b.clave}>
                                    <p className="barras__texto">
                                        <span>{b.nombre}</span>
                                        <span className="texto-aux">{formatearTiempo(minutos[b.clave])}</span>
                                    </p>
                                    <div className="barras__fondo">
                                        <div className={`barras__relleno barras__relleno--${b.clave}`} style={{ width: `${(minutos[b.clave] / mayor) * 100}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                    {espera > 0 && (
                        <p className="alerta-aviso historial__nota">
                            El {espera} % del tiempo se consumió esperando. El tiempo en espera no cuenta para el tiempo esperado de atención.
                        </p>
                    )}
                </aside>
            </div>
        </div>
    )
}

export default HistorialTicket
