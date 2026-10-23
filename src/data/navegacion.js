// Mapa de navegación por rol (mockups: "Mapa de navegación").
// `contador` es la clave del número que se muestra junto a la opción (sale de `usuario.resumen`);
// `lista` marca las pantallas que ya existen (las demás muestran "En construcción").
// `permiso` es cómo se nombra la sección en el aviso de acceso denegado.

export const ETIQUETA_ROL = {
    usuario: 'Usuario',
    tecnico: 'Técnico',
    supervisor: 'Supervisor',
}

export const MENU_POR_ROL = {
    usuario: {
        titulo: 'Mis servicios',
        insignia: { etiqueta: 'Mis tickets abiertos', clave: 'ticketsAbiertos' },
        items: [
            { ruta: '/usuario', etiqueta: 'Inicio', permiso: 'el inicio de usuario' },
            { ruta: '/usuario/nuevo-ticket', etiqueta: 'Nuevo ticket', permiso: 'el registro de tickets', lista: true },
            { ruta: '/usuario/tickets', etiqueta: 'Mis tickets', contador: 'ticketsReportados', permiso: 'tus tickets', lista: true },
            { ruta: '/usuario/encuesta-pendiente', etiqueta: 'Encuesta pendiente', contador: 'encuestaPendiente', permiso: 'la encuesta pendiente' },
            { ruta: '/usuario/encuestas', etiqueta: 'Mis encuestas', contador: 'encuestasRespondidas', permiso: 'tus encuestas' },
            { ruta: '/cuenta', etiqueta: 'Mi cuenta', permiso: 'tu cuenta' },
        ],
    },
    tecnico: {
        titulo: 'Atención',
        insignia: { etiqueta: 'Asignados a mí', clave: 'asignados' },
        items: [
            { ruta: '/tecnico', etiqueta: 'Mi bandeja', contador: 'asignados', permiso: 'la bandeja del técnico', lista: true },
            { ruta: '/tecnico/en-atencion', etiqueta: 'En atención', contador: 'enAtencion', permiso: 'los tickets en atención', lista: true },
            { ruta: '/tecnico/en-espera', etiqueta: 'En espera', contador: 'enEspera', permiso: 'los tickets en espera', lista: true },
            { ruta: '/tecnico/resueltos', etiqueta: 'Resueltos hoy', contador: 'resueltosHoy', permiso: 'los tickets resueltos', lista: true },
            { ruta: '/tecnico/historial', etiqueta: 'Historial', permiso: 'el historial de cambios', lista: true },
            { ruta: '/cuenta', etiqueta: 'Mi cuenta', permiso: 'tu cuenta' },
        ],
    },
    supervisor: {
        titulo: 'Supervisión',
        insignia: { etiqueta: 'Cola sin asignar', clave: 'colaSinAsignar' },
        items: [
            { ruta: '/supervisor', etiqueta: 'Tablero', permiso: 'el tablero de métricas' },
            { ruta: '/supervisor/cola', etiqueta: 'Cola de atención', contador: 'cola', permiso: 'la cola de atención', lista: true },
            { ruta: '/supervisor/bandejas', etiqueta: 'Bandejas de técnicos', contador: 'bandejas', permiso: 'las bandejas de técnicos', lista: true },
            { ruta: '/supervisor/categorias', etiqueta: 'Categorías', contador: 'categorias', permiso: 'el catálogo de categorías', lista: true },
            { ruta: '/supervisor/ambientes', etiqueta: 'Sedes y ambientes', contador: 'ambientes', permiso: 'las sedes y ambientes', lista: true },
            { ruta: '/supervisor/tecnicos-categoria', etiqueta: 'Técnicos por categoría', permiso: 'los técnicos por categoría', lista: true },
            { ruta: '/supervisor/satisfaccion', etiqueta: 'Satisfacción', permiso: 'la satisfacción por técnico' },
            { ruta: '/supervisor/carga', etiqueta: 'Carga por técnico', permiso: 'la carga por técnico' },
            { ruta: '/supervisor/usuarios', etiqueta: 'Usuarios', contador: 'usuarios', permiso: 'la gestión de usuarios' },
        ],
    },
}

// Qué recursos son exclusivos de cada rol (texto de la pantalla de acceso denegado).
export const EXCLUSIVO_DE = {
    usuario: 'El registro y el seguimiento de tickets son exclusivos de los usuarios.',
    tecnico: 'La bandeja, la bitácora y el cierre de tickets son exclusivos del técnico.',
    supervisor: 'La cola, la asignación y el catálogo de servicios son exclusivos del supervisor.',
}

// Botón principal de la pantalla de acceso denegado: devuelve a cada rol a su zona.
export const ACCESO_PRINCIPAL = {
    usuario: { etiqueta: 'Ir a mis tickets', ruta: '/usuario/tickets' },
    tecnico: { etiqueta: 'Ir a mi bandeja', ruta: '/tecnico' },
    supervisor: { etiqueta: 'Ir al tablero', ruta: '/supervisor' },
}

export function rutaInicio(rol) {
    if (rol === 'usuario') return '/usuario'
    else if (rol === 'tecnico') return '/tecnico'
    else if (rol === 'supervisor') return '/supervisor'
    return '/'
}

// Detalle de un ticket según el rol de quien lo busca.
export function rutaTicket(rol, codigo) {
    if (rol === 'supervisor') return '/supervisor/cola/' + codigo
    return '/' + rol + '/tickets/' + codigo
}

// Busca la opción de menú de un rol cuya ruta coincide con la dirección.
export function buscarItem(rol, ruta) {
    const menu = MENU_POR_ROL[rol]
    return menu ? menu.items.find((item) => item.ruta === ruta) : undefined
}
