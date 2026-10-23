export function rutaInicio(rol) {
    if (rol === 'usuario') return '/usuario'
    else if (rol === 'tecnico') return '/tecnico'
    else if (rol === 'supervisor') return '/supervisor'
    return '/'
}