// Datos de las cuentas que usan la lista de usuarios y la ficha (HU-7).

export const ROLES = [
    { id: 'usuario', nombre: 'Usuario', plural: 'usuarios' },
    { id: 'tecnico', nombre: 'Técnico', plural: 'técnicos' },
    { id: 'supervisor', nombre: 'Supervisor', plural: 'supervisores' },
]

export const ESTADOS_CUENTA = [
    { id: 'activo', nombre: 'Activo' },
    { id: 'bloqueado', nombre: 'Bloqueado' },
    { id: 'inactivo', nombre: 'Inactivo' },
]

// Qué mostrar en "Unidad o especialidad": las especialidades del técnico, o la unidad (con el vínculo docente) de las demás cuentas.
export function unidadOEspecialidad(cuenta, nombreCategoria) {
    if (cuenta.rol === 'tecnico' && cuenta.especialidades && cuenta.especialidades.length > 0) {
        return cuenta.especialidades.map(nombreCategoria).join(' · ')
    }
    return cuenta.vinculo === 'docente' ? `Docente · ${cuenta.unidad}` : cuenta.unidad
}
