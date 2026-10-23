import semilla from '../data/tickets.json'
import { ESTADOS_EN_CURSO, PLAZO_REAPERTURA_DIAS } from '../data/tickets'
import { guardar, leer } from './almacen'
import { sumarDias } from '../utils/plazos'

// Tickets (HU-3). Se guardan en el navegador y, cada vez que cambian, se avisa a quien los esté
// mirando (ver useTickets). Quien atiende los tickets (HU-4 y HU-5) debe usar este mismo servicio.

let tickets = null
const oyentes = new Set()

const UN_MINUTO = 60000

// La semilla guarda los tiempos como "hace N minutos" para que los plazos de la demostración
// (reapertura, encuesta) sigan vigentes sin importar el día en que se abra el proyecto.
function crearSemilla() {
    const ahora = Date.now()
    const fecha = (desdeAhora) => new Date(ahora - desdeAhora * UN_MINUTO).toISOString()

    return semilla.map((t) => {
        const registradoEn = fecha(t.haceMin)
        const despues = (minutos) => new Date(new Date(registradoEn).getTime() + minutos * UN_MINUTO).toISOString()
        const { haceMin, cerradoHaceMin, bitacora, historial, ...resto } = t // eslint-disable-line no-unused-vars

        return {
            ...resto,
            registradoEn,
            cerradoEn: cerradoHaceMin === undefined ? null : fecha(cerradoHaceMin),
            bitacora: bitacora.map((b, i) => ({ id: t.codigo + '-b' + i, autor: b.autor, rol: b.rol, texto: b.texto, tipo: b.tipo, fecha: despues(b.despuesMin) })),
            historial: historial.map((h) => ({ tipo: h.tipo, autor: h.autor, fecha: despues(h.despuesMin) })),
        }
    })
}

function cargar() {
    if (tickets === null) {
        tickets = leer('tickets', null) ?? crearSemilla()
    }
    return tickets
}

// Guarda y comprueba que quedó guardado; si el navegador no deja escribir, devuelve false.
function actualizar(nuevos) {
    guardar('tickets', nuevos)
    if (leer('tickets', null) === null) return false

    tickets = nuevos
    oyentes.forEach((avisar) => avisar())
    return true
}

export function obtenerTickets() {
    return cargar()
}

export function suscribir(oyente) {
    oyentes.add(oyente)
    return () => oyentes.delete(oyente)
}

// ---------- Consultas ----------

export function ticketsDeUsuario(lista, usuarioId) {
    return lista.filter((t) => t.usuarioId === usuarioId)
}

export function buscarTicket(lista, codigo) {
    return lista.find((t) => t.codigo === codigo.toUpperCase()) ?? null
}

export function estaEnCurso(ticket) {
    return ESTADOS_EN_CURSO.includes(ticket.estado)
}

// Contadores del menú y de "Mi cuenta" para un usuario.
export function resumenDeTickets(lista, usuarioId) {
    const propios = ticketsDeUsuario(lista, usuarioId)
    return {
        ticketsReportados: propios.length,
        ticketsAbiertos: propios.filter(estaEnCurso).length,
        encuestaPendiente: propios.filter((t) => t.encuestaPendiente).length,
    }
}

// Último ticket cerrado que todavía espera la encuesta, con su fecha límite (7 días tras el cierre).
export function encuestaPendiente(lista, usuarioId) {
    const ticket = ticketsDeUsuario(lista, usuarioId).find((t) => t.encuestaPendiente)
    if (!ticket) return null
    return { codigo: ticket.codigo, cerradoEn: ticket.cerradoEn, limite: sumarDias(ticket.cerradoEn, PLAZO_REAPERTURA_DIAS) }
}

// Ticket abierto de otra persona (o la misma) para el mismo ambiente y la misma categoría.
export function buscarDuplicado(lista, categoriaId, ambiente) {
    const codigo = ambiente.trim().toUpperCase()
    if (!categoriaId || !codigo) return null
    return lista.find((t) => estaEnCurso(t) && t.categoriaId === categoriaId && t.ambiente === codigo) ?? null
}

