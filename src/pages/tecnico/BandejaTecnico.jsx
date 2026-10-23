import { useState } from 'react'
import { Link } from 'react-router-dom'
import Etiqueta from '../../components/ui/Etiqueta'
import { PRIORIDADES } from '../../data/contenidoPublico'
import { useAhora } from '../../hooks/useAhora'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { autoasignarTicket, estaEnBandeja, estaEnCurso, tecnicoDeUsuario } from '../../services/ticketsService'
import { formatearFecha } from '../../utils/formato'
import { fueraDePlazo, formatearDuracion, limiteDe, minutosRestantes, textoPlazo } from '../../utils/tiempos'
import '../../components/categorias/TablaCategoria.css'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import '../supervisor/cola.css'
import './bandeja.css'

const PESTANAS = [
    { id: 'todos', nombre: 'Todos' },
    { id: 'criticos', nombre: 'Solo críticos' },
    { id: 'plazo', nombre: 'Fuera de plazo' },
    { id: 'hoy', nombre: 'Hoy' },
]

const ESTADOS_RESUMEN = [
    { id: 'abierto', nombre: 'Abiertos' },
    { id: 'en_atencion', nombre: 'En atención' },
    { id: 'en_espera', nombre: 'En espera' },
    { id: 'resuelto', nombre: 'Resueltos' },
]

const TITULOS = {
    en_atencion: 'En atención',
    en_espera: 'En espera',
    resuelto: 'Resueltos hoy',
}

const esDeHoy = (fecha, ahora) => new Date(fecha).toDateString() === new Date(ahora).toDateString()

const porPrioridadYPlazo = (categorias) => (a, b) =>
    PRIORIDADES.findIndex((p) => p.id === a.prioridad) - PRIORIDADES.findIndex((p) => p.id === b.prioridad) ||
    limiteDe(a, categorias) - limiteDe(b, categorias)

