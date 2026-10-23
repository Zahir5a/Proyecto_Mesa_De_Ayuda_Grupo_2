import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ModalReabrir from '../../components/tickets/ModalReabrir'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Etiqueta from '../../components/ui/Etiqueta'
import { PRIORIDADES } from '../../data/contenidoPublico'
import { MAX_DESCRIPCION } from '../../data/tickets'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import {
    admiteComentarios,
    agregarComentario,
    buscarTicket,
    cancelarTicket,
    encuestaPendiente,
    estaEnCurso,
    limiteReapertura,
    puedeCancelar,
    puedeReabrir,
    reabrirTicket,
} from '../../services/ticketsService'
import { formatearFecha, formatearFechaHora, formatearHora } from '../../utils/formato'
import { calcularLimite } from '../../utils/plazos'
import { horasEsperadas } from '../../utils/tiempos'
import '../../components/ui/estadoVacio.css'
import './tickets.css'

const ETIQUETA_ROL = { usuario: 'Usuario', tecnico: 'Técnico', supervisor: 'Supervisor' }
const PASOS = ['asignado', 'en_atencion', 'resuelto']
const ETIQUETA_EVENTO = {
    abierto: 'Abierto',
    asignado: 'Asignado',
    en_atencion: 'En atención',
    en_espera: 'En espera',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
    reabierto: 'Reabierto',
    cancelado: 'Cancelado',
}

function inicialesDe(nombre) {
    return nombre.split(' ').slice(0, 2).map((palabra) => palabra[0]).join('').toUpperCase()
}

