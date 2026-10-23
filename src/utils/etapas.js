// Etapas de un ticket (HU-5): cuánto tiempo estuvo en cada estado, según su historial.

const ESTADOS_DEL_FLUJO = ['abierto', 'reabierto', 'en_atencion', 'en_espera', 'resuelto', 'cerrado', 'cancelado']
const MINUTO = 60000

// Una etapa por cada cambio de estado; dura hasta el siguiente cambio (o hasta ahora si sigue en curso).
function etapasDe(ticket, ahora = Date.now()) {
    const cambios = ticket.historial
        .filter((e) => ESTADOS_DEL_FLUJO.includes(e.tipo))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    return cambios.map((e, i) => {
        const terminal = e.tipo === 'cerrado' || e.tipo === 'cancelado'
        const fin = cambios[i + 1] ? new Date(cambios[i + 1].fecha).getTime() : ahora
        return { ...e, ms: terminal ? 0 : Math.max(0, fin - new Date(e.fecha).getTime()) }
    })
}

// Minutos acumulados por grupo de estados (para las barras de "Tiempo por etapa").
export function minutosPorEtapa(ticket, ahora = Date.now()) {
    const suma = { abierto: 0, en_atencion: 0, en_espera: 0, resuelto: 0 }
    for (const e of etapasDe(ticket, ahora)) {
        const grupo = e.tipo === 'reabierto' ? 'abierto' : e.tipo
        if (grupo in suma) suma[grupo] += e.ms / MINUTO
    }
    return suma
}

// Tiempo de atención: lo que estuvo en atención o resuelto, sin contar las esperas.
export function horasDeAtencion(ticket, ahora = Date.now()) {
    const { en_atencion: atencion, resuelto } = minutosPorEtapa(ticket, ahora)
    return (atencion + resuelto) / 60
}

// Porcentaje del tiempo total que el ticket estuvo en espera (0 si aún no hay tiempo registrado).
export function porcentajeEnEspera(ticket, ahora = Date.now()) {
    const minutos = minutosPorEtapa(ticket, ahora)
    const total = minutos.abierto + minutos.en_atencion + minutos.en_espera + minutos.resuelto
    return total === 0 ? 0 : Math.round((minutos.en_espera / total) * 100)
}

// "1 d 6 h 12 min", "3 h 24 min", "46 min"
export function formatearTiempo(minutos) {
    const total = Math.max(0, Math.round(minutos))
    const dias = Math.floor(total / 1440)
    const horas = Math.floor((total % 1440) / 60)
    const resto = total % 60
    if (dias > 0) return `${dias} d ${horas} h ${resto} min`
    if (horas > 0) return `${horas} h ${resto} min`
    return `${resto} min`
}

// Todos los eventos del ticket (cambios de estado, asignaciones, prioridad…) en orden, cada uno con el
// tiempo que pasó hasta el siguiente. Es lo que se ve en "Historial de cambios".
export function lineaDeTiempo(ticket, ahora = Date.now()) {
    const eventos = [...ticket.historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    return eventos.map((e, i) => {
        const terminal = e.tipo === 'cerrado' || e.tipo === 'cancelado'
        const fin = eventos[i + 1] ? new Date(eventos[i + 1].fecha).getTime() : ahora
        return { ...e, ms: terminal ? 0 : Math.max(0, fin - new Date(e.fecha).getTime()) }
    })
}
