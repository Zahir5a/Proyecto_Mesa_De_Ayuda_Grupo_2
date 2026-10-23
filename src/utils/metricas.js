import { estaEnCurso } from '../services/ticketsService'
import { dentroDe } from './periodos'
import { horasDeAtencion } from './etapas'
import { fueraDePlazo, horasEsperadas } from './tiempos'

// Cálculos del tablero y de la carga por técnico (HU-7). Reciben los tickets y devuelven números;
// las pantallas solo los dibujan.

export function ticketsDelPeriodo(tickets, rango) {
    return tickets.filter((t) => dentroDe(t.registradoEn, rango))
}

const atendidos = (tickets) => tickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado')

// Minutos de atención de un ticket ya atendido (sin contar las esperas).
export function minutosDeAtencion(ticket, ahora) {
    const horas = ticket.tiempoTotalAtencion ?? horasDeAtencion(ticket, ahora)
    return horas * 60
}

// Promedio en minutos de los tickets resueltos o cerrados; null si todavía no hay ninguno.
export function tiempoPromedioAtencion(tickets, ahora) {
    const lista = atendidos(tickets)
    if (lista.length === 0) return null
    return lista.reduce((suma, t) => suma + minutosDeAtencion(t, ahora), 0) / lista.length
}

// Tickets que se pasaron del tiempo esperado: los atendidos que tardaron más y los que siguen en curso con plazo vencido.
export function fueraDelTiempoEsperado(tickets, categorias, ahora) {
    return tickets.filter((t) => {
        if (estaEnCurso(t)) return fueraDePlazo(t, categorias, ahora)
        if (t.estado === 'resuelto' || t.estado === 'cerrado') {
            return minutosDeAtencion(t, ahora) / 60 > horasEsperadas(t, categorias)
        }
        return false
    })
}

const ESTADOS_DEL_TABLERO = [
    { id: 'abierto', nombre: 'Abierto', estados: ['abierto', 'reabierto'], color: 'var(--info)' },
    { id: 'en_atencion', nombre: 'En atención', estados: ['en_atencion'], color: 'var(--warning)' },
    { id: 'en_espera', nombre: 'En espera', estados: ['en_espera'], color: 'var(--text-muted)' },
    { id: 'cerrado', nombre: 'Resuelto y cerrado', estados: ['resuelto', 'cerrado'], color: 'var(--success)' },
    { id: 'cancelado', nombre: 'Cancelado', estados: ['cancelado'], color: 'var(--border)' },
]

export function distribucionPorEstado(tickets) {
    return ESTADOS_DEL_TABLERO
        .map((g) => ({ ...g, valor: tickets.filter((t) => g.estados.includes(t.estado)).length }))
        .filter((g) => g.valor > 0)
}

// Cuenta tickets por un campo (categoriaId, ambiente…), de mayor a menor.
export function contarPor(tickets, campo) {
    const cuenta = new Map()
    for (const t of tickets) cuenta.set(t[campo], (cuenta.get(t[campo]) ?? 0) + 1)
    return [...cuenta.entries()].map(([clave, valor]) => ({ clave, valor })).sort((a, b) => b.valor - a.valor)
}

// Variación porcentual frente al periodo anterior; null si no hay con qué comparar.
export function variacion(actual, anterior) {
    if (anterior === null || anterior === 0) return null
    return Math.round(((actual - anterior) / anterior) * 100)
}

// Carga de cada técnico: lo que lleva ahora y lo que resolvió en el periodo.
export function cargaPorTecnico(tickets, tecnicoId, rango, ahora) {
    const propios = tickets.filter((t) => t.tecnicoId === tecnicoId)
    const resueltos = atendidos(propios).filter((t) => dentroDe(t.resueltoEn ?? t.cerradoEn ?? t.registradoEn, rango))
    return {
        asignados: propios.filter(estaEnCurso).length,
        resueltos: resueltos.length,
        enEspera: propios.filter((t) => t.estado === 'en_espera').length,
        tiempoPromedio: tiempoPromedioAtencion(resueltos, ahora),
    }
}
