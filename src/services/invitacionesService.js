import semilla from '../data/invitaciones.json'
import { guardar, leer } from './almacen'
import { guardarSesion } from './authService'
import { correoDisponible, crearUsuario } from './usuariosService'

// Invitaciones para técnicos y supervisores: las emite el supervisor (HU-7); aquí solo se consumen.

function cargar() {
    const guardadas = leer('invitaciones', null)
    if (guardadas) return guardadas
    guardar('invitaciones', semilla)
    return semilla
}

function marcar(token, estado) {
    const lista = cargar().map((i) => (i.token === token ? { ...i, estado } : i))
    guardar('invitaciones', lista)
}

// Devuelve la invitación con su estado efectivo: pendiente | vencida | aceptada | rechazada.
// "vencida" no se guarda: se calcula comparando la fecha límite con la de hoy.
export function obtenerInvitacion(token) {
    const invitacion = cargar().find((i) => i.token === token)
    if (!invitacion) return null

    const vencida = new Date(invitacion.venceEl + 'T23:59:59') < new Date()
    const estado = invitacion.estado === 'pendiente' && vencida ? 'vencida' : invitacion.estado
    return { ...invitacion, estado }
}

export function aceptarInvitacion(token, { telefono, password, especialidades }) {
    const invitacion = obtenerInvitacion(token)

    if (invitacion === null || invitacion.estado !== 'pendiente') {
        return { ok: false, motivo: 'no_disponible' }
    }
    if (!correoDisponible(invitacion.correo)) {
        return { ok: false, motivo: 'correo_en_uso' }
    }

    const usuario = crearUsuario({
        nombres: invitacion.nombres,
        apellidos: invitacion.apellidos,
        correo: invitacion.correo,
        password,
        telefono,
        rol: invitacion.rol,
        unidad: 'Infraestructura y Servicios',
        vinculo: 'administrativo',
        especialidades: invitacion.rol === 'tecnico' ? especialidades : [],
    })

    marcar(token, 'aceptada')
    guardarSesion(usuario.id)
    return { ok: true, usuario }
}

export function rechazarInvitacion(token) {
    marcar(token, 'rechazada')
}
