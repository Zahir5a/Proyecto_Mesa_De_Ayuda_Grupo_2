import { useState } from 'react'
import { useAhora } from '../../hooks/useAhora'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useEncuestas } from '../../hooks/useEncuestas'
import { useToast } from '../../hooks/useToast'
import { listarTecnicos } from '../../services/catalogoService'
import {
    ASPECTOS,
    encuestasDelPeriodo,
    promediosPor,
    promedio,
    respondida,
    tasaDeRespuesta,
} from '../../services/encuestasService'
import { formatearFecha } from '../../utils/formato'
import '../../components/categorias/TablaCategoria.css'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import '../usuario/encuestas.css'

const DIA = 86400000

const PERIODOS = [
    { id: '30', nombre: 'Últimos 30 días', dias: 30 },
    { id: '60', nombre: 'Últimos 60 días', dias: 60 },
    { id: 'todo', nombre: 'Todo el historial', dias: null },
    { id: 'rango', nombre: 'Rango de fechas…', dias: null },
]

const FILTROS_PUNTAJE = [
    { id: 'todos', nombre: 'todos' },
    { id: 'bajo', nombre: '1 a 3' },
    { id: 'alto', nombre: '4 a 5' },
    { id: '1', nombre: 'solo 1' },
    { id: '2', nombre: 'solo 2' },
    { id: '3', nombre: 'solo 3' },
    { id: '4', nombre: 'solo 4' },
    { id: '5', nombre: 'solo 5' },
]

const nota = (n) => n.toFixed(1)

function claseNota(general) {
    if (general >= 4) return 'puntaje-bueno'
    if (general >= 3) return 'puntaje-medio'
    return 'puntaje-malo'
}

function csv(filas) {
    return filas.map((f) => f.map((c) => '"' + String(c).replaceAll('"', '""') + '"').join(',')).join('\r\n')
}

