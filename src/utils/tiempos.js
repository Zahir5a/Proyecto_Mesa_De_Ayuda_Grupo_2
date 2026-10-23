import { PRIORIDADES } from '../data/contenidoPublico'
import { calcularLimite } from './plazos'

// Horas hábiles en las que se espera atender un ticket: las de su subcategoría si conserva la
// prioridad de la subcategoría; si cambió la prioridad, las de esa prioridad.
export function horasEsperadas(ticket, categorias, prioridades = PRIORIDADES) {
    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    const sub = categoria ? categoria.subcategorias.find((s) => s.id === ticket.subcategoriaId) : undefined

    if (sub && sub.prioridad === ticket.prioridad) return sub.tiempoEsperado
    return prioridades.find((p) => p.id === ticket.prioridad).horas
}

// Momento límite para atender el ticket, contado desde que se registró.
export function limiteDe(ticket, categorias) {
    return calcularLimite(ticket.registradoEn, horasEsperadas(ticket, categorias))
}

export function minutosRestantes(ticket, categorias, ahora) {
    return (limiteDe(ticket, categorias) - ahora) / 60000
}

// Un ticket en espera no corre contra el tiempo esperado.
export function fueraDePlazo(ticket, categorias, ahora) {
    return ['abierto', 'en_atencion', 'reabierto'].includes(ticket.estado) && minutosRestantes(ticket, categorias, ahora) < 0
}

// "1 h 05 min", "42 min"
export function formatearDuracion(minutos) {
    const min = Math.max(0, Math.round(minutos))
    if (min < 60) return `${min} min`
    const horas = Math.floor(min / 60)
    return `${horas} h ${String(min % 60).padStart(2, '0')} min`
}

// Texto de la columna "Plazo" de la bandeja del técnico.
export function textoPlazo(ticket, categorias, ahora, formatearFecha) {
    if (ticket.estado === 'resuelto') return { texto: 'Atendido a tiempo', vencido: false }
    if (ticket.estado === 'cerrado') return { texto: `Cerrado el ${formatearFecha(ticket.cerradoEn)}`, vencido: false }
    if (ticket.estado === 'en_espera') {
        const retorno = ticket.retornoEstimado ? ` · retorno ${formatearFecha(ticket.retornoEstimado)}` : ''
        return { texto: `${ticket.motivoEspera || 'En espera'}${retorno}`, vencido: false }
    }
    const restante = minutosRestantes(ticket, categorias, ahora)
    return restante >= 0
        ? { texto: `Vence en ${formatearDuracion(restante)}`, vencido: false }
        : { texto: `Vencido hace ${formatearDuracion(-restante)}`, vencido: true }
}
