import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { rutaInicio } from '../../data/navegacion'
import { CONTACTO } from '../../data/contenidoPublico'
import { MINUTOS_BLOQUEO } from '../../services/authService'
import { obtenerTickets, resumenDeTickets } from '../../services/ticketsService'
import { REGEX_CORREO } from '../../utils/validaciones'
import { formatearHora } from '../../utils/formato'
import Campo, { CampoCasilla } from '../../components/ui/Campo'
import './auth.css'

const ESPERA_MS = 600

function validar(v) {
    const errores = {}
    if (!v.correo.trim()) errores.correo = 'Ingresa tu correo institucional.'
    else if (!REGEX_CORREO.test(v.correo.trim())) errores.correo = 'Escribe un correo válido.'
    if (!v.password) errores.password = 'Ingresa tu contraseña.'
    return errores
}

function mensajeBienvenida(usuario) {
    const nombre = usuario.nombres.split(' ')[0]
    if (usuario.rol === 'usuario') {
        const resumen = resumenDeTickets(obtenerTickets(), usuario.id)
        const abiertos = resumen.ticketsAbiertos + (resumen.ticketsAbiertos === 1 ? ' ticket abierto' : ' tickets abiertos')
        const encuestas = resumen.encuestaPendiente + (resumen.encuestaPendiente === 1 ? ' encuesta pendiente' : ' encuestas pendientes')
        return 'Hola, ' + nombre + '. Tienes ' + abiertos + ' y ' + encuestas + '.'
    }
    return 'Hola, ' + nombre + '. Iniciaste sesión correctamente.'
}

function Login() {
    const { iniciarSesion } = useAuth()
    const { exito } = useToast()
    const form = useFormulario({ correo: '', password: '', recordar: true }, validar)
    const [fallo, setFallo] = useState(null)
    const [cargando, setCargando] = useState(false)
    const navigate = useNavigate()

    function enviar(e) {
        e.preventDefault()
        setFallo(null)
        if (form.validarTodo() > 0) return

        setCargando(true)
        setTimeout(() => {
            const v = form.valores
            const resultado = iniciarSesion(v.correo, v.password, v.recordar)

            if (resultado.ok) {
                exito(mensajeBienvenida(resultado.usuario))
                navigate(rutaInicio(resultado.usuario.rol))
            } else {
                setFallo(resultado)
                setCargando(false)
            }
        }, ESPERA_MS)
    }

    const password = form.campo('password')
    const credencialesMalas = fallo !== null && fallo.motivo === 'credenciales'

    return (
        <div className="auth auth--login">
            <section className="tarjeta tarjeta--formulario auth__tarjeta">
                <h1>Iniciar sesión</h1>
                <p className="texto-aux">Ingresa con tu correo institucional.</p>

                {credencialesMalas && (
                    <p className="alerta-error">
                        Correo o contraseña incorrectos. Te quedan {fallo.intentosRestantes} intentos antes del
                        bloqueo temporal.
                    </p>
                )}
                {fallo !== null && fallo.motivo === 'bloqueo_temporal' && (
                    <>
                        <p className="alerta-aviso">
                            Cuenta bloqueada por {MINUTOS_BLOQUEO} minutos tras cinco intentos fallidos. Podrás
                            ingresar a las {formatearHora(fallo.hasta)} o restablecer tu contraseña ahora.
                        </p>
                        <div className="formulario__acciones">
                            <Link to="/recuperar-contrasena" className="boton boton--primario">Restablecer contraseña</Link>
                            <a href={'mailto:' + CONTACTO.correo + '?subject=Cuenta bloqueada'} className="boton boton--terciario">
                                Escribir a soporte
                            </a>
                        </div>
                    </>
                )}
                {fallo !== null && fallo.motivo === 'bloqueada' && (
                    <p className="alerta-error">
                        Tu cuenta fue bloqueada por el supervisor. Escribe a {CONTACTO.correo} para solicitar su revisión.
                    </p>
                )}
                {fallo !== null && fallo.motivo === 'cuenta_inactiva' && (
                    <p className="alerta-aviso">
                        Tu cuenta no está activa. Escribe a {CONTACTO.correo} para reactivarla.
                    </p>
                )}

                <form className="formulario" onSubmit={enviar} noValidate>
                    <fieldset disabled={cargando} className="formulario">
                        <Campo etiqueta="Correo institucional" tipo="email" autoComplete="username"
                            {...form.campo('correo')} />
                        <Campo etiqueta="Contraseña" tipo="password" autoComplete="current-password" {...password}
                            error={password.error || (credencialesMalas ? 'Verifica tus datos e inténtalo otra vez.' : undefined)} />
                        <div className="formulario__fila">
                            <CampoCasilla {...form.casilla('recordar')}>Recordarme en este equipo</CampoCasilla>
                            <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
                        </div>
                        <button type="submit" className={cargando ? 'boton boton--primario boton--bloque boton--cargando' : 'boton boton--primario boton--bloque'}>
                            {cargando ? 'Ingresando…' : 'Ingresar'}
                        </button>
                    </fieldset>
                </form>

                <p className="auth__pie">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
            </section>

            <aside className="auth__lateral">
                <h2>Acceso por rol</h2>
                <p className="texto-aux">
                    Usuarios de la comunidad ingresan con su correo. Técnicos y supervisores reciben una invitación
                    del área de Infraestructura y definen su contraseña al aceptarla.
                </p>
                <p className="nota">
                    Tras cinco intentos fallidos la cuenta se bloquea por {MINUTOS_BLOQUEO} minutos.
                </p>
            </aside>
        </div>
    )
}

export default Login
