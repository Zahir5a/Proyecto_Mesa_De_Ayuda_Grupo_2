// Acceso al navegador: 'local' guarda aunque se cierre el navegador; 'session' solo mientras dure la pestaña.
function cajon(almacen) {
    return almacen === 'session' ? sessionStorage : localStorage
}

export function leer(nombre, defecto, almacen = 'local') {
    try {
        const texto = cajon(almacen).getItem('mda.' + nombre)
        return texto ? JSON.parse(texto) : defecto
    } catch {
        return defecto
    }
}

export function guardar(nombre, valor, almacen = 'local') {
    try {
        cajon(almacen).setItem('mda.' + nombre, JSON.stringify(valor))
    } catch {
        // sin almacenamiento disponible
    }
}

export function borrar(nombre, almacen = 'local') {
    try {
        cajon(almacen).removeItem('mda.' + nombre)
    } catch {
        // sin almacenamiento disponible
    }
}
