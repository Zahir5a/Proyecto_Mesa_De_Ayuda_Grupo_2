import semillaCategorias from '../data/catalogoCategorias.json'
import semillaAmbientes from '../data/ambientes.json'
import semillaTecnicos from '../data/tecnicosCatalogo.json'
import { guardar, leer } from './almacen'
import { listarUsuarios } from './usuariosService'

// Catálogo de servicios (HU-2): categorías con sus subcategorías, ambientes y técnicos
// habilitados por categoría. Todo se guarda junto en el navegador y, cada vez que algo
// cambia, se avisa a quien esté mirando el catálogo (ver useCatalogo).

let catalogo = null
const oyentes = new Set()

function cargar() {
    if (catalogo === null) {
        catalogo = leer('catalogo', null) ?? {
            categorias: semillaCategorias.categorias,
            ambientes: semillaAmbientes,
            tecnicos: semillaTecnicos,
        }
    }
    return catalogo
}

function actualizar(cambios) {
    catalogo = { ...cargar(), ...cambios }
    guardar('catalogo', catalogo)
    oyentes.forEach((avisar) => avisar())
}

export function obtenerCatalogo() {
    return cargar()
}

export function suscribir(oyente) {
    oyentes.add(oyente)
    return () => oyentes.delete(oyente)
}

function mismoTexto(a, b) {
    return a.trim().toLowerCase() === b.trim().toLowerCase()
}

// Convierte "Punto de red caído" en "punto-de-red-caido" para usarlo como identificador.
function crearId(nombre) {
    const base = nombre
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    return base + '-' + Date.now().toString(36)
}

// ---------- Categorías y subcategorías ----------

// Una subcategoría está activa solo si ella y su categoría lo están.
export function estaActiva(categoria, padre = null) {
    return categoria.estado === 'activa' && (padre === null || padre.estado === 'activa')
}

export function buscarCategoria(id) {
    for (const categoria of cargar().categorias) {
        if (categoria.id === id) return { categoria, padre: null }
        const sub = categoria.subcategorias.find((s) => s.id === id)
        if (sub) return { categoria: sub, padre: categoria }
    }
    return null
}

export function contarCategorias(categorias = cargar().categorias) {
    return {
        categorias: categorias.length,
        activas: categorias.filter((c) => c.estado === 'activa').length,
        subcategorias: categorias.reduce((total, c) => total + c.subcategorias.length, 0),
    }
}

// Categorías que admiten tickets nuevos (y sus subcategorías activas). Las usan HU-1 y HU-3.
export function categoriasActivas() {
    return cargar()
        .categorias.filter((c) => c.estado === 'activa')
        .map((c) => ({ ...c, subcategorias: c.subcategorias.filter((s) => s.estado === 'activa') }))
}

// datos: { nombre, padreId, prioridad, tiempoEsperado, descripcion, activa }
export function crearCategoria(datos) {
    const { categorias } = cargar()
    const nombre = datos.nombre.trim()
    const padre = datos.padreId ? categorias.find((c) => c.id === datos.padreId) : null
    const hermanas = padre ? padre.subcategorias : categorias

    if (hermanas.some((c) => mismoTexto(c.nombre, nombre))) {
        return { ok: false, motivo: 'nombre_repetido' }
    }

    const nueva = {
        id: crearId(nombre),
        nombre,
        descripcion: datos.descripcion.trim(),
        prioridad: datos.prioridad,
        tiempoEsperado: Number(datos.tiempoEsperado),
        ticketsAbiertos: 0,
        estado: datos.activa ? 'activa' : 'inactiva',
    }

    if (padre) {
        actualizar({
            categorias: categorias.map((c) =>
                c.id === padre.id ? { ...c, subcategorias: [...c.subcategorias, nueva] } : c
            ),
        })
    } else {
        actualizar({ categorias: [...categorias, { ...nueva, subcategorias: [] }] })
    }
    return { ok: true, categoria: nueva }
}

// Edita los datos de una categoría o subcategoría (no cambia de lugar en el árbol).
export function editarCategoria(id, datos) {
    const encontrada = buscarCategoria(id)
    if (encontrada === null) return { ok: false, motivo: 'no_existe' }

    const nombre = datos.nombre.trim()
    const hermanas = encontrada.padre ? encontrada.padre.subcategorias : cargar().categorias
    if (hermanas.some((c) => c.id !== id && mismoTexto(c.nombre, nombre))) {
        return { ok: false, motivo: 'nombre_repetido' }
    }

    const cambios = {
        nombre,
        descripcion: datos.descripcion.trim(),
        prioridad: datos.prioridad,
        tiempoEsperado: Number(datos.tiempoEsperado),
        estado: datos.activa ? 'activa' : 'inactiva',
    }
    return reemplazar(id, (c) => ({ ...c, ...cambios }))
}

