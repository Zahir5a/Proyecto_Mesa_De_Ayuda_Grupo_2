import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { rutaInicio } from '../../data/navegacion'
import { UNIDADES, VINCULOS } from '../../data/catalogos'
import { correoDisponible } from '../../services/usuariosService'
import {
    validarConfirmacion,
    validarCorreoInstitucional,
    validarPassword,
    validarTelefono,
} from '../../utils/validaciones'
import Campo, { CampoCasilla } from '../../components/ui/Campo'
import './auth.css'

const INICIAL = {
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    password: '',
    confirmar: '',
    unidad: '',
    vinculo: '',
    terminos: false,
}

function validar(v) {
    const errores = {}

    if (!v.nombres.trim()) errores.nombres = 'Los nombres son obligatorios.'
    if (!v.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.'

    const errorCorreo = validarCorreoInstitucional(v.correo)
    if (errorCorreo) errores.correo = errorCorreo
    else if (!correoDisponible(v.correo)) errores.correo = 'Este correo ya tiene una cuenta.'

    const errorTelefono = validarTelefono(v.telefono)
    if (errorTelefono) errores.telefono = errorTelefono

    const errorPassword = validarPassword(v.password)
    if (errorPassword) errores.password = errorPassword

    const errorConfirmar = validarConfirmacion(v.password, v.confirmar)
    if (errorConfirmar) errores.confirmar = errorConfirmar

    if (!v.unidad) errores.unidad = 'Selecciona tu unidad o carrera.'
    if (!v.vinculo) errores.vinculo = 'Selecciona tu vínculo con la universidad.'
    if (!v.terminos) errores.terminos = 'Debes aceptar los términos para crear la cuenta.'

    return errores
}

function Registro() {
    const { registrar } = useAuth()
    const { exito } = useToast()
    const form = useFormulario(INICIAL, validar)
    const [mensaje, setMensaje] = useState('')
    const navigate = useNavigate()

    function enviar(e) {
        e.preventDefault()
        setMensaje('')
        if (form.validarTodo() > 0) return

        const v = form.valores
        const resultado = registrar({
            nombres: v.nombres.trim(),
            apellidos: v.apellidos.trim(),
            correo: v.correo,
            telefono: v.telefono,
            password: v.password,
            unidad: v.unidad,
            vinculo: v.vinculo,
        })

        if (resultado.ok) {
            exito('Cuenta creada. Te damos la bienvenida, ' + resultado.usuario.nombres.split(' ')[0] + '.')
            navigate(rutaInicio(resultado.usuario.rol))
        } else {
            setMensaje('No se pudo crear la cuenta. Prueba con otro correo.')
        }
    }

    const correoValido = form.valores.correo !== '' && form.errores.correo === undefined

    return (
        <div className="auth auth--registro">
            <section className="tarjeta tarjeta--formulario auth__tarjeta">
                <h1>Crear mi cuenta</h1>
                <p className="texto-aux">Solo para miembros de la comunidad con correo institucional.</p>
                {mensaje && <p className="alerta-error">{mensaje}</p>}

                <form className="formulario formulario__rejilla" onSubmit={enviar} noValidate>
                    <Campo etiqueta="Nombres" autoComplete="given-name" {...form.campo('nombres')} />
                    <Campo etiqueta="Apellidos" autoComplete="family-name" {...form.campo('apellidos')} />
                    <Campo etiqueta="Correo institucional" tipo="email" autoComplete="email" {...form.campo('correo')}
                        exito={correoValido ? 'Correo válido y disponible.' : undefined} />
                    <Campo etiqueta="Teléfono" tipo="tel" autoComplete="tel-national" placeholder="987 654 321"
                        ayuda="Para coordinar el acceso al ambiente." {...form.campo('telefono')} />
                    <Campo etiqueta="Contraseña" tipo="password" autoComplete="new-password"
                        ayuda="Mínimo 8 caracteres, con una mayúscula y un número." {...form.campo('password')} />
                    <Campo etiqueta="Confirmar contraseña" tipo="password" autoComplete="new-password"
                        {...form.campo('confirmar')} />
                    <Campo etiqueta="Unidad o carrera" tipo="select" placeholder="Selecciona…"
                        opciones={UNIDADES} {...form.campo('unidad')} />
                    <Campo etiqueta="Vínculo con la universidad" tipo="select" placeholder="Selecciona…"
                        opciones={VINCULOS} {...form.campo('vinculo')} />

                    <div className="formulario__ancho">
                        <CampoCasilla {...form.casilla('terminos')}>
                            Acepto los términos del servicio y la política de privacidad.
                        </CampoCasilla>
                    </div>

                    <div className="formulario__ancho formulario__acciones">
                        <button type="submit" className="boton boton--primario">Crear cuenta</button>
                        <Link to="/" className="boton">Cancelar</Link>
                    </div>
                </form>
            </section>

            <aside className="tarjeta auth__lateral auth__lateral--tarjeta">
                <h2>Antes de registrarte</h2>
                <p className="texto-aux">
                    Si eres técnico o supervisor no uses este formulario: el área de Infraestructura te envía una
                    invitación con tus datos precargados.
                </p>
                <hr />
                <p className="texto-aux">
                    Tu cuenta queda activa al instante; el correo de bienvenida llega en pocos minutos.
                </p>
            </aside>
        </div>
    )
}

export default Registro
