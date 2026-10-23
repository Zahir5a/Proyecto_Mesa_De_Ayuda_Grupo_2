import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ModalCierre from '../../components/atencion/ModalCierre'
import ModalEstado from '../../components/atencion/ModalEstado'
import Etiqueta from '../../components/ui/Etiqueta'
import { MAX_TEXTO, TRANSICIONES } from '../../data/tickets'
import { useAhora } from '../../hooks/useAhora'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { buscarTecnico } from '../../services/catalogoService'
import {
    agregarEntradaBitacora,
    buscarTicket,
    estaEnCurso,
    puedeAtender,
    puedeVerAtencion,
} from '../../services/ticketsService'
import { buscarPorId } from '../../services/usuariosService'
import { formatearFecha, formatearFechaHora, formatearHora } from '../../utils/formato'
import { formatearTiempo, horasDeAtencion, lineaDeTiempo } from '../../utils/etapas'
import { textoPlazo } from '../../utils/tiempos'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import './atencion.css'

const ETIQUETA_ROL = { usuario: 'Usuario', tecnico: 'Técnico', supervisor: 'Supervisor' }
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

function inicialesDe(nombre) {
    return nombre.split(' ').slice(0, 2).map((palabra) => palabra[0]).join('').toUpperCase()
}

// Atención de un ticket (HU-5). El técnico asignado registra la bitácora, cambia el estado y cierra;
// el supervisor ve la misma pantalla como vista consolidada, sin poder modificar nada.
function DetalleAtencion() {
    const { codigo } = useParams()
    const { usuario } = useAuth()
    const { categorias, ambientes } = useCatalogo()
    const tickets = useTickets()
    const { exito, error } = useToast()
    const ahora = useAhora()

    const [filtro, setFiltro] = useState('todas')
    const [tipo, setTipo] = useState('publico')
    const [texto, setTexto] = useState('')
    const [errorTexto, setErrorTexto] = useState('')
    const [ventana, setVentana] = useState(null) // 'estado' | 'cierre'

    const esSupervisor = usuario.rol === 'supervisor'
    const base = esSupervisor ? '/supervisor/cola' : '/tecnico/tickets'
    const ticket = buscarTicket(tickets, codigo)

    if (!ticket || !puedeVerAtencion(ticket, usuario)) {
        return (
            <div className="estado-vacio">
                <span className="estado-vacio__icono" aria-hidden="true" />
                <h1>{ticket ? 'No tienes acceso a este ticket' : 'No encontramos este ticket'}</h1>
                <p>{ticket ? 'Solo el técnico asignado y el supervisor pueden abrir la atención.' : 'Revisa el código e inténtalo otra vez.'}</p>
                <Link to={esSupervisor ? '/supervisor/cola' : '/tecnico'} className="boton boton--primario">
                    {esSupervisor ? 'Ir a la cola' : 'Ir a mi bandeja'}
                </Link>
            </div>
        )
    }

    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    const subcategoria = categoria ? categoria.subcategorias.find((s) => s.id === ticket.subcategoriaId) : undefined
    const ambiente = ambientes.find((a) => a.codigo === ticket.ambiente)
    const tecnico = ticket.tecnicoId ? buscarTecnico(ticket.tecnicoId) : null
    const solicitante = ticket.usuarioId ? buscarPorId(ticket.usuarioId) : null
    const puedeEditar = puedeAtender(ticket, usuario)
    const hayTransiciones = (TRANSICIONES[ticket.estado] ?? []).length > 0
    const sePuedeCerrar = ['en_atencion', 'resuelto'].includes(ticket.estado)

    const entradas = ticket.bitacora.filter((b) => {
        if (filtro === 'publicas') return b.tipo === 'publico'
        if (filtro === 'internas') return b.tipo === 'interno'
        return true
    })

    const abiertosAqui = tickets.filter((t) => estaEnCurso(t) && t.ambiente === ticket.ambiente).length
    const ultimoCierre = tickets
        .filter((t) => t.ambiente === ticket.ambiente && t.cerradoEn)
        .map((t) => t.cerradoEn)
        .sort()
        .at(-1)

    const eventos = lineaDeTiempo(ticket, ahora)
    const resumenHistorial = eventos
        .filter((e) => ['abierto', 'asignado', 'en_atencion', 'en_espera', 'resuelto', 'cerrado'].includes(e.tipo))
        .map((e) => `${ETIQUETA_EVENTO[e.tipo]} ${formatearHora(e.fecha)}`)
        .join(' → ')
    const plazo = textoPlazo(ticket, categorias, ahora, formatearFecha)

    function guardarEntrada(e) {
        e.preventDefault()
        const resultado = agregarEntradaBitacora(ticket.codigo, usuario, texto, tipo)
        if (!resultado.ok) {
            setErrorTexto(resultado.mensaje)
            if (!resultado.campo) error(resultado.mensaje)
            return
        }
        setTexto('')
        setErrorTexto('')
        exito(tipo === 'interno' ? 'Guardamos la nota interna.' : 'Publicamos el comentario para el solicitante.')
    }

    return (
        <div>
            <p className="detalle__ruta">
                <Link to={esSupervisor ? '/supervisor/cola' : '/tecnico'}>{esSupervisor ? 'Cola de atención' : 'Mi bandeja'}</Link>
                {' · '}<span className="codigo">{ticket.codigo}</span>
            </p>

            <div className="detalle__cabecera">
                <div>
                    <div className="detalle__titulo">
                        <h1 className="codigo-ticket-grande">{ticket.codigo}</h1>
                        <Etiqueta tipo="prioridad" valor={ticket.prioridad} />
                        <Etiqueta tipo="estado" valor={ticket.estado} />
                        {estaEnCurso(ticket) && <span className={plazo.vencido ? 'bandeja__vencido' : 'celda-suave'}>{plazo.texto}</span>}
                    </div>
                    <h2 className="detalle__asunto">
                        {ticket.asunto}{categoria && <> · {categoria.nombre}</>}
                    </h2>
                </div>
                <div className="detalle__acciones">
                    {puedeEditar && hayTransiciones && (
                        <button type="button" className="boton boton--primario" onClick={() => setVentana('estado')}>Cambiar estado</button>
                    )}
                    {puedeEditar && sePuedeCerrar && (
                        <button type="button" className={ticket.estado === 'resuelto' ? 'boton boton--primario' : 'boton'} onClick={() => setVentana('cierre')}>
                            Cerrar ticket
                        </button>
                    )}
                    <Link to={`${base}/${ticket.codigo}/historial`} className="boton boton--terciario">Historial</Link>
                </div>
            </div>

            {ticket.estado === 'en_espera' && (
                <p className="alerta-aviso detalle__avisos">
                    <strong>Atención en pausa: </strong>{ticket.motivoEspera}.{' '}
                    {ticket.retornoEstimado && <>Retorno estimado: {formatearFechaHora(ticket.retornoEstimado)}.</>}
                </p>
            )}
            {ticket.estado === 'cancelado' && <p className="alerta-info detalle__avisos">El solicitante canceló este ticket antes de que lo asignaran.</p>}
            {!ticket.tecnicoId && estaEnCurso(ticket) && <p className="alerta-info detalle__avisos">Este ticket todavía no tiene técnico asignado.</p>}
            {esSupervisor && <p className="texto-aux detalle__avisos">Vista consolidada del supervisor: solo lectura.</p>}

            <div className="detalle__rejilla">
                <section className="tarjeta">
                    <div className="atencion__encabezado">
                        <h2>Bitácora · {entradas.length} {entradas.length === 1 ? 'entrada' : 'entradas'}</h2>
                        <label className="atencion__filtro">
                            Mostrar:
                            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar la bitácora">
                                <option value="todas">todas</option>
                                <option value="publicas">comentarios públicos</option>
                                <option value="internas">notas internas</option>
                            </select>
                        </label>
                    </div>

                    {entradas.length === 0 ? (
                        <p className="texto-aux">No hay entradas para mostrar con este filtro.</p>
                    ) : (
                        <ul className="bitacora">
                            {entradas.map((b) => (
                                <li key={b.id} className={b.tipo === 'interno' ? 'bitacora__entrada bitacora__entrada--interna' : 'bitacora__entrada'}>
                                    <p className="bitacora__autor">
                                        <span className={`avatar avatar--pequeno avatar--${b.rol}`} aria-hidden="true">{inicialesDe(b.autor)}</span>
                                        <strong>{b.autor}</strong>
                                        <span className="texto-aux">{ETIQUETA_ROL[b.rol]} · {formatearFechaHora(b.fecha)}</span>
                                        <span className={b.tipo === 'interno' ? 'bitacora__tipo bitacora__tipo--interno' : 'bitacora__tipo'}>
                                            {b.tipo === 'interno' ? 'Nota interna · no visible para el usuario' : 'Comentario público'}
                                        </span>
                                    </p>
                                    <p>{b.texto}</p>
                                </li>
                            ))}
                        </ul>
                    )}

                    {puedeEditar && (
                        <form className={tipo === 'interno' ? 'atencion__redactar atencion__redactar--interna' : 'atencion__redactar'}
                            onSubmit={guardarEntrada} noValidate>
                            <div className="atencion__tipos" role="group" aria-label="Tipo de entrada">
                                <button type="button" aria-pressed={tipo === 'publico'} className="atencion__tipo" onClick={() => setTipo('publico')}>
                                    Comentario público
                                </button>
                                <button type="button" aria-pressed={tipo === 'interno'} className="atencion__tipo atencion__tipo--interno" onClick={() => setTipo('interno')}>
                                    Nota interna
                                </button>
                                <span className="atencion__ayuda">
                                    {tipo === 'interno'
                                        ? 'Estás escribiendo una nota interna: solo la ve el equipo técnico y el supervisor.'
                                        : 'Este comentario también lo verá el solicitante.'}
                                </span>
                            </div>
                            <div className={errorTexto ? 'campo campo--error' : 'campo'}>
                                <label htmlFor="entrada" className="visualmente-oculto">Avance o comentario</label>
                                <textarea id="entrada" className="campo__control tickets__area" value={texto} maxLength={MAX_TEXTO}
                                    placeholder="Cuenta qué hiciste, qué encontraste o qué sigue…"
                                    onChange={(e) => { setTexto(e.target.value); setErrorTexto('') }} />
                                {errorTexto && <p className="campo__mensaje campo__mensaje--error">{errorTexto}</p>}
                            </div>
                            <button type="submit" className={tipo === 'interno' ? 'boton boton--aviso' : 'boton boton--primario'}>
                                {tipo === 'interno' ? 'Guardar nota interna' : 'Guardar comentario'}
                            </button>
                        </form>
                    )}
                    {!puedeEditar && ticket.estado === 'cerrado' && (
                        <p className="texto-aux detalle__comentario">Este ticket está cerrado: la bitácora ya no admite entradas.</p>
                    )}
                </section>

                <aside className="detalle__lateral">
                    <section className="tarjeta">
                        <h2>Datos del reporte</h2>
                        <dl className="datos">
                            <div><dt>Solicitante</dt><dd>{ticket.solicitante}</dd></div>
                            <div><dt>Teléfono</dt><dd>{solicitante && solicitante.telefono ? solicitante.telefono : '—'}</dd></div>
                            <div><dt>Subcategoría</dt><dd>{subcategoria ? subcategoria.nombre : '—'}</dd></div>
                            <div><dt>Técnico</dt><dd>{tecnico ? `${tecnico.nombres} ${tecnico.apellidos}` : 'Sin asignar'}</dd></div>
                            <div><dt>Registrado</dt><dd>{formatearFechaHora(ticket.registradoEn)}</dd></div>
                        </dl>
                        <blockquote className="atencion__cita">«{ticket.descripcion}»</blockquote>
                    </section>

                    <section className="tarjeta">
                        <h2>Ambiente</h2>
                        <p className="atencion__ambiente">{ticket.ambiente}</p>
                        {ambiente && (
                            <p className="texto-aux">
                                {ambiente.tipo} · Pabellón {ambiente.pabellon} · piso {ambiente.piso} · capacidad {ambiente.capacidad} · {ambiente.sede}
                            </p>
                        )}
                        <p className="atencion__aparte">
                            {abiertosAqui} {abiertosAqui === 1 ? 'ticket abierto' : 'tickets abiertos'} en este ambiente
                            {ultimoCierre && <> · último cierre {formatearFecha(ultimoCierre)}</>}
                        </p>
                    </section>

                    <section className="tarjeta">
                        <h2>Historial reciente</h2>
                        <p className="texto-aux">
                            {resumenHistorial} · {formatearTiempo((ahora - new Date(ticket.registradoEn)) / 60000)} transcurridos
                        </p>
                    </section>

                    {ticket.estado === 'cerrado' && (
                        <section className="tarjeta">
                            <h2>Desenlace</h2>
                            <p>{ticket.solucion}</p>
                            <p className="texto-aux">
                                Cerrado el {formatearFechaHora(ticket.cerradoEn)}
                                {ticket.tiempoTotalAtencion !== undefined && <> · tiempo de atención {formatearTiempo(ticket.tiempoTotalAtencion * 60)}</>}
                                {ticket.tiempoTotalAtencion === undefined && <> · tiempo de atención {formatearTiempo(horasDeAtencion(ticket, ahora) * 60)}</>}
                            </p>
                        </section>
                    )}
                </aside>
            </div>

            {ventana === 'estado' && <ModalEstado ticket={ticket} onCerrar={() => setVentana(null)} onListo={() => setVentana(null)} />}
            {ventana === 'cierre' && (
                <ModalCierre ticket={ticket} categorias={categorias} onCerrar={() => setVentana(null)} onListo={() => setVentana(null)} />
            )}
        </div>
    )
}

export default DetalleAtencion
