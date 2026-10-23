import semilla from '../data/usuarios.json'
import { guardar, leer } from './almacen'

function cargar() {
    const guardados = leer('usuarios', null)
    if (guardados) return guardados
    guardar('usuarios', semilla)
    return semilla
}

export function buscarPorCorreo(correo) {
    const usuarios = cargar()
    const buscado = correo.trim().toLowerCase()
    const encontrado = usuarios.find((u) => u.correo.toLowerCase() === buscado)
    return encontrado ?? null
}

export function correoDisponible(correo) {
    return buscarPorCorreo(correo) === null
}

export function buscarPorId(id) {
    const usuarios = cargar()
    const encontrado = usuarios.find((u) => u.id === id)
    return encontrado ?? null
}

export function crearUsuario(datos) {
    const usuarios = cargar()
    const nuevo = {
        ...datos,
        id: 'u-' + Date.now(),
        correo: datos.correo.trim().toLowerCase(),
        estado: 'activo',
        creadoEn: new Date().toISOString(),
    }
    guardar('usuarios', [...usuarios, nuevo])
    return nuevo
}

export function actualizarUsuario(id, cambios) {
    const usuarios = cargar()
    let actualizado = null

    const nuevaLista = usuarios.map((u) => {
        if (u.id !== id) return u
        actualizado = { ...u, ...cambios }
        return actualizado
    })

    guardar('usuarios', nuevaLista)
    return actualizado
}

export function verificarPassword(id, password) {
    const usuario = buscarPorId(id)
    return usuario !== null && usuario.password === password
}
