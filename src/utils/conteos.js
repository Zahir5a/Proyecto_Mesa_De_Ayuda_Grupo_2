import { estaEnCurso } from '../services/ticketsService'

// El catálogo (HU-2) muestra cuántos tickets en curso tiene cada categoría, subcategoría y ambiente.
// Esos números salen de los tickets reales (HU-3 y HU-4), no de los que trae el catálogo guardado.

export function categoriasConAbiertos(categorias, tickets) {
    const enCurso = tickets.filter(estaEnCurso)
    return categorias.map((c) => ({
        ...c,
        ticketsAbiertos: enCurso.filter((t) => t.categoriaId === c.id).length,
        subcategorias: c.subcategorias.map((s) => ({
            ...s,
            ticketsAbiertos: enCurso.filter((t) => t.subcategoriaId === s.id).length,
        })),
    }))
}

export function ambientesConAbiertos(ambientes, tickets) {
    const enCurso = tickets.filter(estaEnCurso)
    return ambientes.map((a) => ({ ...a, ticketsAbiertos: enCurso.filter((t) => t.ambiente === a.codigo).length }))
}
