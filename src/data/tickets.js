// Constantes de los tickets (HU-3). Los estados siguen el flujo del enunciado: abierto, en atención,
// en espera, resuelto y cerrado; además un ticket puede cancelarse o reabrirse.

export const ESTADOS = [
    { id: 'abierto', nombre: 'Abierto' },
    { id: 'en_atencion', nombre: 'En atención' },
    { id: 'en_espera', nombre: 'En espera' },
    { id: 'resuelto', nombre: 'Resuelto' },
    { id: 'cerrado', nombre: 'Cerrado' },
    { id: 'reabierto', nombre: 'Reabierto' },
    { id: 'cancelado', nombre: 'Cancelado' },
]

// "En curso" = todavía requiere atención.
export const ESTADOS_EN_CURSO = ['abierto', 'en_atencion', 'en_espera', 'reabierto']

// Transiciones válidas de la atención (HU-5). Cerrar un ticket tiene su propia pantalla.
export const TRANSICIONES = {
    abierto: ['en_atencion'],
    reabierto: ['en_atencion'],
    en_atencion: ['en_espera', 'resuelto'],
    en_espera: ['en_atencion'],
    resuelto: [],
}

export const MAX_TEXTO = 1200
export const MAX_DESCRIPCION = 600
export const MAX_EVIDENCIA_MB = 5
export const PLAZO_REAPERTURA_DIAS = 7

export function nombreEstado(id) {
    const estado = ESTADOS.find((e) => e.id === id)
    return estado ? estado.nombre : id
}
