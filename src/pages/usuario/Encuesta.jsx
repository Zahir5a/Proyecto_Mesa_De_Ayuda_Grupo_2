import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useEncuestas } from '../../hooks/useEncuestas'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { buscarTecnico } from '../../services/catalogoService'
import {
    ASPECTOS,
    ETIQUETA_PUNTAJE,
    buscarEncuesta,
    dentroDelPlazo,
    guardarEncuesta,
    limiteEncuesta,
} from '../../services/encuestasService'
import { buscarTicket } from '../../services/ticketsService'
import { formatearFecha } from '../../utils/formato'
import { formatearTiempo, horasDeAtencion } from '../../utils/etapas'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import './encuestas.css'

const PUNTAJES = [1, 2, 3, 4, 5]

// Fila de botones del 1 al 5; el elegido queda marcado.
function Puntaje({ valor, onElegir, nombre, grande = false }) {
    return (
        <div className={grande ? 'puntaje puntaje--grande' : 'puntaje'} role="radiogroup" aria-label={nombre}>
            {PUNTAJES.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={valor === n}
                    className={valor === n ? 'puntaje__boton puntaje__boton--elegido' : 'puntaje__boton'}
                    onClick={() => onElegir(n)}>
                    {n}
                </button>
            ))}
        </div>
    )
}

