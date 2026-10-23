import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Etiqueta from '../../components/ui/Etiqueta'
import Paginacion from '../../components/ui/Paginacion'
import { ESTADOS } from '../../data/tickets'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { estaEnCurso, ticketsDeUsuario } from '../../services/ticketsService'
import { formatearFecha } from '../../utils/formato'
import '../../components/categorias/TablaCategoria.css' // tabla y pie de tabla compartidos con el catálogo
import '../../components/ui/estadoVacio.css'
import './tickets.css'

const FILAS_POR_PAGINA = 8
const SIN_FILTROS = { codigo: '', estado: 'todos', desde: '', hasta: '', categoriaId: 'todas' }

function nombreSubcategoria(categorias, ticket) {
    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    if (!categoria) return ticket.categoriaId
    const sub = categoria.subcategorias.find((s) => s.id === ticket.subcategoriaId)
    return sub ? `${categoria.nombre} · ${sub.nombre}` : categoria.nombre
}

function MisTickets() {
    const { usuario } = useAuth()
    const { categorias } = useCatalogo()
    const navigate = useNavigate()
    const propios = ticketsDeUsuario(useTickets(), usuario.id)

    const [filtros, setFiltros] = useState(SIN_FILTROS)
    const [paginaActual, setPaginaActual] = useState(1)

    function cambiarFiltro(campo, valor) {
        setFiltros({ ...filtros, [campo]: valor })
        setPaginaActual(1)
    }

    const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS)
    const texto = filtros.codigo.trim().toLowerCase()
    const desde = filtros.desde ? new Date(filtros.desde + 'T00:00:00') : null
    const hasta = filtros.hasta ? new Date(filtros.hasta + 'T23:59:59') : null

    const filtrados = propios
        .filter((t) => {
            if (texto && !t.codigo.toLowerCase().includes(texto)) return false
            if (filtros.estado === 'en_curso' && !estaEnCurso(t)) return false
            if (filtros.estado !== 'todos' && filtros.estado !== 'en_curso' && t.estado !== filtros.estado) return false
            if (desde && new Date(t.registradoEn) < desde) return false
            if (hasta && new Date(t.registradoEn) > hasta) return false
            if (filtros.categoriaId !== 'todas' && t.categoriaId !== filtros.categoriaId) return false
            return true
        })
        .sort((a, b) => new Date(b.registradoEn) - new Date(a.registradoEn))

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / FILAS_POR_PAGINA))
    const pagina = Math.min(paginaActual, totalPaginas)
    const inicio = (pagina - 1) * FILAS_POR_PAGINA
    const filasPagina = filtrados.slice(inicio, inicio + FILAS_POR_PAGINA)
    const enCurso = propios.filter(estaEnCurso).length

    // Sin ningún ticket: se invita a registrar el primero
    if (propios.length === 0) {
        return (
            <div>
                <h1>Mis tickets</h1>
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>Todavía no has reportado nada</h2>
                    <p>Cuando registres un ticket lo verás aquí con su estado y su prioridad.</p>
                    <Link to="/usuario/nuevo-ticket" className="boton boton--primario">Registrar un ticket</Link>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Mis tickets</h1>
                    <p className="texto-aux">{propios.length} tickets registrados · {enCurso} en curso</p>
                </div>
                <Link to="/usuario/nuevo-ticket" className="boton boton--primario">Registrar un ticket</Link>
            </div>

            <div className="tickets__filtros">
                <input type="search" className="tickets__control tickets__control--codigo" placeholder="TCK-2026-…" aria-label="Buscar por código"
                    value={filtros.codigo} onChange={(e) => cambiarFiltro('codigo', e.target.value)} />
                <select className="tickets__control" aria-label="Filtrar por estado" value={filtros.estado}
                    onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                    <option value="todos">Estado: todos</option>
                    <option value="en_curso">Estado: en curso</option>
                    {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <label className="tickets__fecha">
                    Desde
                    <input type="date" value={filtros.desde} max={filtros.hasta || undefined}
                        onChange={(e) => cambiarFiltro('desde', e.target.value)} />
                </label>
                <label className="tickets__fecha">
                    Hasta
                    <input type="date" value={filtros.hasta} min={filtros.desde || undefined}
                        onChange={(e) => cambiarFiltro('hasta', e.target.value)} />
                </label>
                <select className="tickets__control" aria-label="Filtrar por categoría" value={filtros.categoriaId}
                    onChange={(e) => cambiarFiltro('categoriaId', e.target.value)}>
                    <option value="todas">Categoría: todas</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {hayFiltros && (
                    <button type="button" className="tickets__limpiar" onClick={() => { setFiltros(SIN_FILTROS); setPaginaActual(1) }}>
                        Limpiar filtros
                    </button>
                )}
            </div>

            <div className="tabla-container">
                <div className="tabla-desplazable">
                    <table className="tabla-categorias tabla-tickets">
                        <thead>
                            <tr>
                                <th>CÓDIGO</th>
                                <th>ASUNTO</th>
                                <th>CATEGORÍA</th>
                                <th>AMBIENTE</th>
                                <th>REGISTRADO</th>
                                <th>PRIORIDAD</th>
                                <th>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filasPagina.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="tabla-vacia">Ningún ticket coincide con los filtros.</td>
                                </tr>
                            )}
                            {filasPagina.map((t) => (
                                <tr key={t.codigo} className="tabla-tickets__fila" onClick={() => navigate(`/usuario/tickets/${t.codigo}`)}>
                                    <td><Link to={`/usuario/tickets/${t.codigo}`} className="codigo-ticket">{t.codigo}</Link></td>
                                    <td>{t.asunto}</td>
                                    <td className="celda-suave">{nombreSubcategoria(categorias, t)}</td>
                                    <td className="codigo">{t.ambiente}</td>
                                    <td className="celda-suave">{formatearFecha(t.registradoEn)}</td>
                                    <td><Etiqueta tipo="prioridad" valor={t.prioridad} /></td>
                                    <td><Etiqueta tipo="estado" valor={t.estado} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="tabla-footer">
                    <span className="tabla-info">
                        {filtrados.length === 0
                            ? 'Mostrando 0 tickets'
                            : `Mostrando ${inicio + 1}–${inicio + filasPagina.length} de ${filtrados.length} tickets`}
                    </span>
                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPaginaActual} />
                </div>
            </div>
        </div>
    )
}

export default MisTickets
