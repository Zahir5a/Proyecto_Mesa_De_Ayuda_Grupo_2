// Descarga una tabla como archivo CSV (se abre en Excel). `filas` es una lista de listas.

function celda(texto) {
    return '"' + String(texto ?? '').replaceAll('"', '""') + '"'
}

export function descargarCsv(nombreArchivo, filas) {
    const csv = filas.map((fila) => fila.map(celda).join(',')).join('\r\n')
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    enlace.download = nombreArchivo
    enlace.click()
    URL.revokeObjectURL(enlace.href)
}