function DetalleTicket() {
    const { codigo } = useParams()
    const { usuario } = useAuth()
    const { categorias } = useCatalogo()
    const tickets = useTickets()
    const { exito, error } = useToast()
    const campoComentario = useRef(null)

    const [comentario, setComentario] = useState('')
    const [errorComentario, setErrorComentario] = useState('')
    const [cancelando, setCancelando] = useState(false)
    const [reabriendo, setReabriendo] = useState(false)

    const ticket = buscarTicket(tickets, codigo)

    if (!ticket || ticket.usuarioId !== usuario.id) {
        return (
            <div className="estado-vacio">
                <span className="estado-vacio__icono" aria-hidden="true" />
                <h1>No encontramos este ticket</h1>
                <p>Revisa el código o busca en tu lista. Solo puedes ver los tickets que tú registraste.</p>
                <Link to="/usuario/tickets" className="boton boton--primario">Ir a mis tickets</Link>
            </div>
        )
    }

    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    const subcategoria = categoria ? categoria.subcategorias.find((s) => s.id === ticket.subcategoriaId) : undefined
    const limite = calcularLimite(ticket.registradoEn, horasEsperadas(ticket, categorias, PRIORIDADES))
    const mismoDia = new Date(limite).toDateString() === new Date(ticket.registradoEn).toDateString()
    const publicas = ticket.bitacora.filter((b) => b.tipo === 'publico')
    const encuesta = ticket.encuestaPendiente ? encuestaPendiente(tickets, usuario.id) : null
    const limiteReabrir = limiteReapertura(ticket)

    function enviarComentario(e) {
        e.preventDefault()
        if (comentario.trim().length < 5) {
            setErrorComentario('Escribe al menos 5 caracteres.')
            return
        }
        if (!agregarComentario(ticket.codigo, usuario, comentario)) {
            error('No pudimos enviar tu comentario. Inténtalo otra vez.')
            return
        }
        setComentario('')
        setErrorComentario('')
        exito('Enviamos tu comentario al equipo técnico.')
    }

    function cancelar() {
        const resultado = cancelarTicket(ticket.codigo, usuario)
        setCancelando(false)
        if (resultado.ok) exito(`Cancelaste el ticket ${ticket.codigo}.`)
        else error('No se pudo cancelar: el ticket ya fue asignado.')
    }

    function reabrir(motivo) {
        const resultado = reabrirTicket(ticket.codigo, usuario, motivo)
        setReabriendo(false)
        if (resultado.ok) exito(`Reabriste el ticket ${ticket.codigo}.`)
        else if (resultado.motivo === 'fuera_de_plazo') error('Ya pasó el plazo para reabrir este ticket.')
        else error('No pudimos reabrir el ticket. Inténtalo otra vez.')
    }

    // Línea de tiempo: lo que ya pasó, y lo que falta mientras el ticket siga en curso
    const eventos = [...ticket.historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    const pendientes = estaEnCurso(ticket) ? PASOS.filter((p) => !eventos.some((e) => e.tipo === p)) : []

    return (
        <div>
            <div className="detalle__cabecera">
                <div>
                    <p className="detalle__ruta">
                        <Link to="/usuario/tickets">Mis tickets</Link> · <span className="codigo">{ticket.codigo}</span>
                    </p>
                    <div className="detalle__titulo">
                        <h1 className="codigo-ticket-grande">{ticket.codigo}</h1>
                        <Etiqueta tipo="prioridad" valor={ticket.prioridad} />
                        <Etiqueta tipo="estado" valor={ticket.estado} />
                    </div>
                </div>
                <div className="detalle__acciones">
                    {puedeCancelar(ticket) && (
                        <button type="button" className="boton boton--destructivo-borde" onClick={() => setCancelando(true)}>
                            Cancelar ticket
                        </button>
                    )}
                    {admiteComentarios(ticket) && (
                        <button type="button" className="boton" onClick={() => campoComentario.current.focus()}>
                            Agregar información
                        </button>
                    )}
                </div>
            </div>

            <h2 className="detalle__asunto">{ticket.asunto}</h2>

            {ticket.estado === 'cerrado' && (
                <div className="detalle__avisos">
                    <p className="alerta-exito">
                        Resuelto el {formatearFecha(ticket.cerradoEn)}
                        {ticket.tecnico && <> por {ticket.tecnico}</>}.
                        {ticket.solucion && <> Solución: {ticket.solucion}</>}
                    </p>
                    {encuesta && (
                        <p className="alerta-aviso">
                            Tienes una encuesta pendiente para este ticket. Puedes responderla hasta el {formatearFecha(encuesta.limite)}.
                        </p>
                    )}
                    <div className="formulario__acciones">
                        {encuesta && <Link to="/usuario/encuesta-pendiente" className="boton boton--primario">Responder encuesta</Link>}
                        {puedeReabrir(ticket) ? (
                            <button type="button" className="boton boton--destructivo-borde" onClick={() => setReabriendo(true)}>
                                Reabrir ticket
                            </button>
                        ) : (
                            <span className="texto-aux">El plazo para reabrir venció el {formatearFecha(limiteReabrir)}.</span>
                        )}
                    </div>
                </div>
            )}

            {ticket.estado === 'cancelado' && <p className="alerta-info detalle__avisos">Cancelaste este ticket antes de que lo asignaran.</p>}

            <div className="detalle__rejilla">
                <section className="tarjeta">
                    <h2>Bitácora de la atención</h2>
                    <ul className="bitacora">
                        {publicas.map((b) => (
                            <li key={b.id} className="bitacora__entrada">
                                <p className="bitacora__autor">
                                    <span className={`avatar avatar--pequeno avatar--${b.rol}`} aria-hidden="true">{inicialesDe(b.autor)}</span>
                                    <strong>{b.autor}</strong>
                                    <span className="texto-aux">{ETIQUETA_ROL[b.rol]} · {formatearFechaHora(b.fecha)}</span>
                                </p>
                                <p>{b.texto}</p>
                            </li>
                        ))}
                    </ul>

                    {admiteComentarios(ticket) ? (
                        <form className="detalle__comentario" onSubmit={enviarComentario} noValidate>
                            <div className={errorComentario ? 'campo campo--error' : 'campo'}>
                                <label htmlFor="comentario" className="campo__etiqueta">Agregar información</label>
                                <textarea id="comentario" ref={campoComentario} className="campo__control tickets__area tickets__area--corta"
                                    value={comentario} maxLength={MAX_DESCRIPCION}
                                    placeholder="Escribe aquí si tienes un dato nuevo que ayude al técnico…"
                                    onChange={(e) => { setComentario(e.target.value); setErrorComentario('') }} />
                                {errorComentario && <p className="campo__mensaje campo__mensaje--error">{errorComentario}</p>}
                            </div>
                            <div className="detalle__envio">
                                <button type="submit" className="boton boton--primario">Enviar comentario</button>
                                <span className="texto-aux">Las notas internas del equipo técnico no se muestran aquí.</span>
                            </div>
                        </form>
                    ) : (
                        <p className="texto-aux detalle__comentario">Este ticket ya no admite comentarios nuevos.</p>
                    )}
                </section>

                <aside className="detalle__lateral">
                    <section className="tarjeta">
                        <h2>Datos del reporte</h2>
                        <dl className="datos">
                            <div><dt>Categoría</dt><dd>{categoria ? categoria.nombre : ticket.categoriaId}</dd></div>
                            <div><dt>Subcategoría</dt><dd>{subcategoria ? subcategoria.nombre : '—'}</dd></div>
                            <div><dt>Ambiente</dt><dd className="codigo">{ticket.ambiente}</dd></div>
                            <div><dt>Registrado</dt><dd>{formatearFechaHora(ticket.registradoEn)}</dd></div>
                            <div><dt>Técnico asignado</dt><dd>{ticket.tecnico ?? 'Sin asignar'}</dd></div>
                            <div>
                                <dt>Atención esperada</dt>
                                <dd>Antes de {formatearHora(limite)}{!mismoDia && ` del ${formatearFecha(limite)}`}</dd>
                            </div>
                            {ticket.evidencia && <div><dt>Evidencia</dt><dd>{ticket.evidencia}</dd></div>}
                        </dl>
                    </section>

                    <section className="tarjeta">
                        <h2>Línea de tiempo</h2>
                        <ol className="linea">
                            {eventos.map((e, i) => (
                                <li key={i} className={`linea__paso linea__paso--${e.tipo === 'en_atencion' || e.tipo === 'en_espera' ? 'activo' : 'hecho'}`}>
                                    <strong>{ETIQUETA_EVENTO[e.tipo]}</strong>
                                    <span className="texto-aux">
                                        {formatearFechaHora(e.fecha)} · {e.tipo === 'abierto' ? 'registrado por ti' : e.autor}
                                    </span>
                                </li>
                            ))}
                            {pendientes.map((p) => (
                                <li key={p} className="linea__paso">
                                    <strong>{ETIQUETA_EVENTO[p]}</strong>
                                    <span className="texto-aux">Pendiente</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </aside>
            </div>

            <ConfirmDialog
                abierto={cancelando}
                titulo={`¿Cancelar el ticket ${ticket.codigo}?`}
                textoConfirmar="Sí, cancelar ticket"
                destructivo
                onConfirmar={cancelar}
                onCancelar={() => setCancelando(false)}
            >
                Nadie lo ha asignado todavía. Si lo cancelas, el equipo técnico ya no lo atenderá.
            </ConfirmDialog>

            {limiteReabrir && (
                <ModalReabrir abierto={reabriendo} ticket={ticket} limite={limiteReabrir}
                    onConfirmar={reabrir} onCancelar={() => setReabriendo(false)} />
            )}
        </div>
    )
}

export default DetalleTicket
