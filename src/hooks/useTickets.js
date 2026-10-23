import { useSyncExternalStore } from 'react'
import { obtenerTickets, suscribir } from '../services/ticketsService'

// Devuelve todos los tickets y se vuelve a dibujar cuando alguien los cambia.
export function useTickets() {
    return useSyncExternalStore(suscribir, obtenerTickets)
}
