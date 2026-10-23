import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { rutaInicio } from '../../data/navegacion'
import { REGEX_CORREO } from '../../utils/validaciones'
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
    const form = useFormulario({ correo: '', password: '' }, validar)
    const [mensaje, setMensaje] = useState('')
    const navigate = useNavigate()

    function enviar(e) {
        e.preventDefault()
        setMensaje('')
        if (form.validarTodo() > 0) return

        const resultado = iniciarSesion(form.valores.correo, form.valores.password)

        if (resultado.ok) {
            navigate(rutaInicio(resultado.usuario.rol))
        } else if (resultado.motivo === 'cuenta_inactiva') {
            setMensaje('Tu cuenta no está activa. Escribe a soporte.')
        } else {
            setMensaje('Correo o contraseña incorrectos.')
        }
    }

    return (
        <div className="tarjeta tarjeta--formulario">
            <h1>Iniciar sesión</h1>
            <p className="texto-aux">Ingresa con tu correo institucional.</p>
            {mensaje && <p className="alerta-error">{mensaje}</p>}
            <form className="formulario" onSubmit={enviar} noValidate>
                <Campo etiqueta="Correo institucional" tipo="email" {...form.campo('correo')} />
                <Campo etiqueta="Contraseña" tipo="password" {...form.campo('password')} />
                <button type="submit" className="boton boton--primario">Ingresar</button>
            </form>
        </div>
    )
}

export default Login

