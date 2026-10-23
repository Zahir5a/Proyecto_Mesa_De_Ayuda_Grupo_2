// Periodos que se pueden elegir en el tablero, la carga por técnico y la satisfacción (HU-6 y HU-7).

const DIA = 86400000

export const PERIODOS = [
    { id: '7', nombre: 'Últimos 7 días', dias: 7 },
    { id: '30', nombre: 'Últimos 30 días', dias: 30 },
    { id: '90', nombre: 'Últimos 90 días', dias: 90 },
    { id: 'todo', nombre: 'Todo el historial', dias: null },
    { id: 'rango', nombre: 'Rango de fechas…', dias: null },
]

// seleccion: { id, desde, hasta } con fechas "AAAA-MM-DD" (solo si id es "rango").
// Devuelve { desde, hasta } como fechas, o null en los extremos abiertos.
export function rangoDe(seleccion, ahora) {
    const periodo = PERIODOS.find((p) => p.id === seleccion.id)
    if (periodo.dias) return { desde: new Date(ahora - periodo.dias * DIA), hasta: new Date(ahora) }
    if (seleccion.id === 'rango') {
        return {
            desde: seleccion.desde ? new Date(seleccion.desde + 'T00:00:00') : null,
            hasta: seleccion.hasta ? new Date(seleccion.hasta + 'T23:59:59') : null,
        }
    }
    return { desde: null, hasta: null }
}

// El periodo de igual duración justo antes (para comparar "frente al periodo anterior"); null si no se puede.
export function rangoAnterior(rango) {
    if (!rango.desde || !rango.hasta) return null
    const duracion = rango.hasta - rango.desde
    return { desde: new Date(rango.desde - duracion), hasta: new Date(rango.desde) }
}

export function dentroDe(fecha, rango) {
    const t = new Date(fecha)
    if (rango.desde && t < rango.desde) return false
    if (rango.hasta && t > rango.hasta) return false
    return true
}
