import { useState } from 'react'
import SelectorPeriodo from '../../components/metricas/SelectorPeriodo'
import { useAhora } from '../../hooks/useAhora'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useEncuestas } from '../../hooks/useEncuestas'
import { useTickets } from '../../hooks/useTickets'
import { listarTecnicos } from '../../services/catalogoService'
import { promedio, respondida } from '../../services/encuestasService'
import { formatearTiempo } from '../../utils/etapas'
import { cargaPorTecnico } from '../../utils/metricas'
import { dentroDe, rangoDe } from '../../utils/periodos'
import '../../components/categorias/TablaCategoria.css'
import '../usuario/tickets.css'
import './metricas.css'

// Carga de trabajo de cada técnico (HU-7): tickets asignados, resueltos y en espera, con su tiempo y satisfacción.
function CargaTecnicos() {
    const { categorias } = useCatalogo()
    const tickets = useTickets()
    const encuestas = useEncuestas()
    const ahora = useAhora()
    const [seleccion, setSeleccion] = useState({ id: '30', desde: '', hasta: '' })

    const rango = rangoDe(seleccion, ahora)
    const nombreCategoria = (id) => (categorias.find((c) => c.id === id) ?? { nombre: id }).nombre

    const filas = listarTecnicos().map((t) => {
        const carga = cargaPorTecnico(tickets, t.id, rango, ahora)
        const propias = encuestas.filter((e) => e.tecnicoId === t.id && respondida(e) && dentroDe(e.respondidaEn, rango))
        return {
            ...t,
            ...carga,
            satisfaccion: propias.length > 0 ? promedio(propias.map((e) => e.general)) : null,
        }
    })

    const totalAsignados = filas.reduce((suma, f) => suma + f.asignados, 0)
    const mayorResueltos = Math.max(1, ...filas.map((f) => f.resueltos))
    const masCargado = [...filas].sort((a, b) => b.asignados - a.asignados)[0]
    const concentrado = masCargado && totalAsignados > 0 && masCargado.asignados / totalAsignados >= 0.3

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Carga por técnico</h1>
                    <p className="texto-aux">
                        {filas.length} técnicos activos · {totalAsignados} tickets asignados · promedio{' '}
                        {(filas.length === 0 ? 0 : totalAsignados / filas.length).toFixed(1)} tickets por técnico
                    </p>
                </div>
                <SelectorPeriodo valor={seleccion} onCambiar={setSeleccion} />
            </div>

            <div className="tabla-container">
                <div className="tabla-desplazable">
                    <table className="tabla-categorias tabla-carga">
                        <thead>
                            <tr>
                                <th>TÉCNICO</th><th>ESPECIALIDAD</th><th>ASIGNADOS</th><th>RESUELTOS</th><th>EN ESPERA</th>
                                <th>TIEMPO PROMEDIO</th><th>SATISFACCIÓN</th><th>RESUELTOS EN EL PERIODO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((f) => (
                                <tr key={f.id}>
                                    <td><strong>{f.nombres} {f.apellidos}</strong></td>
                                    <td className="celda-suave">
                                        {(f.especialidades.length > 0 ? f.especialidades : f.categorias).slice(0, 2).map(nombreCategoria).join(' · ') || '—'}
                                    </td>
                                    <td><strong>{f.asignados}</strong></td>
                                    <td>{f.resueltos}</td>
                                    <td>{f.enEspera}</td>
                                    <td>{f.tiempoPromedio === null ? '—' : formatearTiempo(f.tiempoPromedio)}</td>
                                    <td>{f.satisfaccion === null ? '—' : <strong className="encuestas__puntaje">{f.satisfaccion.toFixed(1)} / 5</strong>}</td>
                                    <td>
                                        <div className="barras__fondo carga__barra" aria-label={`${f.resueltos} resueltos`}>
                                            <div className="barras-h__relleno" style={{ width: `${(f.resueltos / mayorResueltos) * 100}%`, background: 'var(--primary)' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="matriz__notas">
                <p className="matriz__aviso">
                    {concentrado
                        ? `${masCargado.nombres} ${masCargado.apellidos} concentra ${masCargado.asignados} de los ${totalAsignados} tickets asignados. Considera repartir sus tickets con otro técnico habilitado.`
                        : 'La carga está repartida de forma pareja entre los técnicos.'}
                </p>
                <p className="matriz__nota">
                    Los tickets en espera no cuentan en el tiempo promedio. Satisfacción es el promedio de las encuestas respondidas del periodo.
                </p>
            </div>
        </div>
    )
}

export default CargaTecnicos
