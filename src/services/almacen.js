export function leer(nombre, defecto) {
    try {
        const texto = localStorage.getItem('mda.' + nombre)
        return texto ? JSON.parse(texto) : defecto
    } catch {
        return defecto
    }
}

export function guardar(nombre, valor) {
    try {
        localStorage.setItem('mda.' + nombre, JSON.stringify(valor))
    } catch {
        // sin almacenamiento disponible
    }
}

export function borrar(nombre) {
    try {
        localStorage.removeItem('mda.' + nombre)
    } catch {
        // sin almacenamiento disponible
    }
}
