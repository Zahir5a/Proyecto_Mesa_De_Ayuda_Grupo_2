import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { rutaInicio } from '../../data/navegacion'
import { CONTACTO } from '../../data/contenidoPublico'
import { MAX_INTENTOS, MINUTOS_BLOQUEO } from '../../services/authService'
import { REGEX_CORREO } from '../../utils/validaciones'
import { formatearHora } from '../../utils/formato'
import Campo from '../../components/ui/Campo'

function validar(v) {
    const errores = {}
    if (!v.correo.trim()) errores.correo = 'Ingresa tu correo institucional.'
    else if (!REGEX_CORREO.test(v.correo.trim())) errores.correo = 'Escribe un correo válido.'
    if (!v.password) errores.password = 'Ingresa tu contraseña.'
    return errores
}

function Login() {
    const { iniciarSesion } = useAuth()
    const { exito } = useToast()
    const form = useFormulario({ correo: '', password: '' }, validar)
    const [fallo, setFallo] = useState(null)
    const navigate = useNavigate()

    function enviar(e) {
        e.preventDefault()
        setFallo(null)
        if (form.validarTodo() > 0) return

        const resultado = iniciarSesion(form.valores.correo, form.valores.password)

        if (resultado.ok) {
            exito('Hola, ' + resultado.usuario.nombres.split(' ')[0] + '. Iniciaste sesión correctamente.')
            navigate(rutaInicio(resultado.usuario.rol))
        } else {
            setFallo(resultado)
        }
    }

    const password = form.campo('password')
    const credencialesMalas = fallo !== null && fallo.motivo === 'credenciales'

    return (
        <div className="tarjeta tarjeta--formulario">
            <h1>Iniciar sesión</h1>
            <p className="texto-aux">Ingresa con tu correo institucional.</p>

            {credencialesMalas && (
                <p className="alerta-error">
                    Correo o contraseña incorrectos. Te quedan {fallo.intentosRestantes} de {MAX_INTENTOS} intentos
                    antes del bloqueo temporal.
                </p>
            )}
            {fallo !== null && fallo.motivo === 'bloqueo_temporal' && (
                <p className="alerta-aviso">
                    Cuenta bloqueada por {MINUTOS_BLOQUEO} minutos tras {MAX_INTENTOS} intentos fallidos. Podrás
                    ingresar a las {formatearHora(fallo.hasta)} o <Link to="/recuperar-contrasena">restablecer tu
                    contraseña</Link> ahora.
                </p>
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
                <Campo etiqueta="Correo institucional" tipo="email" {...form.campo('correo')} />
                <Campo etiqueta="Contraseña" tipo="password" {...password}
                    error={password.error || (credencialesMalas ? 'Verifica tus datos e inténtalo otra vez.' : undefined)} />
                <p className="formulario__enlace"><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></p>
                <button type="submit" className="boton boton--primario">Ingresar</button>
            </form>

            <p className="texto-aux">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
        </div>
    )
}

export default Login
