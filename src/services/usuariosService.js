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