// Se puede reabrir un ticket cerrado hasta 7 días después del cierre.
export function limiteReapertura(ticket) {
    if (ticket.estado !== 'cerrado' || !ticket.cerradoEn) return null
    return sumarDias(ticket.cerradoEn, PLAZO_REAPERTURA_DIAS)
}

export function puedeReabrir(ticket) {
    const limite = limiteReapertura(ticket)
    return limite !== null && new Date() <= limite
}

// Solo se cancela mientras nadie lo haya asignado.
export function puedeCancelar(ticket) {
    return ticket.estado === 'abierto' && !ticket.tecnico
}

export function admiteComentarios(ticket) {
    return ticket.estado !== 'cerrado' && ticket.estado !== 'cancelado'
}

// ---------- Cambios ----------

function siguienteCodigo(lista) {
    const mayor = lista.reduce((max, t) => Math.max(max, Number(t.codigo.slice(-5))), 0)
    return 'TCK-' + new Date().getFullYear() + '-' + String(mayor + 1).padStart(5, '0')
}

function nombreCompleto(usuario) {
    return usuario.nombres + ' ' + usuario.apellidos
}

// datos: { categoriaId, subcategoriaId, ambiente, prioridad, asunto, descripcion, evidencia }
export function registrarTicket(datos, usuario) {
    const lista = cargar()
    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)

    const ticket = {
        codigo: siguienteCodigo(lista),
        usuarioId: usuario.id,
        asunto: datos.asunto.trim(),
        descripcion: datos.descripcion.trim(),
        categoriaId: datos.categoriaId,
        subcategoriaId: datos.subcategoriaId,
        ambiente: datos.ambiente.trim().toUpperCase(),
        prioridad: datos.prioridad,
        estado: 'abierto',
        registradoEn: ahora,
        cerradoEn: null,
        tecnico: null,
        evidencia: datos.evidencia,
        bitacora: [{ id: 'b0', autor, rol: 'usuario', texto: datos.descripcion.trim(), tipo: 'publico', fecha: ahora }],
        historial: [{ tipo: 'abierto', autor, fecha: ahora }],
    }

    if (!actualizar([ticket, ...lista])) return { ok: false, motivo: 'almacenamiento' }
    return { ok: true, ticket }
}

function modificar(codigo, transformar) {
    const nuevos = cargar().map((t) => (t.codigo === codigo ? transformar(t) : t))
    return actualizar(nuevos)
}

export function agregarComentario(codigo, usuario, texto) {
    const ahora = new Date().toISOString()
    return modificar(codigo, (t) => ({
        ...t,
        bitacora: [
            ...t.bitacora,
            { id: codigo + '-b' + t.bitacora.length, autor: nombreCompleto(usuario), rol: usuario.rol, texto: texto.trim(), tipo: 'publico', fecha: ahora },
        ],
    }))
}

export function cancelarTicket(codigo, usuario) {
    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket || !puedeCancelar(ticket)) return { ok: false, motivo: 'no_cancelable' }

    const ahora = new Date().toISOString()
    const guardado = modificar(codigo, (t) => ({
        ...t,
        estado: 'cancelado',
        historial: [...t.historial, { tipo: 'cancelado', autor: nombreCompleto(usuario), fecha: ahora }],
    }))
    return guardado ? { ok: true } : { ok: false, motivo: 'almacenamiento' }
}

export function reabrirTicket(codigo, usuario, motivo) {
    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket || ticket.estado !== 'cerrado') return { ok: false, motivo: 'no_cerrado' }
    if (!puedeReabrir(ticket)) return { ok: false, motivo: 'fuera_de_plazo' }

    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)
    const guardado = modificar(codigo, (t) => ({
        ...t,
        estado: 'reabierto',
        cerradoEn: null,
        encuestaPendiente: false,
        bitacora: [
            ...t.bitacora,
            { id: codigo + '-b' + t.bitacora.length, autor, rol: 'usuario', texto: 'Reapertura: ' + motivo.trim(), tipo: 'publico', fecha: ahora },
        ],
        historial: [...t.historial, { tipo: 'reabierto', autor, fecha: ahora }],
    }))
    return guardado ? { ok: true } : { ok: false, motivo: 'almacenamiento' }
}
