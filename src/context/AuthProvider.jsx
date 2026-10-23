import { useState } from 'react'
import { AuthContext } from './auth-context'
import {
    cambiarPassword as cambiarPasswordServicio,
    cerrarSesion as cerrarSesionServicio,
    iniciarSesion as iniciarSesionServicio,
    obtenerUsuarioSesion,
    registrarUsuario as registrarUsuarioServicio,
} from '../services/authService'

import { aceptarInvitacion } from '../services/invitacionesService'
import { actualizarUsuario } from '../services/usuariosService'

function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => obtenerUsuarioSesion())

    function iniciarSesion(correo, password, recordar) {
        const resultado = iniciarSesionServicio(correo, password, recordar)
        if (resultado.ok) {
            setUsuario(resultado.usuario)
        }
        return resultado
    }

    function registrar(datos) {
        const resultado = registrarUsuarioServicio(datos)
        if (resultado.ok) {
            setUsuario(resultado.usuario)
        }
        return resultado
    }

    function activarInvitacion(token, datos) {
        const resultado = aceptarInvitacion(token, datos)
        if (resultado.ok) {
            setUsuario(resultado.usuario)
        }
        return resultado
    }

    function actualizarPerfil(cambios) {
        const actualizado = actualizarUsuario(usuario.id, cambios)
        setUsuario(actualizado)
    }

    function cambiarPassword(actual, nueva) {
        return cambiarPasswordServicio(usuario.id, actual, nueva)
    }

    function cerrarSesion() {
        cerrarSesionServicio()
        setUsuario(null)
    }

    const valor = {
        usuario,
        iniciarSesion,
        registrar,
        activarInvitacion,
        actualizarPerfil,
        cambiarPassword,
        cerrarSesion,
    }

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export default AuthProvider
