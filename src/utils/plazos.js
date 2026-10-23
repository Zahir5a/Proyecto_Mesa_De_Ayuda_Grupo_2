// Cálculo de plazos de atención. Las horas "hábiles" son las del horario de la mesa de ayuda:
// de lunes a sábado, de 07:00 a 21:00 (ver CONTACTO.horario).

const HORA_INICIO = 7
const HORA_FIN = 21

function aVentana(fecha) {
    const t = new Date(fecha)
    if (t.getDay() === 0 || t.getHours() >= HORA_FIN) {
        // domingo o ya cerró: abre el siguiente día hábil
        t.setDate(t.getDate() + 1)
        t.setHours(HORA_INICIO, 0, 0, 0)
        return aVentana(t)
    }
    if (t.getHours() < HORA_INICIO) t.setHours(HORA_INICIO, 0, 0, 0)
    return t
}

// Momento límite para atender un ticket registrado en `inicio`, dentro de `horas` hábiles.
export function calcularLimite(inicio, horas) {
    let t = aVentana(inicio)
    let pendiente = horas * 60

    while (true) {
        const cierre = new Date(t)
        cierre.setHours(HORA_FIN, 0, 0, 0)
        const disponible = (cierre - t) / 60000

        if (pendiente <= disponible) return new Date(t.getTime() + pendiente * 60000)

        pendiente -= disponible
        t = new Date(t)
        t.setDate(t.getDate() + 1)
        t.setHours(HORA_INICIO, 0, 0, 0)
        t = aVentana(t)
    }
}

export function sumarDias(fecha, dias) {
    const t = new Date(fecha)
    t.setDate(t.getDate() + dias)
    return t
}

// "hace 18 minutos", "hace 3 horas", "hace 2 días"
export function tiempoRelativo(fecha, ahora = new Date()) {
    const minutos = Math.max(0, Math.round((ahora - new Date(fecha)) / 60000))
    if (minutos < 1) return 'hace un momento'
    if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
    const horas = Math.floor(minutos / 60)
    if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
    const dias = Math.floor(horas / 24)
    return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
}