function FormularioEncuesta({ ticket, encuesta }) {
    const { usuario } = useAuth()
    const { categorias, ambientes } = useCatalogo()
    const { exito, error } = useToast()
    const navigate = useNavigate()

    const [valores, setValores] = useState({
        general: encuesta ? encuesta.general : null,
        rapidez: encuesta ? encuesta.rapidez : null,
        trato: encuesta ? encuesta.trato : null,
        solucion: encuesta ? encuesta.solucion : null,
        comentario: encuesta ? encuesta.comentario : '',
    })
    const [intentado, setIntentado] = useState(false)

    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    const ambiente = ambientes.find((a) => a.codigo === ticket.ambiente)
    const tecnico = ticket.tecnicoId ? buscarTecnico(ticket.tecnicoId) : null
    const faltan = ['general', ...ASPECTOS.map((a) => a.id)].filter((id) => valores[id] === null)
    const tiempo = ticket.tiempoTotalAtencion ?? horasDeAtencion(ticket)

    function cambiar(campo, valor) {
        setValores({ ...valores, [campo]: valor })
    }

    function enviar(e) {
        e.preventDefault()
        setIntentado(true)
        if (faltan.length > 0) return

        const resultado = guardarEncuesta(ticket.codigo, valores, usuario)
        if (!resultado.ok) {
            error(resultado.mensaje)
            return
        }
        exito(resultado.editada ? `Actualizamos tu encuesta del ticket ${ticket.codigo}.` : `Gracias, registramos tu encuesta del ticket ${ticket.codigo}.`)
        navigate('/usuario/encuestas')
    }

    return (
        <div>
            <h1>¿Cómo fue la atención de tu ticket?</h1>
            <p className="texto-aux tickets__subtitulo">
                Tu respuesta ayuda al área de Infraestructura a mejorar los tiempos y el trato. Toma menos de un minuto.
            </p>

            <div className="tickets__rejilla">
                <form className="tarjeta tickets__formulario" onSubmit={enviar} noValidate>
                    <div className="campo">
                        <span className="campo__etiqueta">Puntaje general</span>
                        <div className="encuesta__general">
                            <Puntaje grande nombre="Puntaje general" valor={valores.general} onElegir={(n) => cambiar('general', n)} />
                            {valores.general && <span className="encuesta__etiqueta">{valores.general} · {ETIQUETA_PUNTAJE[valores.general]}</span>}
                        </div>
                        {intentado && valores.general === null && <p className="campo__mensaje campo__mensaje--error">Elige el puntaje general.</p>}
                    </div>

                    <div className="campo">
                        <span className="campo__etiqueta">Calificación por aspectos</span>
                        <div className="encuesta__aspectos">
                            {ASPECTOS.map((a) => (
                                <div key={a.id} className="encuesta__aspecto">
                                    <span>{a.nombre}</span>
                                    <Puntaje nombre={a.nombre} valor={valores[a.id]} onElegir={(n) => cambiar(a.id, n)} />
                                    {intentado && valores[a.id] === null && <span className="campo__mensaje campo__mensaje--error">Elige un puntaje.</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="campo">
                        <label htmlFor="comentario-encuesta" className="campo__etiqueta">Comentario (opcional)</label>
                        <textarea id="comentario-encuesta" className="campo__control tickets__area" maxLength={500} value={valores.comentario}
                            placeholder="Cuéntanos qué salió bien y qué se puede mejorar."
                            onChange={(e) => cambiar('comentario', e.target.value)} />
                        <p className="campo__mensaje">Tu comentario lo lee el supervisor del área; el técnico lo ve sin tu nombre.</p>
                    </div>

                    <div className="formulario__acciones">
                        <button type="submit" className="boton boton--primario">{encuesta ? 'Guardar cambios' : 'Enviar encuesta'}</button>
                        <Link to="/usuario/encuestas" className="boton boton--terciario">Responder después</Link>
                    </div>
                </form>

                <aside className="tickets__lateral">
                    <div className="tarjeta">
                        <h2>Ticket evaluado</h2>
                        <p className="codigo-ticket-grande encuesta__codigo">{ticket.codigo}</p>
                        <p>{ticket.asunto}</p>
                        <dl className="datos">
                            <div><dt>Categoría</dt><dd>{categoria ? categoria.nombre : ticket.categoriaId}</dd></div>
                            <div><dt>Ambiente</dt><dd className="codigo">{ ambiente ? ambiente.codigo : ticket.ambiente}</dd></div>
                            <div><dt>Técnico</dt><dd>{tecnico ? `${tecnico.nombres} ${tecnico.apellidos}` : '—'}</dd></div>
                            <div><dt>Cerrado</dt><dd>{formatearFecha(ticket.cerradoEn)}</dd></div>
                            <div><dt>Tiempo de atención</dt><dd>{formatearTiempo(tiempo * 60)}</dd></div>
                        </dl>
                    </div>
                    <p className="alerta-info">Puedes editar tu respuesta hasta el {formatearFecha(limiteEncuesta(ticket))}.</p>
                </aside>
            </div>
        </div>
    )
}

// Responder o editar la encuesta de un ticket cerrado (HU-6): una sola respuesta por ticket.
function Encuesta() {
    const { codigo } = useParams()
    const { usuario } = useAuth()
    const tickets = useTickets()
    const encuestas = useEncuestas()

    const ticket = buscarTicket(tickets, codigo)
    const encuesta = buscarEncuesta(encuestas, codigo)
    const propio = ticket && ticket.usuarioId === usuario.id

    if (!propio || (ticket.estado !== 'cerrado' && !encuesta)) {
        return (
            <div className="estado-vacio">
                <span className="estado-vacio__icono" aria-hidden="true" />
                <h1>No hay una encuesta para este ticket</h1>
                <p>La encuesta se habilita cuando uno de tus tickets se cierra.</p>
                <Link to="/usuario/encuestas" className="boton boton--primario">Ver mis encuestas</Link>
            </div>
        )
    }

    if (!dentroDelPlazo(ticket)) {
        return (
            <div className="estado-vacio">
                <span className="estado-vacio__icono" aria-hidden="true" />
                <h1>El plazo de esta encuesta venció</h1>
                <p>
                    {encuesta ? 'Tu respuesta quedó registrada y ya no se puede editar.' : 'Solo se puede responder hasta 7 días después del cierre.'}
                </p>
                <Link to="/usuario/encuestas" className="boton boton--primario">Ver mis encuestas</Link>
            </div>
        )
    }

    return <FormularioEncuesta key={codigo} ticket={ticket} encuesta={encuesta} />
}

export default Encuesta
