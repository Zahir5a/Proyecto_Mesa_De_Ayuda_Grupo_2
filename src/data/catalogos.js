export const UNIDADES = [
    { valor: 'Ingeniería de Sistemas', etiqueta: 'Ingeniería de Sistemas' },
    { valor: 'Ingeniería Industrial', etiqueta: 'Ingeniería Industrial' },
    { valor: 'Derecho', etiqueta: 'Derecho' },
    { valor: 'Psicología', etiqueta: 'Psicología' },
    { valor: 'Administración', etiqueta: 'Administración' },
    { valor: 'Arquitectura', etiqueta: 'Arquitectura' },
    { valor: 'Comunicaciones', etiqueta: 'Comunicaciones' },
    { valor: 'Infraestructura y Servicios', etiqueta: 'Infraestructura y Servicios' },
]

// Ambientes frecuentes para "Ambiente habitual" en Mi cuenta. Los administra HU-2 (sedes y ambientes).
export const AMBIENTES = ['A-201', 'A-305', 'E-304', 'H-105', 'H-210', 'N-402', 'Q-101', 'BIB-P2', 'AUD-CEN', 'L-108'].map(
    (codigo) => ({ valor: codigo, etiqueta: codigo })
)

export const VINCULOS = [
    { valor: 'alumno', etiqueta: 'Alumno/a' },
    { valor: 'docente', etiqueta: 'Docente' },
    { valor: 'administrativo', etiqueta: 'Administrativo' },
]

// Categorías de servicio. Las administra HU-2 (catálogo); aquí solo se leen
// para que un técnico declare su especialidad al activar su cuenta.
export const CATEGORIAS = [
    { id: 'audiovisuales', nombre: 'Audiovisuales' },
    { id: 'redes', nombre: 'Redes y conectividad' },
    { id: 'climatizacion', nombre: 'Climatización' },
    { id: 'electrico', nombre: 'Eléctrico' },
    { id: 'mobiliario', nombre: 'Mobiliario' },
    { id: 'limpieza', nombre: 'Limpieza' },
    { id: 'accesos', nombre: 'Accesos y cerraduras' },
]

export const MAX_ESPECIALIDADES = 3

export function nombreCategoria(id) {
    const categoria = CATEGORIAS.find((c) => c.id === id)
    return categoria ? categoria.nombre : id
}
