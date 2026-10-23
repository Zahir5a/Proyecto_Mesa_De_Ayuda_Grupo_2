import { useSyncExternalStore } from 'react'
import { obtenerEncuestas, suscribir } from '../services/encuestasService'

// Devuelve todas las encuestas y se vuelve a dibujar cuando alguien las cambia.
export function useEncuestas() {
    return useSyncExternalStore(suscribir, obtenerEncuestas)
}
