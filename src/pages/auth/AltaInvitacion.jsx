import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { MAX_ESPECIALIDADES } from '../../data/catalogos'
import { ETIQUETA_ROL, rutaInicio } from '../../data/navegacion'
import { categoriasActivas } from '../../services/catalogoService'
import { obtenerInvitacion, rechazarInvitacion } from '../../services/invitacionesService'
import { validarConfirmacion, validarPassword, validarTelefono } from '../../utils/validaciones'
import { formatearFecha } from '../../utils/formato'
import Campo from '../../components/ui/Campo'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import './auth.css'

const MENSAJES_ESTADO = {
    vencida: 'Esta invitación venció. Pide al área de Infraestructura que te envíe una nueva.',
    aceptada: 'Esta invitación ya fue utilizada. Inicia sesión con tu cuenta.',
    rechazada: 'Esta invitación fue rechazada y ya no se puede usar.',
}

function InvitacionNoDisponible({ mensaje }) {
    return (
        <div className="auth auth--simple">
            <div className="tarjeta tarjeta--formulario auth__tarjeta auth__tarjeta--recuperar">
                <h1>Invitación no disponible</h1>
                <p className="texto-aux">{mensaje}</p>
                <div className="formulario__acciones">
                    <Link to="/login" className="boton boton--primario">Iniciar sesión</Link>
                    <Link to="/" className="boton">Ir al inicio</Link>
                </div>
            </div>
        </div>
    )
}

// Solo se muestra con una invitación pendiente: así el formulario nace con los datos de la invitación.
function FormularioInvitacion({ invitacion, token }) {
    const { activarInvitacion } = useAuth()
    const { exito, info } = useToast()
    const navigate = useNavigate()
    const [errorGlobal, setErrorGlobal] = useState('')
    const [confirmandoRechazo, setConfirmandoRechazo] = useState(false)

    const esTecnico = invitacion.rol === 'tecnico'
    // Solo se puede declarar especialidad en las categorías activas del catálogo (HU-2)
    const categorias = categoriasActivas()

    function validar(v) {
        const errores = {}
        const errorTelefono = validarTelefono(v.telefono)
        if (errorTelefono) errores.telefono = errorTelefono
        const errorPassword = validarPassword(v.password)
        if (errorPassword) errores.password = errorPassword
        const errorConfirmar = validarConfirmacion(v.password, v.confirmar)
        if (errorConfirmar) errores.confirmar = errorConfirmar
        if (esTecnico && v.especialidades.length === 0) {
            errores.especialidades = 'Elige al menos una categoría de especialidad.'
        }
        return errores
    }

    const form = useFormulario(
        { telefono: invitacion.telefono, password: '', confirmar: '', especialidades: [] },
        validar
    )
    const seleccionadas = form.valores.especialidades
    const limiteAlcanzado = seleccionadas.length >= MAX_ESPECIALIDADES

    function alternarEspecialidad(id) {
        if (seleccionadas.includes(id)) {
            form.establecer('especialidades', seleccionadas.filter((e) => e !== id))
        } else if (!limiteAlcanzado) {
            form.establecer('especialidades', [...seleccionadas, id])
        }
    }

    function activar(e) {
        e.preventDefault()
        setErrorGlobal('')
        if (form.validarTodo() > 0) return

        const v = form.valores
        const resultado = activarInvitacion(token, {
            telefono: v.telefono,
            password: v.password,
            especialidades: v.especialidades,
        })

        if (resultado.ok) {
            exito('Cuenta activada. Te damos la bienvenida, ' + resultado.usuario.nombres.split(' ')[0] + '.')
            navigate(rutaInicio(resultado.usuario.rol))
        } else {
            setErrorGlobal('No se pudo activar la cuenta: el correo ya está registrado o la invitación dejó de estar vigente.')
        }
    }

    function rechazar() {
        rechazarInvitacion(token)
        info('Rechazaste la invitación.')
        navigate('/')
    }

    return (
        <div className="auth auth--simple">
        <div className="tarjeta tarjeta--formulario auth__tarjeta auth__tarjeta--invitacion">
            <span className="insignia">Invitación válida hasta el {formatearFecha(invitacion.venceEl + 'T12:00:00')}</span>
            <h1>Activa tu cuenta de {ETIQUETA_ROL[invitacion.rol].toLowerCase()}</h1>
            <p className="texto-aux">
                {invitacion.invitadoPor} te invitó a la Mesa de Ayuda. Revisa tus datos, define tu contraseña
                {esTecnico && ' y elige tu especialidad'}.
            </p>
            {errorGlobal && <p className="alerta-error">{errorGlobal}</p>}

            <form className="formulario formulario__rejilla" onSubmit={activar} noValidate>
                <Campo etiqueta="Nombres y apellidos" value={invitacion.nombres + ' ' + invitacion.apellidos}
                    ayuda="Dato de la invitación, no editable." readOnly disabled />
                <Campo etiqueta="Correo institucional" value={invitacion.correo} readOnly disabled />
                <Campo etiqueta="Rol asignado" value={ETIQUETA_ROL[invitacion.rol]} readOnly disabled />
                <Campo etiqueta="Teléfono de contacto" tipo="tel" {...form.campo('telefono')} />
                <Campo etiqueta="Contraseña" tipo="password"
                    ayuda="Mínimo 8 caracteres, con una mayúscula y un número." {...form.campo('password')} />
                <Campo etiqueta="Confirmar contraseña" tipo="password" {...form.campo('confirmar')} />

                {esTecnico && (
                    <fieldset className="formulario__ancho especialidades">
                        <legend className="campo__etiqueta">
                            Especialidad · elige hasta {MAX_ESPECIALIDADES} categorías ({seleccionadas.length}/{MAX_ESPECIALIDADES})
                        </legend>
                        <div className="lista-chips">
                            {categorias.map((c) => {
                                const activa = seleccionadas.includes(c.id)
                                return (
                                    <button key={c.id} type="button" className="chip" aria-pressed={activa}
                                        disabled={!activa && limiteAlcanzado} onClick={() => alternarEspecialidad(c.id)}>
                                        {c.nombre}{activa && ' ✓'}
                                    </button>
                                )
                            })}
                        </div>
                        {form.campo('especialidades').error && (
                            <p className="campo__mensaje campo__mensaje--error">{form.campo('especialidades').error}</p>
                        )}
                    </fieldset>
                )}

                <div className="formulario__ancho formulario__acciones">
                    <button type="submit" className="boton boton--primario">Activar mi cuenta</button>
                    <button type="button" className="boton boton--terciario" onClick={() => setConfirmandoRechazo(true)}>
                        Rechazar invitación
                    </button>
                </div>
            </form>

            <ConfirmDialog
                abierto={confirmandoRechazo}
                titulo="¿Rechazar la invitación?"
                textoConfirmar="Rechazar invitación"
                destructivo
                onConfirmar={rechazar}
                onCancelar={() => setConfirmandoRechazo(false)}
            >
                <p>La invitación quedará anulada y tendrás que pedir una nueva al área de Infraestructura.</p>
            </ConfirmDialog>
        </div>
        </div>
    )
}

function AltaInvitacion() {
    const { token } = useParams()
    const [invitacion] = useState(() => obtenerInvitacion(token))

    if (invitacion === null) {
        return <InvitacionNoDisponible mensaje="El enlace de invitación no es válido o fue modificado." />
    }
    if (invitacion.estado !== 'pendiente') {
        return <InvitacionNoDisponible mensaje={MENSAJES_ESTADO[invitacion.estado]} />
    }
    return <FormularioInvitacion invitacion={invitacion} token={token} />
}

export default AltaInvitacion
