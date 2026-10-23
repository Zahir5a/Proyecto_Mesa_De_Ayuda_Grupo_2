import { obtenerCatalogo } from '../services/catalogoService'

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

export const VINCULOS = [
    { valor: 'alumno', etiqueta: 'Alumno/a' },
    { valor: 'docente', etiqueta: 'Docente' },
    { valor: 'administrativo', etiqueta: 'Administrativo' },
]

export const MAX_ESPECIALIDADES = 3

// Nombre de una categoría del catálogo (HU-2) a partir de su id.
export function nombreCategoria(id) {
    const categoria = obtenerCatalogo().categorias.find((c) => c.id === id)
    return categoria ? categoria.nombre : id
}
