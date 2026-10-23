import semilla from '../data/encuestas.json'
import { PLAZO_REAPERTURA_DIAS } from '../data/tickets'
import { guardar, leer } from './almacen'
import { buscarTicket, marcarEncuestaRespondida, obtenerTickets } from './ticketsService'
import { sumarDias } from '../utils/plazos'

// Encuestas de satisfacción (HU-6). Una sola respuesta por ticket cerrado; se puede editar hasta
// 7 días después del cierre. Se guardan en el navegador y se avisa a quien las esté mirando (useEncuestas).

let encuestas = null
const oyentes = new Set()

const UN_MINUTO = 60000

// La semilla guarda las fechas como "hace N minutos" para que los plazos sigan vigentes en la demostración.
function crearSemilla() {
    const ahora = Date.now()
    const fecha = (desde) => new Date(ahora - desde * UN_MINUTO).toISOString()

    return semilla.map((e) => {
        const { respondidaHaceMin, enviadaHaceMin, ...resto } = e
        return {
            ...resto,
            respondidaEn: respondidaHaceMin === null ? null : fecha(respondidaHaceMin),
            enviadaEn: fecha(enviadaHaceMin ?? respondidaHaceMin + 60),
        }
    })
}

function cargar() {
    if (encuestas === null) encuestas = leer('encuestas', null) ?? crearSemilla()
    return encuestas
}

function actualizar(nuevas) {
    guardar('encuestas', nuevas)
    if (leer('encuestas', null) === null) return false

    encuestas = nuevas
    oyentes.forEach((avisar) => avisar())
    return true
}

export function obtenerEncuestas() {
    return cargar()
}

export function suscribir(oyente) {
    oyentes.add(oyente)
    return () => oyentes.delete(oyente)
}

// ---------- Consultas ----------

export const ASPECTOS = [
    { id: 'rapidez', nombre: 'Rapidez' },
    { id: 'trato', nombre: 'Trato del técnico' },
    { id: 'solucion', nombre: 'Solución del problema' },
]

export const ETIQUETA_PUNTAJE = { 1: 'Muy mala', 2: 'Mala', 3: 'Regular', 4: 'Buena atención', 5: 'Excelente' }

export const respondida = (e) => e.general !== null

export function encuestasDeUsuario(lista, usuarioId) {
    return lista.filter((e) => e.usuarioId === usuarioId && respondida(e))
}

export function buscarEncuesta(lista, codigo) {
    return lista.find((e) => e.codigo === codigo && e.usuarioId !== null) ?? null
}

// Último día en que el usuario puede responder o editar la encuesta de un ticket cerrado.
export function limiteEncuesta(ticket) {
    return ticket.cerradoEn ? sumarDias(ticket.cerradoEn, PLAZO_REAPERTURA_DIAS) : null
}

export function dentroDelPlazo(ticket) {
    const limite = limiteEncuesta(ticket)
    return limite !== null && new Date() <= limite
}

export function promedio(valores) {
    return valores.length === 0 ? 0 : valores.reduce((suma, v) => suma + v, 0) / valores.length
}

// ---------- Cambios ----------

function validar(valores) {
    for (const id of ['general', ...ASPECTOS.map((a) => a.id)]) {
        const v = valores[id]
        if (!Number.isInteger(v) || v < 1 || v > 5) return { campo: id, mensaje: 'Elige un puntaje de 1 a 5.' }
    }
    if ((valores.comentario ?? '').trim().length > 500) return { campo: 'comentario', mensaje: 'Usa 500 caracteres como máximo.' }
    return null
}

// valores: { general, rapidez, trato, solucion, comentario }
// Si el ticket ya tiene respuesta, la actualiza (sigue siendo una sola respuesta por ticket).
export function guardarEncuesta(codigo, valores, usuario) {
    const ticket = buscarTicket(obtenerTickets(), codigo)
    if (!ticket || ticket.usuarioId !== usuario.id) return { ok: false, mensaje: 'No encontramos ese ticket entre los tuyos.' }
    if (ticket.estado !== 'cerrado' && !ticket.encuestaPendiente) return { ok: false, mensaje: 'La encuesta se habilita cuando el ticket se cierra.' }
    if (!dentroDelPlazo(ticket)) return { ok: false, mensaje: 'Ya pasó el plazo para responder o editar esta encuesta.' }

    const error = validar(valores)
    if (error) return { ok: false, ...error }

    const lista = cargar()
    const ahora = new Date().toISOString()
    const existente = buscarEncuesta(lista, codigo)
    const datos = {
        general: valores.general,
        rapidez: valores.rapidez,
        trato: valores.trato,
        solucion: valores.solucion,
        comentario: (valores.comentario ?? '').trim(),
    }

    const nuevas = existente
        ? lista.map((e) => (e === existente ? { ...e, ...datos, respondidaEn: ahora } : e))
        : [
              {
                  codigo,
                  usuarioId: usuario.id,
                  tecnicoId: ticket.tecnicoId,
                  categoriaId: ticket.categoriaId,
                  ...datos,
                  respondidaEn: ahora,
                  enviadaEn: ticket.cerradoEn,
              },
              ...lista,
          ]

    if (!actualizar(nuevas)) return { ok: false, mensaje: 'No pudimos guardar tu encuesta. Inténtalo otra vez.' }
    marcarEncuestaRespondida(codigo)
    return { ok: true, editada: Boolean(existente) }
}

// ---------- Reportes del supervisor ----------

// periodo: { desde: Date | null, hasta: Date | null }
export function encuestasDelPeriodo(lista, periodo) {
    return lista.filter((e) => {
        const fecha = new Date(e.respondidaEn ?? e.enviadaEn)
        if (periodo.desde && fecha < periodo.desde) return false
        if (periodo.hasta && fecha > periodo.hasta) return false
        return true
    })
}

// Promedios por clave (técnico o categoría), solo con las encuestas respondidas.
export function promediosPor(lista, clave) {
    const grupos = new Map()
    for (const e of lista.filter(respondida)) {
        if (!grupos.has(e[clave])) grupos.set(e[clave], [])
        grupos.get(e[clave]).push(e)
    }
    return [...grupos.entries()].map(([id, items]) => ({
        id,
        encuestas: items.length,
        general: promedio(items.map((e) => e.general)),
        rapidez: promedio(items.map((e) => e.rapidez)),
        trato: promedio(items.map((e) => e.trato)),
        solucion: promedio(items.map((e) => e.solucion)),
        categorias: items.map((e) => e.categoriaId),
    }))
}

// Porcentaje de encuestas enviadas que ya se respondieron.
export function tasaDeRespuesta(lista) {
    return lista.length === 0 ? 0 : Math.round((lista.filter(respondida).length / lista.length) * 100)
}