// Satisfacción por técnico y por categoría, con filtro de periodo y comentarios recibidos (HU-6).
function Satisfaccion() {
    const { categorias } = useCatalogo()
    const todas = useEncuestas()
    const { exito } = useToast()
    const ahora = useAhora()

    const [periodoId, setPeriodoId] = useState('30')
    const [desde, setDesde] = useState('')
    const [hasta, setHasta] = useState('')
    const [filtroPuntaje, setFiltroPuntaje] = useState('bajo')

    const periodo = PERIODOS.find((p) => p.id === periodoId)
    const rango = {
        desde: periodo.dias ? new Date(ahora - periodo.dias * DIA) : periodoId === 'rango' && desde ? new Date(desde + 'T00:00:00') : null,
        hasta: periodoId === 'rango' && hasta ? new Date(hasta + 'T23:59:59') : null,
    }
    const delPeriodo = encuestasDelPeriodo(todas, rango)
    const contestadas = delPeriodo.filter(respondida)

    const tecnicos = listarTecnicos()
    const nombreTecnico = (id) => {
        const t = tecnicos.find((x) => x.id === id)
        return t ? `${t.nombres} ${t.apellidos}` : id
    }
    const nombreCategoria = (id) => (categorias.find((c) => c.id === id) ?? { nombre: id }).nombre

    const porTecnico = promediosPor(delPeriodo, 'tecnicoId').sort((a, b) => b.encuestas - a.encuestas)
    const porCategoria = promediosPor(delPeriodo, 'categoriaId').sort((a, b) => a.general - b.general)
    const principal = (item) => {
        const cuenta = {}
        item.categorias.forEach((c) => { cuenta[c] = (cuenta[c] ?? 0) + 1 })
        return Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0]
    }

    const promedioGeneral = promedio(contestadas.map((e) => e.general))
    const peorCategoria = porCategoria[0]
    const aspectoPeor = ASPECTOS
        .map((a) => ({ nombre: a.nombre, valor: promedio(contestadas.map((e) => e[a.id])) }))
        .sort((a, b) => a.valor - b.valor)[0]

    const comentarios = contestadas
        .filter((e) => e.comentario)
        .filter((e) => {
            if (filtroPuntaje === 'bajo') return e.general <= 3
            if (filtroPuntaje === 'alto') return e.general >= 4
            if (filtroPuntaje === 'todos') return true
            return e.general === Number(filtroPuntaje)
        })
        .sort((a, b) => new Date(b.respondidaEn) - new Date(a.respondidaEn))

    function exportar() {
        const filas = [['Técnico', 'Categoría principal', 'General', 'Rapidez', 'Trato', 'Solución', 'Encuestas']]
        porTecnico.forEach((t) => {
            filas.push([nombreTecnico(t.id), nombreCategoria(principal(t)), nota(t.general), nota(t.rapidez), nota(t.trato), nota(t.solucion), t.encuestas])
        })
        const enlace = document.createElement('a')
        enlace.href = URL.createObjectURL(new Blob(['﻿' + csv(filas)], { type: 'text/csv;charset=utf-8' }))
        enlace.download = 'satisfaccion-por-tecnico.csv'
        enlace.click()
        URL.revokeObjectURL(enlace.href)
        exito('Exportamos la satisfacción por técnico a un archivo CSV.')
    }

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Satisfacción por técnico y categoría</h1>
                    <p className="texto-aux">
                        {contestadas.length} encuestas respondidas · tasa de respuesta {tasaDeRespuesta(delPeriodo)} % · promedio general {nota(promedioGeneral)} de 5
                    </p>
                </div>
                <div className="satisfaccion__acciones">
                    <select className="tickets__control" aria-label="Periodo" value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
                        {PERIODOS.map((p) => <option key={p.id} value={p.id}>Periodo: {p.nombre.toLowerCase()}</option>)}
                    </select>
                    {periodoId === 'rango' && (
                        <>
                            <label className="tickets__fecha">Desde<input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} /></label>
                            <label className="tickets__fecha">Hasta<input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} /></label>
                        </>
                    )}
                    <button type="button" className="boton" onClick={exportar} disabled={porTecnico.length === 0}>Exportar</button>
                </div>
            </div>

            {contestadas.length === 0 ? (
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>No hay encuestas en este periodo</h2>
                    <p>Prueba con un periodo más amplio.</p>
                    <button type="button" className="boton boton--primario" onClick={() => setPeriodoId('todo')}>Ver todo el historial</button>
                </div>
            ) : (
                <div className="satisfaccion__rejilla">
                    <div className="satisfaccion__tablas">
                        <section className="tabla-container">
                            <div className="tabla-desplazable">
                                <table className="tabla-categorias tabla-satisfaccion tabla-satisfaccion--tecnicos">
                                    <thead>
                                        <tr>
                                            <th>TÉCNICO</th><th>CATEGORÍA PRINCIPAL</th><th>GENERAL</th><th>RAPIDEZ</th><th>TRATO</th><th>SOLUCIÓN</th><th>ENCUESTAS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {porTecnico.map((t) => (
                                            <tr key={t.id}>
                                                <td><strong>{nombreTecnico(t.id)}</strong></td>
                                                <td className="celda-suave">{nombreCategoria(principal(t))}</td>
                                                <td><strong className={claseNota(t.general)}>{nota(t.general)}</strong></td>
                                                <td>{nota(t.rapidez)}</td>
                                                <td>{nota(t.trato)}</td>
                                                <td>{nota(t.solucion)}</td>
                                                <td><strong>{t.encuestas}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {peorCategoria && (
                                <p className="satisfaccion__nota">
                                    {nombreCategoria(peorCategoria.id)} es la categoría con menor promedio ({nota(peorCategoria.general)}).{' '}
                                    {aspectoPeor.nombre} es el aspecto peor calificado del área.
                                </p>
                            )}
                        </section>

                        <section className="tabla-container">
                            <div className="tabla-desplazable">
                                <table className="tabla-categorias tabla-satisfaccion">
                                    <thead>
                                        <tr><th>CATEGORÍA</th><th>GENERAL</th><th>RAPIDEZ</th><th>TRATO</th><th>SOLUCIÓN</th><th>ENCUESTAS</th></tr>
                                    </thead>
                                    <tbody>
                                        {[...porCategoria].sort((a, b) => b.encuestas - a.encuestas).map((c) => (
                                            <tr key={c.id}>
                                                <td><strong>{nombreCategoria(c.id)}</strong></td>
                                                <td><strong className={claseNota(c.general)}>{nota(c.general)}</strong></td>
                                                <td>{nota(c.rapidez)}</td>
                                                <td>{nota(c.trato)}</td>
                                                <td>{nota(c.solucion)}</td>
                                                <td><strong>{c.encuestas}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <aside className="tarjeta satisfaccion__comentarios">
                        <div className="atencion__encabezado">
                            <h2>Comentarios recibidos</h2>
                            <label className="atencion__filtro">
                                Puntaje:
                                <select aria-label="Filtrar comentarios por puntaje" value={filtroPuntaje} onChange={(e) => setFiltroPuntaje(e.target.value)}>
                                    {FILTROS_PUNTAJE.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                                </select>
                            </label>
                        </div>
                        {comentarios.length === 0 ? (
                            <p className="texto-aux">No hay comentarios con este puntaje en el periodo.</p>
                        ) : (
                            <ul className="comentarios">
                                {comentarios.slice(0, 12).map((e, i) => (
                                    <li key={i} className="comentarios__item">
                                        <p className="comentarios__cabecera">
                                            <strong className={claseNota(e.general)}>{e.general} / 5</strong>
                                            <span className="texto-aux">{nombreCategoria(e.categoriaId)} · {nombreTecnico(e.tecnicoId)} · {formatearFecha(e.respondidaEn)}</span>
                                        </p>
                                        <p>«{e.comentario}»</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {comentarios.length > 12 && <p className="texto-aux">Mostrando 12 de {comentarios.length} comentarios.</p>}
                    </aside>
                </div>
            )}
        </div>
    )
}

export default Satisfaccion
