import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Etiqueta from '../../components/ui/Etiqueta'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EtiquetaCuenta from '../../components/usuarios/EtiquetaCuenta'
import ModalBloqueo from '../../components/usuarios/ModalBloqueo'
import Avatar from '../../components/ui/Avatar'
import { ESTADOS } from '../../data/tickets'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useEncuestas } from '../../hooks/useEncuestas'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { buscarEncuesta, encuestasDeUsuario, promedio } from '../../services/encuestasService'
import { estaEnCurso, ticketsDeUsuario } from '../../services/ticketsService'
import { buscarPorId, desbloquearUsuario } from '../../services/usuariosService'
import { unidadOEspecialidad } from '../../utils/cuentas'
import { formatearFecha, formatearFechaHora } from '../../utils/formato'
import '../../components/categorias/TablaCategoria.css'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import './usuarios.css'

// Ficha de una cuenta (HU-7): sus datos, un resumen de reportes y el historial de tickets que reportó.
function FichaUsuario() {
    const { id } = useParams()
    const { usuario: yo } = useAuth()
    const { categorias } = useCatalogo()
    const tickets = useTickets()
    const encuestas = useEncuestas()
    const { exito } = useToast()

    const [version, setVersion] = useState(0)
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [bloqueando, setBloqueando] = useState(false)
    const [desbloqueando, setDesbloqueando] = useState(false)

    const persona = buscarPorId(id)

    if (persona === null) {
        return (
            <div className="estado-vacio">
                <span className="estado-vacio__icono" aria-hidden="true" />
                <h1>No encontramos esta cuenta</h1>
                <p>Puede que se haya eliminado o que el enlace esté mal escrito.</p>
                <Link to="/supervisor/usuarios" className="boton boton--primario">Volver a usuarios</Link>
            </div>
        )
    }

    const nombre = `${persona.nombres} ${persona.apellidos}`
    const nombreCategoria = (cid) => (categorias.find((c) => c.id === cid) ?? { nombre: cid }).nombre
    const reportes = ticketsDeUsuario(tickets, persona.id).sort((a, b) => new Date(b.registradoEn) - new Date(a.registradoEn))
    const visibles = reportes.filter((t) => filtroEstado === 'todos' || (filtroEstado === 'en_curso' ? estaEnCurso(t) : t.estado === filtroEstado))
    const respondidas = encuestasDeUsuario(encuestas, persona.id)
    const cerrados = reportes.filter((t) => t.estado === 'cerrado').length
    const propia = persona.id === yo.id

    function subcategoria(t) {
        const categoria = categorias.find((c) => c.id === t.categoriaId)
        const sub = categoria ? categoria.subcategorias.find((s) => s.id === t.subcategoriaId) : undefined
        return categoria ? `${categoria.nombre}${sub ? ' · ' + sub.nombre : ''}` : t.categoriaId
    }

    function desbloquear() {
        desbloquearUsuario(persona.id)
        exito(`Cuenta desbloqueada. ${nombre} ya puede iniciar sesión.`)
        setDesbloqueando(false)
        setVersion(version + 1)
    }

    return (
        <div>
            <p className="detalle__ruta"><Link to="/supervisor/usuarios">Usuarios</Link> · {nombre}</p>

            <div className="ficha__cabecera">
                <Avatar usuario={persona} grande />
                <div>
                    <div className="detalle__titulo">
                        <h1>{nombre}</h1>
                        <EtiquetaCuenta tipo="rol" valor={persona.rol} />
                        <EtiquetaCuenta tipo="estado" valor={persona.estado} />
                    </div>
                    <p className="texto-aux">{persona.correo} · {unidadOEspecialidad(persona, nombreCategoria)}</p>
                </div>
                <div className="ficha__accion">
                    {persona.estado === 'bloqueado' ? (
                        <button type="button" className="boton boton--primario" onClick={() => setDesbloqueando(true)}>Desbloquear cuenta</button>
                    ) : (
                        <button type="button" className="boton boton--destructivo-borde" disabled={propia}
                            title={propia ? 'No puedes bloquear tu propia cuenta' : undefined} onClick={() => setBloqueando(true)}>
                            Bloquear cuenta
                        </button>
                    )}
                </div>
            </div>

            {persona.estado === 'bloqueado' && (
                <p className="alerta-error usuarios__aviso">
                    <strong>Cuenta bloqueada</strong>
                    {persona.bloqueadoEn && <> el {formatearFecha(persona.bloqueadoEn)}{persona.bloqueadoPor && <> por {persona.bloqueadoPor}</>}</>}.{' '}
                    {persona.motivoBloqueo && <>Motivo: {persona.motivoBloqueo}</>}
                </p>
            )}

            <div className="ficha__rejilla">
                <div className="ficha__lateral">
                    <section className="tarjeta">
                        <h2>Datos de la cuenta</h2>
                        <dl className="datos">
                            <div><dt>Teléfono</dt><dd>{persona.telefono || '—'}</dd></div>
                            <div><dt>Ambiente habitual</dt><dd className="codigo">{persona.ambienteHabitual || '—'}</dd></div>
                            <div><dt>Cuenta creada</dt><dd>{formatearFecha(persona.creadoEn)}</dd></div>
                            <div><dt>Último acceso</dt><dd>{persona.ultimoAcceso ? formatearFechaHora(persona.ultimoAcceso) : '—'}</dd></div>
                        </dl>
                    </section>
                    <section className="tarjeta">
                        <h2>Resumen de reportes</h2>
                        <div className="ficha__cifras">
                            <div><span className="campo__etiqueta">Reportados</span><p>{reportes.length}</p></div>
                            <div><span className="campo__etiqueta">Abiertos</span><p>{reportes.filter(estaEnCurso).length}</p></div>
                            <div><span className="campo__etiqueta">Cerrados</span><p>{cerrados}</p></div>
                            <div>
                                <span className="campo__etiqueta">Satisfacción promedio</span>
                                <p className="encuestas__puntaje">{respondidas.length > 0 ? promedio(respondidas.map((e) => e.general)).toFixed(1) : '—'}</p>
                            </div>
                        </div>
                        <p className="texto-aux">Promedio de las encuestas que respondió sobre sus tickets cerrados.</p>
                    </section>
                </div>

                <section className="tarjeta ficha__historial">
                    <div className="atencion__encabezado">
                        <h2>Historial de reportes</h2>
                        <label className="atencion__filtro">
                            Estado:
                            <select aria-label="Filtrar el historial por estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                                <option value="todos">todos</option>
                                <option value="en_curso">en curso</option>
                                {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.nombre.toLowerCase()}</option>)}
                            </select>
                        </label>
                    </div>
                    {visibles.length === 0 ? (
                        <p className="texto-aux">{reportes.length === 0 ? 'Esta cuenta todavía no reportó tickets.' : 'Ningún ticket coincide con el filtro.'}</p>
                    ) : (
                        <div className="tabla-desplazable">
                            <table className="tabla-categorias">
                                <thead>
                                    <tr><th>CÓDIGO</th><th>ASUNTO</th><th>CATEGORÍA</th><th>AMBIENTE</th><th>PRIORIDAD</th><th>ESTADO</th><th>ENCUESTA</th></tr>
                                </thead>
                                <tbody>
                                    {visibles.map((t) => {
                                        const encuesta = buscarEncuesta(encuestas, t.codigo)
                                        return (
                                            <tr key={t.codigo}>
                                                <td><span className="codigo-ticket">{t.codigo}</span></td>
                                                <td>{t.asunto}</td>
                                                <td className="celda-suave">{subcategoria(t)}</td>
                                                <td className="codigo">{t.ambiente}</td>
                                                <td><Etiqueta tipo="prioridad" valor={t.prioridad} /></td>
                                                <td><Etiqueta tipo="estado" valor={t.estado} /></td>
                                                <td>{encuesta ? `${encuesta.general} / 5` : '—'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {bloqueando && (
                <ModalBloqueo persona={persona} tickets={tickets} onCerrar={() => setBloqueando(false)}
                    onListo={() => { setBloqueando(false); setVersion(version + 1) }} />
            )}
            <ConfirmDialog
                abierto={desbloqueando}
                titulo={`¿Desbloquear la cuenta de ${nombre}?`}
                textoConfirmar="Desbloquear cuenta"
                onConfirmar={desbloquear}
                onCancelar={() => setDesbloqueando(false)}
            >
                La persona podrá iniciar sesión otra vez. El bloqueo se puede repetir desde esta ficha.
            </ConfirmDialog>
        </div>
    )
}

export default FichaUsuario
