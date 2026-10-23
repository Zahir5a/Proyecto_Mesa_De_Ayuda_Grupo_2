import semilla from '../data/invitaciones.json'
import { guardar, leer } from './almacen'
import { guardarSesion } from './authService'
import { correoDisponible, crearUsuario } from './usuariosService'

// Invitaciones para técnicos y supervisores: las emite el supervisor (por ejemplo desde
// "Técnicos por categoría", HU-2) y se consumen al activar la cuenta.

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

const DIAS_VIGENCIA = 7

// Crea una invitación de técnico. El correo no se envía de verdad: el supervisor copia el enlace.
export function crearInvitacion({ nombres, apellidos, correo, invitadoPor }) {
    if (!correoDisponible(correo)) return { ok: false, motivo: 'correo_en_uso' }
    if (cargar().some((i) => i.correo === correo.trim().toLowerCase() && i.estado === 'pendiente')) {
        return { ok: false, motivo: 'ya_invitado' }
    }

    const vence = new Date()
    vence.setDate(vence.getDate() + DIAS_VIGENCIA)

    const invitacion = {
        token: 'inv-' + Date.now().toString(36),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: '',
        rol: 'tecnico',
        invitadoPor,
        venceEl: vence.toISOString().slice(0, 10),
        estado: 'pendiente',
    }
    guardar('invitaciones', [...cargar(), invitacion])
    return { ok: true, invitacion }
}
