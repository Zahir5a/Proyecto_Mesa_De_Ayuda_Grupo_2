import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Etiqueta from '../ui/Etiqueta'
import { buscarTecnico } from '../../services/catalogoService'
import { formatearDuracion } from '../../utils/tiempos'

function nombreCategoria(categorias, ticket) {
    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    if (!categoria) return ticket.categoriaId
    const sub = categoria.subcategorias.find((s) => s.id === ticket.subcategoriaId)
    return sub ? `${categoria.nombre} · ${sub.nombre}` : categoria.nombre
}

// Tabla de la cola con casillas para elegir varios tickets (acciones en lote).
function TablaCola({ filas, categorias, seleccion, onAlternar, onAlternarPagina, paginaCompleta, ahora }) {
    const casillaTodas = useRef(null)
    const algunaMarcada = filas.some((t) => seleccion.has(t.codigo))

    useEffect(() => {
        if (casillaTodas.current) casillaTodas.current.indeterminate = algunaMarcada && !paginaCompleta
    }, [algunaMarcada, paginaCompleta])

    return (
        <div className="tabla-desplazable">
            <table className="tabla-categorias tabla-cola">
                <thead>
                    <tr>
                        <th>
                            <input ref={casillaTodas} type="checkbox" checked={paginaCompleta} onChange={onAlternarPagina}
                                aria-label="Seleccionar todos los tickets de esta página" />
                        </th>
                        <th>CÓDIGO</th>
                        <th>ASUNTO</th>
                        <th>CATEGORÍA</th>
                        <th>AMBIENTE</th>
                        <th>SOLICITANTE</th>
                        <th>ANTIGÜEDAD</th>
                        <th>PRIORIDAD</th>
                        <th>ESTADO</th>
                        <th>TÉCNICO</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map((t) => {
                        const marcado = seleccion.has(t.codigo)
                        const tecnico = t.tecnicoId ? buscarTecnico(t.tecnicoId) : null
                        return (
                            <tr key={t.codigo} className={`fila--${t.prioridad}${marcado ? ' fila--marcada' : ''}`}>
                                <td>
                                    <input type="checkbox" checked={marcado} onChange={() => onAlternar(t.codigo)}
                                        aria-label={`Seleccionar ${t.codigo}`} />
                                </td>
                                <td><Link to={`/supervisor/cola/${t.codigo}`} className="codigo-ticket">{t.codigo}</Link></td>
                                <td>{t.asunto}</td>
                                <td className="celda-suave">{nombreCategoria(categorias, t)}</td>
                                <td className="codigo">{t.ambiente}</td>
                                <td>{t.solicitante}</td>
                                <td className="celda-suave">{formatearDuracion((ahora - new Date(t.registradoEn)) / 60000)}</td>
                                <td><Etiqueta tipo="prioridad" valor={t.prioridad} /></td>
                                <td><Etiqueta tipo="estado" valor={t.estado} /></td>
                                <td className={tecnico ? '' : 'celda-suave'}>{tecnico ? `${tecnico.nombres} ${tecnico.apellidos}` : 'Sin asignar'}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default TablaCola
