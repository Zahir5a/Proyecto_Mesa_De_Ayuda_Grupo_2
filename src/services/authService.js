import { borrar, guardar, leer } from './almacen'
import { buscarPorCorreo, buscarPorId } from './usuariosService'

export function iniciarSesion(correo, password) {
    const usuario = buscarPorCorreo(correo)

    if (usuario === null || usuario.password !== password) {
        return { ok: false, motivo: 'credenciales' }
    }

    if (usuario.estado !== 'activo') {
        return { ok: false, motivo: 'cuenta_inactiva' }
    }

    guardarSesion(usuario.id)
    return { ok: true, usuario }
}

export function guardarSesion(idUsuario) {
    guardar('sesion', idUsuario)
}

export function cerrarSesion() {
    borrar('sesion')
}

export function obtenerUsuarioSesion() {
    const id = leer('sesion', null)
    if (!id) return null
    return buscarPorId(id)
}

export function haySesion(){
    if (obtenerUsuarioSesion() !== null) return true
    return false
}