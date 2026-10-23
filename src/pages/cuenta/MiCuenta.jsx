import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { AMBIENTES, UNIDADES, nombreCategoria } from '../../data/catalogos'
import { ETIQUETA_ROL } from '../../data/navegacion'
import { formatearFecha } from '../../utils/formato'
import { validarTelefono } from '../../utils/validaciones'
import Avatar from '../../components/ui/Avatar'
import Campo from '../../components/ui/Campo'
import CambiarPassword from './CambiarPassword'
import './cuenta.css'

function validar(v) {
    const errores = {}
    if (!v.nombres.trim()) errores.nombres = 'Los nombres son obligatorios.'
    if (!v.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.'
    const errorTelefono = validarTelefono(v.telefono)
    if (errorTelefono) errores.telefono = errorTelefono
    if (!v.unidad) errores.unidad = 'Selecciona tu unidad o carrera.'
    return errores
}

// Datos que se muestran en la tarjeta de perfil según el rol.
function filasResumen(usuario) {
    const r = usuario.resumen || {}
    if (usuario.rol === 'tecnico') {
        return [['Asignados', r.asignados ?? 0], ['En atención', r.enAtencion ?? 0]]
    }
    if (usuario.rol === 'supervisor') {
        return [['Cola sin asignar', r.colaSinAsignar ?? 0], ['Usuarios', r.usuarios ?? 0]]
    }
    return [['Tickets reportados', r.ticketsReportados ?? 0], ['Abiertos ahora', r.ticketsAbiertos ?? 0]]
}

function MiCuenta() {
    const { usuario, actualizarPerfil } = useAuth()
    const { exito } = useToast()
    const form = useFormulario(
        {
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            unidad: usuario.unidad,
            ambienteHabitual: usuario.ambienteHabitual || '',
        },
        validar
    )
    const resumen = usuario.resumen || {}
    const rol = ETIQUETA_ROL[usuario.rol]

    function guardar(e) {
        e.preventDefault()
        if (form.validarTodo() > 0) return

        const v = form.valores
        actualizarPerfil({
            nombres: v.nombres.trim(),
            apellidos: v.apellidos.trim(),
            telefono: v.telefono,
            unidad: v.unidad,
            ambienteHabitual: v.ambienteHabitual,
        })
        exito('Guardamos los cambios de tu cuenta.')
    }

    // Vuelve a los datos que están guardados.
    function descartar() {
        form.establecer('nombres', usuario.nombres)
        form.establecer('apellidos', usuario.apellidos)
        form.establecer('telefono', usuario.telefono)
        form.establecer('unidad', usuario.unidad)
        form.establecer('ambienteHabitual', usuario.ambienteHabitual || '')
    }

    return (
        <div>
            <h1>Mi cuenta</h1>
            <p className="texto-aux cuenta__subtitulo">
                Tus datos se usan para contactarte durante la atención de un ticket.
            </p>

            <div className="cuenta">
                <div className="tarjeta tarjeta--formulario cuenta__principal">
                    <h2>Datos personales</h2>
                    <form className="formulario formulario__rejilla" onSubmit={guardar} noValidate>
                        <Campo etiqueta="Nombres" {...form.campo('nombres')} />
                        <Campo etiqueta="Apellidos" {...form.campo('apellidos')} />
                        <Campo etiqueta="Correo institucional" value={usuario.correo}
                            ayuda="No editable." readOnly disabled />
                        <Campo etiqueta="Teléfono" tipo="tel" {...form.campo('telefono')} />
                        <Campo etiqueta="Unidad o carrera" tipo="select" placeholder="Selecciona…"
                            opciones={UNIDADES} {...form.campo('unidad')} />
                        <Campo etiqueta="Ambiente habitual" tipo="select" placeholder="Selecciona…"
                            opciones={AMBIENTES} {...form.campo('ambienteHabitual')} />

                        {usuario.especialidades && usuario.especialidades.length > 0 && (
                            <div className="formulario__ancho">
                                <span className="campo__etiqueta">Especialidad declarada</span>
                                <ul className="lista-chips">
                                    {usuario.especialidades.map((id) => (
                                        <li key={id} className="chip chip--estatico">{nombreCategoria(id)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="formulario__ancho formulario__acciones">
                            <button type="submit" className="boton boton--primario">Guardar cambios</button>
                            <button type="button" className="boton boton--terciario" onClick={descartar}>Descartar</button>
                        </div>
                    </form>

                    <hr className="cuenta__separador" />
                    <CambiarPassword />
                </div>

                <aside className="cuenta__lateral">
                    <div className="tarjeta cuenta__perfil">
                        <Avatar usuario={usuario} grande />
                        <strong>{usuario.nombres} {usuario.apellidos}</strong>
                        <span className="texto-aux">
                            {rol}
                            {usuario.rol === 'usuario' && usuario.vinculo === 'alumno' && ' · alumno/a'}
                            {usuario.rol === 'usuario' && usuario.vinculo === 'docente' && ' · docente'}
                            {usuario.rol === 'usuario' && usuario.vinculo === 'administrativo' && ' · administrativo'}
                        </span>
                        <dl className="cuenta__datos">
                            {filasResumen(usuario).map(([nombre, valor]) => (
                                <div key={nombre}>
                                    <dt>{nombre}</dt>
                                    <dd>{valor}</dd>
                                </div>
                            ))}
                            <div>
                                <dt>Cuenta creada</dt>
                                <dd>{formatearFecha(usuario.creadoEn)}</dd>
                            </div>
                        </dl>
                    </div>

                    {usuario.rol === 'usuario' && resumen.encuestaPendiente > 0 && (
                        <div className="cuenta__encuesta">
                            <strong>Encuesta pendiente</strong>
                            <p>
                                El ticket {resumen.ticketPendiente} se cerró el {resumen.cerradoEl}. Califica la
                                atención antes del {resumen.limiteEncuesta}.
                            </p>
                            <Link to="/usuario/encuesta-pendiente" className="boton boton--aviso">Responder encuesta</Link>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}

export default MiCuenta
