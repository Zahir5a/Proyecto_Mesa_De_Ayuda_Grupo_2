import { Link } from 'react-router-dom'
import Etiqueta from '../../components/ui/Etiqueta'
import { useAhora } from '../../hooks/useAhora'
import { useAuth } from '../../hooks/useAuth'
import { useTickets } from '../../hooks/useTickets'
import { tecnicoDeUsuario } from '../../services/ticketsService'
import { formatearFecha } from '../../utils/formato'
import { formatearTiempo, horasDeAtencion } from '../../utils/etapas'
import '../../components/categorias/TablaCategoria.css'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'

// Historial del técnico: los tickets que ya cerró, con su tiempo de atención y el enlace a su historial de cambios.
function HistorialTecnico() {
    const { usuario } = useAuth()
    const tickets = useTickets()
    const ahora = useAhora()
    const tecnico = tecnicoDeUsuario(usuario)

    const cerrados = tecnico
        ? tickets.filter((t) => t.tecnicoId === tecnico.id && t.estado === 'cerrado').sort((a, b) => new Date(b.cerradoEn) - new Date(a.cerradoEn))
        : []

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Historial</h1>
                    <p className="texto-aux">{cerrados.length} {cerrados.length === 1 ? 'ticket cerrado' : 'tickets cerrados'} por ti.</p>
                </div>
            </div>

            {cerrados.length === 0 ? (
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>Aún no cerraste ningún ticket</h2>
                    <p>Cuando cierres uno aparecerá aquí con su historial de cambios.</p>
                    <Link to="/tecnico" className="boton boton--primario">Ir a mi bandeja</Link>
                </div>
            ) : (
                <div className="tabla-container">
                    <div className="tabla-desplazable">
                        <table className="tabla-categorias">
                            <thead>
                                <tr>
                                    <th>CÓDIGO</th><th>ASUNTO</th><th>AMBIENTE</th><th>SOLICITANTE</th><th>PRIORIDAD</th>
                                    <th>CERRADO</th><th>TIEMPO DE ATENCIÓN</th><th>ACCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cerrados.map((t) => (
                                    <tr key={t.codigo}>
                                        <td><Link to={`/tecnico/tickets/${t.codigo}`} className="codigo-ticket">{t.codigo}</Link></td>
                                        <td>{t.asunto}</td>
                                        <td className="codigo">{t.ambiente}</td>
                                        <td>{t.solicitante}</td>
                                        <td><Etiqueta tipo="prioridad" valor={t.prioridad} /></td>
                                        <td className="celda-suave">{formatearFecha(t.cerradoEn)}</td>
                                        <td>{formatearTiempo((t.tiempoTotalAtencion ?? horasDeAtencion(t, ahora)) * 60)}</td>
                                        <td><Link to={`/tecnico/tickets/${t.codigo}/historial`} className="codigo-ticket">Ver historial</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HistorialTecnico
