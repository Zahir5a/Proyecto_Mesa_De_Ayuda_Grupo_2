import semilla from '../data/usuarios.json'
import { guardar, leer } from './almacen'

function cargar() {
    const guardados = leer('usuarios', null)
    if (guardados) return guardados
    guardar('usuarios', semilla)
    return semilla
}

export function listarUsuarios() {
    return cargar()
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

// ---- Bloqueo de cuentas (HU-7) ----
// Una cuenta bloqueada no puede iniciar sesión ni seguir con su sesión abierta; sus tickets se mantienen.

export function bloquearUsuario(id, motivo, supervisor) {
    const usuario = buscarPorId(id)
    if (usuario === null) return { ok: false, motivo: 'no_existe' }
    if (id === supervisor.id) return { ok: false, motivo: 'propia' }
    if (!motivo.trim()) return { ok: false, motivo: 'sin_motivo' }

    actualizarUsuario(id, {
        estado: 'bloqueado',
        motivoBloqueo: motivo.trim(),
        bloqueadoEn: new Date().toISOString(),
        bloqueadoPor: supervisor.nombres + ' ' + supervisor.apellidos,
    })
    return { ok: true }
}

export function desbloquearUsuario(id) {
    const usuario = buscarPorId(id)
    if (usuario === null) return { ok: false, motivo: 'no_existe' }

    actualizarUsuario(id, { estado: 'activo', motivoBloqueo: null, bloqueadoEn: null, bloqueadoPor: null })
    return { ok: true }
}
