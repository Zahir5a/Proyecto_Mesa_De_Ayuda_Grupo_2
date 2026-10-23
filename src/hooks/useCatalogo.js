import { useSyncExternalStore } from 'react'
import { obtenerCatalogo, suscribir } from '../services/catalogoService'

// Devuelve el catálogo y se vuelve a dibujar cuando alguien lo cambia (otra pantalla o el menú).
export function useCatalogo() {
    return useSyncExternalStore(suscribir, obtenerCatalogo)
}
