import { PRIORIDADES } from '../data/contenidoPublico'

function nombrePrioridad(id) {
    return PRIORIDADES.find((p) => p.id === id).nombre
}

// Entre comillas, para que una coma dentro del nombre no parta la columna.
function celda(texto) {
    return '"' + String(texto).replaceAll('"', '""') + '"'
}

// Descarga el catálogo como CSV (se abre en Excel). Una fila por categoría o subcategoría.
export function exportarCatalogo(categorias) {
    const filas = [['Categoría', 'Subcategoría', 'Prioridad', 'Tiempo esperado (h hábiles)', 'Tickets abiertos', 'Estado']]

    categorias.forEach((cat) => {
        filas.push([cat.nombre, '', nombrePrioridad(cat.prioridad), cat.tiempoEsperado, cat.ticketsAbiertos, cat.estado])
        cat.subcategorias.forEach((sub) => {
            filas.push([cat.nombre, sub.nombre, nombrePrioridad(sub.prioridad), sub.tiempoEsperado, sub.ticketsAbiertos, sub.estado])
        })
    })

    const csv = filas.map((fila) => fila.map(celda).join(',')).join('\r\n')
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    enlace.download = 'catalogo-de-servicios.csv'
    enlace.click()
    URL.revokeObjectURL(enlace.href)
}