export function cambiarEstadoCategoria(id, activa) {
    return reemplazar(id, (c) => ({ ...c, estado: activa ? 'activa' : 'inactiva' }))
}

function reemplazar(id, transformar) {
    if (buscarCategoria(id) === null) return { ok: false, motivo: 'no_existe' }

    const categorias = cargar().categorias.map((c) => {
        if (c.id === id) return transformar(c)
        return { ...c, subcategorias: c.subcategorias.map((s) => (s.id === id ? transformar(s) : s)) }
    })
    actualizar({ categorias })
    return { ok: true }
}

// No se elimina lo que tiene tickets en curso: hay que desactivarlo.
export function eliminarCategoria(id) {
    const encontrada = buscarCategoria(id)
    if (encontrada === null) return { ok: false, motivo: 'no_existe' }
    if (encontrada.categoria.ticketsAbiertos > 0) return { ok: false, motivo: 'con_tickets' }

    const categorias = cargar()
        .categorias.filter((c) => c.id !== id)
        .map((c) => ({ ...c, subcategorias: c.subcategorias.filter((s) => s.id !== id) }))
    actualizar({ categorias })
    return { ok: true }
}

// ---------- Sedes y ambientes ----------

export const TIPOS_AMBIENTE = [
    'Aula',
    'Aula magna',
    'Laboratorio',
    'Laboratorio de cómputo',
    'Laboratorio de Redes',
    'Laboratorio de Física',
    'Auditorio',
    'Auditorio Central',
    'Biblioteca',
    'Sala de reuniones',
    'Oficina',
]

// datos: { codigo, tipo, pabellon, piso, sede, capacidad }
export function crearAmbiente(datos) {
    const { ambientes } = cargar()
    const codigo = datos.codigo.trim().toUpperCase()

    if (ambientes.some((a) => a.codigo === codigo)) return { ok: false, motivo: 'codigo_repetido' }

    const nuevo = {
        codigo,
        tipo: datos.tipo,
        pabellon: datos.pabellon.trim(),
        piso: Number(datos.piso),
        sede: datos.sede.trim(),
        capacidad: Number(datos.capacidad),
        ticketsAbiertos: 0,
    }
    actualizar({ ambientes: [nuevo, ...ambientes] })
    return { ok: true, ambiente: nuevo }
}

export function editarAmbiente(codigoActual, datos) {
    const { ambientes } = cargar()
    const codigo = datos.codigo.trim().toUpperCase()

    if (ambientes.some((a) => a.codigo === codigo && a.codigo !== codigoActual)) {
        return { ok: false, motivo: 'codigo_repetido' }
    }

    actualizar({
        ambientes: ambientes.map((a) =>
            a.codigo === codigoActual
                ? {
                      ...a,
                      codigo,
                      tipo: datos.tipo,
                      pabellon: datos.pabellon.trim(),
                      piso: Number(datos.piso),
                      sede: datos.sede.trim(),
                      capacidad: Number(datos.capacidad),
                  }
                : a
        ),
    })
    return { ok: true }
}

export function eliminarAmbiente(codigo) {
    const { ambientes } = cargar()
    const ambiente = ambientes.find((a) => a.codigo === codigo)

    if (!ambiente) return { ok: false, motivo: 'no_existe' }
    if (ambiente.ticketsAbiertos > 0) return { ok: false, motivo: 'con_tickets' }

    actualizar({ ambientes: ambientes.filter((a) => a.codigo !== codigo) })
    return { ok: true }
}

// ---------- Técnicos por categoría ----------

// Técnicos del catálogo más los que se registraron por invitación (HU-1) y aún no están en la matriz.
export function listarTecnicos() {
    const tecnicos = cargar().tecnicos
    const nuevos = listarUsuarios()
        .filter((u) => u.rol === 'tecnico')
        .filter((u) => !tecnicos.some((t) => t.correo && t.correo === u.correo))
        .map((u) => ({
            id: u.id,
            nombres: u.nombres,
            apellidos: u.apellidos,
            correo: u.correo,
            especialidades: u.especialidades ?? [],
            carga: 0,
            categorias: u.especialidades ?? [],
        }))

    return [...tecnicos, ...nuevos]
}

// tecnicos: la lista completa con las categorías marcadas de cada uno.
export function guardarMatriz(tecnicos) {
    actualizar({ tecnicos })
}
