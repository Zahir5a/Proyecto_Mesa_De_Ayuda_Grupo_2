import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { rutaInicio } from '../../data/navegacion'

function Login() {
    const { iniciarSesion } = useAuth()
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [mensaje, setMensaje] = useState('')
    const navigate = useNavigate()

    function enviar(e) {
        e.preventDefault()
        const resultado = iniciarSesion(correo, password)

        if (resultado.ok) {
            navigate(rutaInicio(resultado.usuario.rol))
        } else if (resultado.motivo === 'cuenta_inactiva') {
            setMensaje('Tu cuenta no está activa. Escribe a soporte.')
        } else {
            setMensaje('Correo o contraseña incorrectos.')
        }
    }

    return (
        <div>
            <h1>Iniciar sesión</h1>
            {mensaje && <p>{mensaje}</p>}
            <form onSubmit={enviar}>
                <label>
                    Correo institucional
                    <input
                        type="email"
                        value={correo}
                        onChange={(e) => {
                            setCorreo(e.target.value)
                            setMensaje('')
                        }}
                    />
                </label>
                <label>
                    Contraseña
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setMensaje('')
                        }}
                    />
                </label>
                <button type="submit">Ingresar</button>
            </form>
        </div>
    )
}

export default Login
