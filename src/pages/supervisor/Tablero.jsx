import { useState } from 'react'
import { Anillo, Barras } from '../../components/metricas/Graficos'
import SelectorPeriodo from '../../components/metricas/SelectorPeriodo'
import { useAhora } from '../../hooks/useAhora'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { estaEnCurso } from '../../services/ticketsService'
import { formatearFechaHora } from '../../utils/formato'
import { formatearTiempo } from '../../utils/etapas'
import {
    contarPor,
    distribucionPorEstado,
    fueraDelTiempoEsperado,
    tiempoPromedioAtencion,
    ticketsDelPeriodo,
    variacion,
} from '../../utils/metricas'
import { rangoAnterior, rangoDe } from '../../utils/periodos'
import { descargarCsv } from '../../utils/exportarCsv'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import './metricas.css'

function textoVariacion(valor, sufijo = '') {
    if (valor === null) return 'Sin periodo anterior para comparar'
    if (valor === 0) return `Igual que el periodo anterior${sufijo}`
    return `${valor > 0 ? '+' : '−'}${Math.abs(valor)} % frente al periodo anterior`
}

// Tablero de métricas del supervisor (HU-7): totales del periodo y distribución por estado, categoría y ambiente.
function Tablero() {
    const { categorias } = useCatalogo()
    const todos = useTickets()
    const { exito } = useToast()
    const ahora = useAhora()
    const [seleccion, setSeleccion] = useState({ id: '30', desde: '', hasta: '' })

    const rango = rangoDe(seleccion, ahora)
    const previo = rangoAnterior(rango)
    const delPeriodo = ticketsDelPeriodo(todos, rango)
    const delPrevio = previo ? ticketsDelPeriodo(todos, previo) : null

    const abiertosAhora = todos.filter(estaEnCurso)
    const sinAsignar = abiertosAhora.filter((t) => !t.tecnicoId).length
    const promedio = tiempoPromedioAtencion(delPeriodo, ahora)
    const promedioPrevio = delPrevio ? tiempoPromedioAtencion(delPrevio, ahora) : null
    const fuera = fueraDelTiempoEsperado(delPeriodo, categorias, ahora)
    const porcentajeFuera = delPeriodo.length === 0 ? 0 : Math.round((fuera.length / delPeriodo.length) * 1000) / 10

    const estados = distribucionPorEstado(delPeriodo)
    const nombreCategoria = (id) => (categorias.find((c) => c.id === id) ?? { nombre: id }).nombre
    const porCategoria = contarPor(delPeriodo, 'categoriaId').map((c) => ({ ...c, nombre: nombreCategoria(c.clave) }))
    const porAmbiente = contarPor(delPeriodo, 'ambiente')
        .slice(0, 6)
        .map((a) => ({ ...a, nombre: a.clave }))

    function descargar() {
        const filas = [
            ['Indicador', 'Valor'],
            ['Tickets del periodo', delPeriodo.length],
            ['Abiertos ahora', abiertosAhora.length],
            ['Sin asignar', sinAsignar],
            ['Tiempo promedio de atención (min)', promedio === null ? '' : Math.round(promedio)],
            ['Fuera del tiempo esperado', fuera.length],
            [],
            ['Estado', 'Tickets'],
            ...estados.map((e) => [e.nombre, e.valor]),
            [],
            ['Categoría', 'Tickets'],
            ...porCategoria.map((c) => [c.nombre, c.valor]),
            [],
            ['Ambiente', 'Tickets'],
            ...porAmbiente.map((a) => [a.nombre, a.valor]),
        ]
        descargarCsv('reporte-de-metricas.csv', filas)
        exito('Descargamos el reporte de métricas en un archivo CSV.')
    }

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Tablero de métricas</h1>
                    <p className="texto-aux">Campus Monterrico · datos al {formatearFechaHora(ahora)}</p>
                </div>
                <div className="satisfaccion__acciones">
                    <SelectorPeriodo valor={seleccion} onCambiar={setSeleccion} />
                    <button type="button" className="boton" onClick={descargar}>Descargar reporte</button>
                </div>
            </div>

            <div className="indicadores">
                <section className="tarjeta indicador">
                    <span className="campo__etiqueta">Tickets del periodo</span>
                    <p className="indicador__valor">{delPeriodo.length}</p>
                    <p className="indicador__nota">{textoVariacion(delPrevio ? variacion(delPeriodo.length, delPrevio.length) : null)}</p>
                </section>
                <section className="tarjeta indicador">
                    <span className="campo__etiqueta">Abiertos ahora</span>
                    <p className="indicador__valor">{abiertosAhora.length}</p>
                    <p className="indicador__nota">{sinAsignar} sin asignar</p>
                </section>
                <section className="tarjeta indicador">
                    <span className="campo__etiqueta">Tiempo promedio de atención</span>
                    <p className="indicador__valor">{promedio === null ? '—' : formatearTiempo(promedio)}</p>
                    <p className="indicador__nota">
                        {promedio !== null && promedioPrevio !== null
                            ? `${promedio <= promedioPrevio ? '−' : '+'}${formatearTiempo(Math.abs(promedio - promedioPrevio))} frente al periodo anterior`
                            : 'Solo cuenta tickets resueltos o cerrados'}
                    </p>
                </section>
                <section className={fuera.length > 0 ? 'tarjeta indicador indicador--alerta' : 'tarjeta indicador'}>
                    <span className="campo__etiqueta">Fuera del tiempo esperado</span>
                    <p className="indicador__valor">{fuera.length}</p>
                    <p className="indicador__nota">{porcentajeFuera.toLocaleString('es-PE')} % de los tickets del periodo</p>
                </section>
            </div>

            {delPeriodo.length === 0 ? (
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>No hay tickets en este periodo</h2>
                    <p>Prueba con un periodo más amplio.</p>
                    <button type="button" className="boton boton--primario" onClick={() => setSeleccion({ id: 'todo', desde: '', hasta: '' })}>
                        Ver todo el historial
                    </button>
                </div>
            ) : (
                <div className="graficos">
                    <section className="tarjeta">
                        <h2>Tickets por estado</h2>
                        <div className="graficos__estado">
                            <Anillo datos={estados} total={delPeriodo.length} etiqueta="tickets" />
                            <ul className="leyenda">
                                {estados.map((e) => (
                                    <li key={e.id}>
                                        <span className="leyenda__color" style={{ background: e.color }} aria-hidden="true" />
                                        {e.nombre} · {e.valor}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                    <section className="tarjeta">
                        <h2>Tickets por categoría</h2>
                        <Barras datos={porCategoria} />
                    </section>
                    <section className="tarjeta">
                        <h2>Ambientes con más tickets</h2>
                        <Barras datos={porAmbiente} color="var(--accent)" mono />
                    </section>
                </div>
            )}
        </div>
    )
}

export default Tablero
