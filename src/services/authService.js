import { borrar, guardar, leer } from './almacen'
import {
    actualizarUsuario,
    buscarPorCorreo,
    buscarPorId,
    correoDisponible,
    crearUsuario,
    verificarPassword,
} from './usuariosService'

export const MAX_INTENTOS = 5
export const MINUTOS_BLOQUEO = 15

// ---- Intentos fallidos: se cuentan por correo, exista o no la cuenta ----

function leerIntentos() {
    return leer('intentos', {})
}

export function limpiarIntentos(correo) {
    const intentos = leerIntentos()
    delete intentos[correo.trim().toLowerCase()]
    guardar('intentos', intentos)
}

function registrarFallo(clave) {
    const intentos = leerIntentos()
    const previo = intentos[clave]
    // Si el bloqueo anterior ya venció, se empieza a contar de cero.
    const conteo = (previo && !previo.hasta ? previo.conteo : 0) + 1

    if (conteo >= MAX_INTENTOS) {
        const hasta = Date.now() + MINUTOS_BLOQUEO * 60 * 1000
        guardar('intentos', { ...intentos, [clave]: { conteo, hasta } })
        return { ok: false, motivo: 'bloqueo_temporal', hasta }
    }

    guardar('intentos', { ...intentos, [clave]: { conteo } })
    return { ok: false, motivo: 'credenciales', intentosRestantes: MAX_INTENTOS - conteo }
}

// ---- Iniciar sesión ----

export function iniciarSesion(correo, password, recordar = true) {
    const clave = correo.trim().toLowerCase()

    const intento = leerIntentos()[clave]
    if (intento && intento.hasta && intento.hasta > Date.now()) {
        return { ok: false, motivo: 'bloqueo_temporal', hasta: intento.hasta }
    }

    const usuario = buscarPorCorreo(clave)

    // Mismo resultado si el correo no existe o la contraseña es incorrecta.
    if (usuario === null || usuario.password !== password) {
        return registrarFallo(clave)
    }

    if (usuario.estado === 'bloqueado') {
        return { ok: false, motivo: 'bloqueada', detalle: usuario.motivoBloqueo }
    }

    if (usuario.estado !== 'activo') {
        return { ok: false, motivo: 'cuenta_inactiva' }
    }

    limpiarIntentos(clave)
    const actualizado = actualizarUsuario(usuario.id, { ultimoAcceso: new Date().toISOString() })
    guardarSesion(usuario.id, recordar)
    return { ok: true, usuario: actualizado }
}

// ---- Sesión: "Recordarme" la guarda en localStorage; si no, solo dura la pestaña ----

export function guardarSesion(idUsuario, recordar = true) {
    cerrarSesion()
    guardar('sesion', idUsuario, recordar ? 'local' : 'session')
}

export function cerrarSesion() {
    borrar('sesion', 'local')
    borrar('sesion', 'session')
}

export function obtenerUsuarioSesion() {
    const id = leer('sesion', null, 'local') ?? leer('sesion', null, 'session')
    if (!id) return null
    return buscarPorId(id)
}

export function haySesion(){
    if (obtenerUsuarioSesion() !== null) return true
    return false
}

// ---- Cuenta ----

export function registrarUsuario(datos) {
    if (!correoDisponible(datos.correo)) {
        return { ok: false, motivo: 'correo_en_uso' }
    }
    const usuario = crearUsuario({ ...datos, rol: 'usuario' })
    guardarSesion(usuario.id)
    return { ok: true, usuario }
}

export function cambiarPassword(idUsuario, actual, nueva) {
    if (!verificarPassword(idUsuario, actual)) {
        return { ok: false, motivo: 'password_actual' }
    }
    actualizarUsuario(idUsuario, { password: nueva })
    return { ok: true }
}

// Restablecer también levanta el bloqueo temporal: es la salida que ofrece el mensaje de cuenta bloqueada.
export function restablecerPassword(correo, nueva) {
    const usuario = buscarPorCorreo(correo)
    if (usuario === null) {
        return { ok: false, motivo: 'enlace_invalido' }
    }
    actualizarUsuario(usuario.id, { password: nueva })
    limpiarIntentos(correo)
    return { ok: true }
}
