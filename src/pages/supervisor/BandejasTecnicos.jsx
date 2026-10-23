import { Link } from 'react-router-dom'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { listarTecnicos } from '../../services/catalogoService'
import { cargaDe, estaEnCurso } from '../../services/ticketsService'
import '../../components/categorias/TablaCategoria.css'
import '../usuario/tickets.css'
import './cola.css'

// Carga de cada técnico: cuántos tickets lleva y cuántos son críticos. Enlaza con la cola ya filtrada.
function BandejasTecnicos() {
    const { categorias } = useCatalogo()
    const tickets = useTickets()
    const tecnicos = listarTecnicos()
    const nombreCategoria = (id) => (categorias.find((c) => c.id === id) ?? { nombre: id }).nombre

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Bandejas de técnicos</h1>
                    <p className="texto-aux">Tickets en curso de cada técnico. Usa la cola de atención para reasignarlos.</p>
                </div>
            </div>

            <div className="tabla-container">
                <div className="tabla-desplazable">
                    <table className="tabla-categorias">
                        <thead>
                            <tr>
                                <th>TÉCNICO</th>
                                <th>CATEGORÍAS HABILITADAS</th>
                                <th>EN CURSO</th>
                                <th>CRÍTICOS</th>
                                <th>EN ATENCIÓN</th>
                                <th>EN ESPERA</th>
                                <th>ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tecnicos.map((tec) => {
                                const carga = cargaDe(tickets, tec.id)
                                const propios = tickets.filter((t) => t.tecnicoId === tec.id && estaEnCurso(t))
                                return (
                                    <tr key={tec.id}>
                                        <td><strong>{tec.nombres} {tec.apellidos}</strong></td>
                                        <td className="celda-suave">{tec.categorias.map(nombreCategoria).join(', ') || '—'}</td>
                                        <td><strong>{carga.total}</strong></td>
                                        <td>{carga.criticos}</td>
                                        <td>{propios.filter((t) => t.estado === 'en_atencion').length}</td>
                                        <td>{propios.filter((t) => t.estado === 'en_espera').length}</td>
                                        <td><Link to={`/supervisor/cola?tecnico=${tec.id}`} className="codigo-ticket">Ver en la cola</Link></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default BandejasTecnicos
