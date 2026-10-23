import { useCallback, useMemo, useState } from 'react'
import { PRIORIDADES } from '../data/contenidoPublico'
import { nombreEstado } from '../data/tickets'
import { buscarTecnico } from '../services/catalogoService'
import { estaEnCurso } from '../services/ticketsService'
import { fueraDePlazo } from '../utils/tiempos'

export const FILAS_POR_PAGINA = 10

const INICIALES = { texto: '', prioridad: 'todas', estado: 'en_curso', categoriaId: 'todas', ambiente: 'todos', tecnicoId: 'todos' }
const SIN_FILTROS = { ...INICIALES, estado: 'todos' }

const ordenPrioridad = (id) => PRIORIDADES.findIndex((p) => p.id === id)
const masAntiguo = (a, b) => new Date(a.registradoEn) - new Date(b.registradoEn)

// Milisegundos que lleva un ticket esperando que alguien lo atienda (solo los que aún no están en atención).
function esperaSinAtencion(ticket, ahora) {
    if (ticket.estado !== 'abierto' && ticket.estado !== 'reabierto') return 0
    return ahora - new Date(ticket.registradoEn)
}

// Filtros, orden, paginación y selección de la cola de atención. No toca datos: recibe los tickets.
export function useCola(tickets, categorias, ahora, inicial = {}) {
    const [filtros, setFiltros] = useState({ ...INICIALES, ...inicial })
    const [orden, setOrden] = useState('antiguedad')
    const [pagina, setPagina] = useState(1)
    const [seleccion, setSeleccion] = useState(() => new Set())

    const limpiarSeleccion = useCallback(() => setSeleccion(new Set()), [])

    const cambiarFiltro = useCallback((clave, valor) => {
        setFiltros((f) => ({ ...f, [clave]: valor }))
        setPagina(1)
        setSeleccion(new Set())
    }, [])

    const limpiarFiltros = useCallback(() => {
        setFiltros(SIN_FILTROS)
        setPagina(1)
        setSeleccion(new Set())
    }, [])

    const filtrados = useMemo(() => {
        const texto = filtros.texto.trim().toLowerCase()
        const comparar = {
            antiguedad: masAntiguo,
            reciente: (a, b) => masAntiguo(b, a),
            prioridad: (a, b) => ordenPrioridad(a.prioridad) - ordenPrioridad(b.prioridad) || masAntiguo(a, b),
            sin_atencion: (a, b) => esperaSinAtencion(b, ahora) - esperaSinAtencion(a, ahora) || masAntiguo(a, b),
        }[orden]

        return tickets
            .filter((t) => {
                if (texto && ![t.codigo, t.asunto, t.solicitante].some((campo) => campo.toLowerCase().includes(texto))) return false
                if (filtros.prioridad !== 'todas' && t.prioridad !== filtros.prioridad) return false
                if (filtros.estado === 'en_curso' && !estaEnCurso(t)) return false
                if (!['en_curso', 'todos'].includes(filtros.estado) && t.estado !== filtros.estado) return false
                if (filtros.categoriaId !== 'todas' && t.categoriaId !== filtros.categoriaId) return false
                if (filtros.ambiente !== 'todos' && t.ambiente !== filtros.ambiente) return false
                if (filtros.tecnicoId === 'sin_asignar' && t.tecnicoId) return false
                if (!['todos', 'sin_asignar'].includes(filtros.tecnicoId) && t.tecnicoId !== filtros.tecnicoId) return false
                return true
            })
            .sort(comparar)
    }, [tickets, filtros, orden, ahora])

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / FILAS_POR_PAGINA))
    const paginaActual = Math.min(pagina, totalPaginas)
    const filasPagina = filtrados.slice((paginaActual - 1) * FILAS_POR_PAGINA, paginaActual * FILAS_POR_PAGINA)

    const seleccionados = useMemo(() => tickets.filter((t) => seleccion.has(t.codigo)), [tickets, seleccion])

    const alternar = useCallback((codigo) => setSeleccion((previa) => {
        const nueva = new Set(previa)
        if (nueva.has(codigo)) nueva.delete(codigo)
        else nueva.add(codigo)
        return nueva
    }), [])

    const paginaCompletaSeleccionada = filasPagina.length > 0 && filasPagina.every((t) => seleccion.has(t.codigo))
    const alternarPagina = useCallback(() => setSeleccion((previa) => {
        const nueva = new Set(previa)
        if (filasPagina.every((t) => nueva.has(t.codigo))) filasPagina.forEach((t) => nueva.delete(t.codigo))
        else filasPagina.forEach((t) => nueva.add(t.codigo))
        return nueva
    }), [filasPagina])

    const resumen = useMemo(() => {
        const enCurso = tickets.filter(estaEnCurso)
        const hoy = new Date(ahora).toDateString()
        return {
            abiertos: tickets.filter((t) => t.estado === 'abierto').length,
            en_atencion: tickets.filter((t) => t.estado === 'en_atencion').length,
            en_espera: tickets.filter((t) => t.estado === 'en_espera').length,
            resuelto: tickets.filter((t) => t.estado === 'resuelto' && t.resueltoEn && new Date(t.resueltoEn).toDateString() === hoy).length,
            enCola: enCurso.length,
            sinAsignar: enCurso.filter((t) => !t.tecnicoId).length,
            fueraDePlazo: tickets.filter((t) => fueraDePlazo(t, categorias, ahora)).length,
        }
    }, [tickets, categorias, ahora])

    // Filtros activos, cada uno se puede quitar con ×
    const chips = useMemo(() => {
        const lista = []
        if (filtros.texto.trim()) lista.push({ clave: 'texto', texto: `Búsqueda: ${filtros.texto.trim()}`, vacio: '' })
        if (filtros.prioridad !== 'todas') lista.push({ clave: 'prioridad', texto: `Prioridad: ${PRIORIDADES.find((p) => p.id === filtros.prioridad).nombre.toLowerCase()}`, vacio: 'todas' })
        if (filtros.estado !== 'todos') lista.push({ clave: 'estado', texto: `Estado: ${filtros.estado === 'en_curso' ? 'en curso' : nombreEstado(filtros.estado).toLowerCase()}`, vacio: 'todos' })
        if (filtros.categoriaId !== 'todas') lista.push({ clave: 'categoriaId', texto: `Categoría: ${(categorias.find((c) => c.id === filtros.categoriaId) ?? { nombre: filtros.categoriaId }).nombre}`, vacio: 'todas' })
        if (filtros.ambiente !== 'todos') lista.push({ clave: 'ambiente', texto: `Ambiente: ${filtros.ambiente}`, vacio: 'todos' })
        if (filtros.tecnicoId === 'sin_asignar') lista.push({ clave: 'tecnicoId', texto: 'Técnico: sin asignar', vacio: 'todos' })
        else if (filtros.tecnicoId !== 'todos') {
            const tecnico = buscarTecnico(filtros.tecnicoId)
            lista.push({ clave: 'tecnicoId', texto: `Técnico: ${tecnico ? tecnico.nombres + ' ' + tecnico.apellidos : filtros.tecnicoId}`, vacio: 'todos' })
        }
        return lista
    }, [filtros, categorias])

    return {
        filtros, cambiarFiltro, limpiarFiltros, chips, orden, setOrden,
        pagina: paginaActual, setPagina, filasPagina, total: filtrados.length,
        seleccion, seleccionados, alternar, alternarPagina, paginaCompletaSeleccionada, limpiarSeleccion,
        resumen,
    }
}
