import { useState } from 'react'
import { AuthContext } from './auth-context'
import {
    cerrarSesion as cerrarSesionServicio,
    iniciarSesion as iniciarSesionServicio,
    obtenerUsuarioSesion,
} from '../services/authService'

function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => obtenerUsuarioSesion())

    function iniciarSesion(correo, password) {
        const resultado = iniciarSesionServicio(correo, password)
        if (resultado.ok) {
            setUsuario(resultado.usuario)
        }
        return resultado
    }

    function cerrarSesion() {
        cerrarSesionServicio()
        setUsuario(null)
    }

    const valor = { usuario, iniciarSesion, cerrarSesion }

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export default AuthProvider