// Bandeja del técnico (HU-4): sus tickets con contadores, pestañas, alerta de plazo y autoasignación.
// `estadoInicial` abre la bandeja ya filtrada (las opciones "En atención", "En espera" y "Resueltos hoy" del menú).
function BandejaTecnico({ estadoInicial = null }) {
    const { usuario } = useAuth()
    const { categorias } = useCatalogo()
    const tickets = useTickets()
    const { exito, error } = useToast()
    const ahora = useAhora()
    const [pestana, setPestana] = useState('todos')
    const [estado, setEstado] = useState(estadoInicial)

    const tecnico = tecnicoDeUsuario(usuario)

    if (!tecnico) {
        return (
            <div className="estado-vacio">
                <span className="estado-vacio__icono" aria-hidden="true" />
                <h1>Tu cuenta aún no está habilitada</h1>
                <p>El supervisor debe agregarte en “Técnicos por categoría” para que puedas recibir tickets.</p>
            </div>
        )
    }

    const nombreCategoria = (id) => (categorias.find((c) => c.id === id) ?? { nombre: id }).nombre
    const propios = tickets.filter((t) => t.tecnicoId === tecnico.id && estaEnBandeja(t))
    const disponibles = tickets
        .filter((t) => estaEnCurso(t) && !t.tecnicoId && tecnico.categorias.includes(t.categoriaId))
        .sort(porPrioridadYPlazo(categorias))
    const vencidos = propios.filter((t) => fueraDePlazo(t, categorias, ahora))

    const conteo = {
        todos: propios.length,
        criticos: propios.filter((t) => t.prioridad === 'critica').length,
        plazo: vencidos.length,
        hoy: propios.filter((t) => esDeHoy(t.registradoEn, ahora)).length,
    }

    const visibles = propios
        .filter((t) => {
            if (estado === 'resuelto' && !(t.estado === 'resuelto' && t.resueltoEn && esDeHoy(t.resueltoEn, ahora))) return false
            if (estado && estado !== 'resuelto' && t.estado !== estado) return false
            if (pestana === 'criticos') return t.prioridad === 'critica'
            if (pestana === 'plazo') return fueraDePlazo(t, categorias, ahora)
            if (pestana === 'hoy') return esDeHoy(t.registradoEn, ahora)
            return true
        })
        .sort(porPrioridadYPlazo(categorias))

    function tomar(codigo) {
        const resultado = autoasignarTicket(codigo, usuario)
        if (resultado.ok) exito(`Te asignaste el ticket ${codigo}.`)
        else error(resultado.mensaje)
    }

    function mensajeVencidos() {
        if (vencidos.length === 1) {
            const t = vencidos[0]
            return `1 ticket fuera del tiempo esperado: ${t.codigo} lleva ${formatearDuracion(-minutosRestantes(t, categorias, ahora))} de retraso. Atiéndelo o cámbialo a En espera con motivo.`
        }
        return `${vencidos.length} tickets fuera del tiempo esperado: ${vencidos.map((t) => t.codigo).join(', ')}. Atiéndelos o cámbialos a En espera con motivo.`
    }

    const categoriasPropias = tecnico.categorias.map(nombreCategoria).join(' y ')

    return (
        <div className="pagina-ancha">
            <div className="tickets__encabezado">
                <div>
                    <h1>{estadoInicial ? TITULOS[estadoInicial] : 'Mi bandeja'}</h1>
                    <p className="texto-aux">{tecnico.nombres} {tecnico.apellidos} · {categoriasPropias} · {propios.length} tickets asignados</p>
                </div>
                <div className="cola__resumen" role="group" aria-label="Resumen por estado">
                    {ESTADOS_RESUMEN.map((e) => (
                        <button key={e.id} type="button"
                            className={`cola__etiqueta cola__etiqueta--${e.id}${estado === e.id ? ' cola__etiqueta--activa' : ''}`}
                            onClick={() => setEstado(estado === e.id ? null : e.id)}>
                            {e.nombre} {propios.filter((t) => t.estado === e.id).length}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bandeja__pestanas" role="tablist" aria-label="Filtros de la bandeja">
                {PESTANAS.map((p) => (
                    <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id}
                        className={pestana === p.id ? 'bandeja__pestana bandeja__pestana--activa' : 'bandeja__pestana'}
                        onClick={() => setPestana(p.id)}>
                        {p.nombre} ({conteo[p.id]})
                    </button>
                ))}
                <span className="texto-aux bandeja__orden">Orden: prioridad y plazo</span>
            </div>

            {vencidos.length > 0 && <p className="alerta-error cola__aviso" role="alert">{mensajeVencidos()}</p>}

            {propios.length === 0 ? (
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>Sin tickets asignados</h2>
                    <p>Cuando el supervisor te asigne uno aparecerá aquí.</p>
                </div>
            ) : visibles.length === 0 ? (
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>No hay tickets con este filtro</h2>
                    <p>Prueba con otra pestaña o quita el filtro de estado.</p>
                    <button type="button" className="boton boton--primario" onClick={() => { setPestana('todos'); setEstado(null) }}>Ver todos</button>
                </div>
            ) : (
                <div className="tabla-container">
                    <div className="tabla-desplazable">
                        <table className="tabla-categorias tabla-cola tabla-bandeja">
                            <thead>
                                <tr>
                                    <th aria-label="Prioridad" />
                                    <th>CÓDIGO</th><th>ASUNTO</th><th>CATEGORÍA</th><th>AMBIENTE</th><th>SOLICITANTE</th>
                                    <th>PRIORIDAD</th><th>ESTADO</th><th>PLAZO</th><th>ACCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibles.map((t) => {
                                    const plazo = textoPlazo(t, categorias, ahora, formatearFecha)
                                    return (
                                        <tr key={t.codigo} className={`fila--${t.prioridad}`}>
                                            <td />
                                            <td><span className="codigo-ticket">{t.codigo}</span></td>
                                            <td>{t.asunto}</td>
                                            <td className="celda-suave">{nombreCategoria(t.categoriaId)}</td>
                                            <td className="codigo">{t.ambiente}</td>
                                            <td>{t.solicitante}</td>
                                            <td><Etiqueta tipo="prioridad" valor={t.prioridad} /></td>
                                            <td><Etiqueta tipo="estado" valor={t.estado} /></td>
                                            <td className={plazo.vencido ? 'bandeja__vencido' : 'celda-suave'}>{plazo.texto}</td>
                                            <td><Link to={`/tecnico/tickets/${t.codigo}`} className="codigo-ticket bandeja__enlace">Abrir bitácora</Link></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <section aria-labelledby="disponibles-titulo" className="bandeja__disponibles">
                <h2 id="disponibles-titulo">Disponibles para mí</h2>
                <p className="texto-aux">Tickets sin asignar de tus categorías. Puedes tomarlos tú mismo.</p>
                {disponibles.length === 0 ? (
                    <p className="texto-aux">No hay tickets sin asignar en tus categorías.</p>
                ) : (
                    <div className="tabla-container">
                        <div className="tabla-desplazable">
                            <table className="tabla-categorias tabla-cola">
                                <thead>
                                    <tr><th aria-label="Prioridad" /><th>CÓDIGO</th><th>ASUNTO</th><th>AMBIENTE</th><th>PRIORIDAD</th><th>PLAZO</th><th>ACCIÓN</th></tr>
                                </thead>
                                <tbody>
                                    {disponibles.map((t) => {
                                        const plazo = textoPlazo(t, categorias, ahora, formatearFecha)
                                        return (
                                            <tr key={t.codigo} className={`fila--${t.prioridad}`}>
                                                <td />
                                                <td><span className="codigo-ticket">{t.codigo}</span></td>
                                                <td>{t.asunto}</td>
                                                <td className="codigo">{t.ambiente}</td>
                                                <td><Etiqueta tipo="prioridad" valor={t.prioridad} /></td>
                                                <td className={plazo.vencido ? 'bandeja__vencido' : 'celda-suave'}>{plazo.texto}</td>
                                                <td>
                                                    <button type="button" className="boton boton--primario boton--chico" onClick={() => tomar(t.codigo)}>
                                                        Tomar ticket
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default BandejaTecnico
