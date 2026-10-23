// Horas hábiles en las que se espera atender un ticket: las de su subcategoría si conserva la
// prioridad de la subcategoría; si el usuario cambió la prioridad, las de esa prioridad.
export function horasEsperadas(ticket, categorias, prioridades) {
    const categoria = categorias.find((c) => c.id === ticket.categoriaId)
    const sub = categoria ? categoria.subcategorias.find((s) => s.id === ticket.subcategoriaId) : undefined

    if (sub && sub.prioridad === ticket.prioridad) return sub.tiempoEsperado
    return prioridades.find((p) => p.id === ticket.prioridad).horas
}
