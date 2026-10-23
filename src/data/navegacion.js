export const MENU_POR_ROL = {
    usuario: [
        { ruta: '/usuario', etiqueta: 'Inicio' },
        { ruta: '/usuario/nuevo-ticket', etiqueta: 'Nuevo ticket' },
        { ruta: '/usuario/tickets', etiqueta: 'Mis tickets' },
        { ruta: '/usuario/encuestas', etiqueta: 'Mis encuestas' },
    ],
    tecnico: [
        { ruta: '/tecnico', etiqueta: 'Mi bandeja' },
        { ruta: '/tecnico/historial', etiqueta: 'Historial' },
    ],
    supervisor: [
        { ruta: '/supervisor', etiqueta: 'Tablero' },
        { ruta: '/supervisor/cola', etiqueta: 'Cola de atención' },
        { ruta: '/supervisor/categorias', etiqueta: 'Categorías' },
        { ruta: '/supervisor/usuarios', etiqueta: 'Usuarios' },
    ],
}

export const ETIQUETA_ROL = {
    usuario: 'Usuario',
    tecnico: 'Técnico',
    supervisor: 'Supervisor',
}

export function rutaInicio(rol) {
    if (rol === 'usuario') return '/usuario'
    else if (rol === 'tecnico') return '/tecnico'
    else if (rol === 'supervisor') return '/supervisor'
    return '/'
}