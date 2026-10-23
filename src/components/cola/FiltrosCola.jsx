import { PRIORIDADES } from '../../data/contenidoPublico'
import { ESTADOS } from '../../data/tickets'

// Barra de búsqueda y filtros de la cola. Todo se decide en useCola; aquí solo se dibuja.
function FiltrosCola({ filtros, cambiarFiltro, categorias, ambientes, tecnicos, chips, limpiar, orden, setOrden }) {
    return (
        <div className="cola__filtros">
            <div className="cola__fila">
                <input type="search" className="cola__control cola__buscador" placeholder="Buscar código, asunto o usuario"
                    aria-label="Buscar por código, asunto o usuario" value={filtros.texto}
                    onChange={(e) => cambiarFiltro('texto', e.target.value)} />
                <select className="cola__control" aria-label="Prioridad" value={filtros.prioridad}
                    onChange={(e) => cambiarFiltro('prioridad', e.target.value)}>
                    <option value="todas">Prioridad: todas</option>
                    {PRIORIDADES.map((p) => <option key={p.id} value={p.id}>Prioridad: {p.nombre.toLowerCase()}</option>)}
                </select>
                <select className="cola__control" aria-label="Estado" value={filtros.estado}
                    onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                    <option value="en_curso">Estado: en curso</option>
                    <option value="todos">Estado: todos</option>
                    {ESTADOS.map((e) => <option key={e.id} value={e.id}>Estado: {e.nombre.toLowerCase()}</option>)}
                </select>
                <select className="cola__control" aria-label="Categoría" value={filtros.categoriaId}
                    onChange={(e) => cambiarFiltro('categoriaId', e.target.value)}>
                    <option value="todas">Categoría: todas</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select className="cola__control" aria-label="Ambiente" value={filtros.ambiente}
                    onChange={(e) => cambiarFiltro('ambiente', e.target.value)}>
                    <option value="todos">Ambiente: todos</option>
                    {ambientes.map((a) => <option key={a.codigo} value={a.codigo}>{a.codigo}</option>)}
                </select>
                <select className="cola__control" aria-label="Técnico" value={filtros.tecnicoId}
                    onChange={(e) => cambiarFiltro('tecnicoId', e.target.value)}>
                    <option value="todos">Técnico: todos</option>
                    <option value="sin_asignar">Sin asignar</option>
                    {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>)}
                </select>
                <select className="cola__control" aria-label="Orden" value={orden} onChange={(e) => setOrden(e.target.value)}>
                    <option value="antiguedad">Orden: antigüedad</option>
                    <option value="reciente">Orden: más recientes</option>
                    <option value="prioridad">Orden: prioridad</option>
                    <option value="sin_atencion">Orden: tiempo sin atención</option>
                </select>
            </div>

            {chips.length > 0 && (
                <div className="cola__chips">
                    {chips.map((c) => (
                        <span key={c.clave} className="cola__chip">
                            {c.texto}
                            <button type="button" aria-label={`Quitar filtro ${c.texto}`} onClick={() => cambiarFiltro(c.clave, c.vacio)}>×</button>
                        </span>
                    ))}
                    <button type="button" className="tickets__limpiar" onClick={limpiar}>Limpiar filtros</button>
                </div>
            )}
        </div>
    )
}

export default FiltrosCola
