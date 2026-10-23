export function formatearHora(valor) {
    return new Date(valor).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatearFecha(valor) {
    return new Date(valor).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
