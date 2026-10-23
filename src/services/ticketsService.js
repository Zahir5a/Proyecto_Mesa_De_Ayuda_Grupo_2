import semilla from '../data/tickets.json'
import { PRIORIDADES } from '../data/contenidoPublico'
import { ESTADOS_EN_CURSO, MAX_TEXTO, PLAZO_REAPERTURA_DIAS, TRANSICIONES, nombreEstado } from '../data/tickets'
import { guardar, leer } from './almacen'
import { buscarTecnico, listarTecnicos } from './catalogoService'
import { horasDeAtencion } from '../utils/etapas'
import { sumarDias } from '../utils/plazos'

// Tickets (HU-3 y HU-4). Se guardan en el navegador y, cada vez que cambian, se avisa a quien los
// esté mirando (ver useTickets). Quien atiende los tickets (HU-5) debe usar este mismo servicio.

let tickets = null
const oyentes = new Set()

const UN_MINUTO = 60000
const UNA_HORA = 3600000

// La semilla guarda los tiempos como "hace N minutos" para que los plazos de la demostración
// (reapertura, encuesta, tiempo esperado) sigan vigentes sin importar el día en que se abra el proyecto.
function crearSemilla() {
    const ahora = Date.now()
    const fecha = (desdeAhora) => new Date(ahora - desdeAhora * UN_MINUTO).toISOString()

    return semilla.map((t) => {
        const registradoEn = fecha(t.haceMin)
        const despues = (minutos) => new Date(new Date(registradoEn).getTime() + minutos * UN_MINUTO).toISOString()
        const { haceMin, cerradoHaceMin, resueltoHaceMin, retornoEnHoras, bitacora, historial, ...resto } = t // eslint-disable-line no-unused-vars

        return {
            ...resto,
            registradoEn,
            cerradoEn: cerradoHaceMin === undefined ? null : fecha(cerradoHaceMin),
            resueltoEn: resueltoHaceMin === undefined ? null : fecha(resueltoHaceMin),
            retornoEstimado: retornoEnHoras === undefined ? null : new Date(ahora + retornoEnHoras * UNA_HORA).toISOString(),
            bitacora: bitacora.map((b, i) => ({ id: t.codigo + '-b' + i, autor: b.autor, rol: b.rol, texto: b.texto, tipo: b.tipo, fecha: despues(b.despuesMin) })),
            historial: historial.map((h) => ({
                tipo: h.tipo,
                autor: h.autor,
                fecha: despues(h.despuesMin),
                ...(h.tipo === 'en_espera' && t.motivoEspera ? { motivo: t.motivoEspera } : {}),
            })),
        }
    })
}

function cargar() {
    if (tickets === null) {
        tickets = leer('tickets', null) ?? crearSemilla()
    }
    return tickets
}

// Guarda y comprueba que quedó guardado; si el navegador no deja escribir, devuelve false.
function actualizar(nuevos) {
    guardar('tickets', nuevos)
    if (leer('tickets', null) === null) return false

    tickets = nuevos
    oyentes.forEach((avisar) => avisar())
    return true
}

export function obtenerTickets() {
    return cargar()
}

export function suscribir(oyente) {
    oyentes.add(oyente)
    return () => oyentes.delete(oyente)
}

// ---------- Consultas ----------

export function ticketsDeUsuario(lista, usuarioId) {
    return lista.filter((t) => t.usuarioId === usuarioId)
}

export function buscarTicket(lista, codigo) {
    return lista.find((t) => t.codigo === codigo.toUpperCase()) ?? null
}

export function estaEnCurso(ticket) {
    return ESTADOS_EN_CURSO.includes(ticket.estado)
}

// En la bandeja del técnico están sus tickets hasta que se cierran (los resueltos esperan el cierre).
export function estaEnBandeja(ticket) {
    return estaEnCurso(ticket) || ticket.estado === 'resuelto'
}

function esDeHoy(fecha) {
    return fecha !== null && new Date(fecha).toDateString() === new Date().toDateString()
}

// El técnico del catálogo (matriz de HU-2) que corresponde a una cuenta de técnico.
export function tecnicoDeUsuario(usuario) {
    return listarTecnicos().find((t) => t.id === usuario.id || (t.correo && t.correo === usuario.correo)) ?? null
}

// Tickets en curso de un técnico y cuántos son críticos (se muestra al asignar).
export function cargaDe(lista, tecnicoId) {
    const propios = lista.filter((t) => t.tecnicoId === tecnicoId && estaEnCurso(t))
    return { total: propios.length, criticos: propios.filter((t) => t.prioridad === 'critica').length }
}

// Contadores del menú y de "Mi cuenta" para un usuario.
export function resumenDeTickets(lista, usuarioId) {
    const propios = ticketsDeUsuario(lista, usuarioId)
    return {
        ticketsReportados: propios.length,
        ticketsAbiertos: propios.filter(estaEnCurso).length,
        encuestaPendiente: propios.filter((t) => t.encuestaPendiente).length,
    }
}

// Contadores del menú del técnico (HU-4): sus tickets asignados por estado.
export function resumenDeTecnico(lista, tecnicoId) {
    const propios = lista.filter((t) => t.tecnicoId === tecnicoId && estaEnBandeja(t))
    return {
        asignados: propios.length,
        enAtencion: propios.filter((t) => t.estado === 'en_atencion').length,
        enEspera: propios.filter((t) => t.estado === 'en_espera').length,
        resueltosHoy: propios.filter((t) => t.estado === 'resuelto' && esDeHoy(t.resueltoEn)).length,
    }
}

// Contadores del menú del supervisor (HU-4): cola de atención.
export function resumenDeCola(lista) {
    const enCurso = lista.filter(estaEnCurso)
    return {
        cola: enCurso.length,
        colaSinAsignar: enCurso.filter((t) => !t.tecnicoId).length,
    }
}

// Último ticket cerrado que todavía espera la encuesta, con su fecha límite (7 días tras el cierre).
export function encuestaPendiente(lista, usuarioId) {
    const ticket = ticketsDeUsuario(lista, usuarioId).find((t) => t.encuestaPendiente)
    if (!ticket) return null
    return { codigo: ticket.codigo, cerradoEn: ticket.cerradoEn, limite: sumarDias(ticket.cerradoEn, PLAZO_REAPERTURA_DIAS) }
}

// Ticket abierto de otra persona (o la misma) para el mismo ambiente y la misma categoría.
export function buscarDuplicado(lista, categoriaId, ambiente) {
    const codigo = ambiente.trim().toUpperCase()
    if (!categoriaId || !codigo) return null
    return lista.find((t) => estaEnCurso(t) && t.categoriaId === categoriaId && t.ambiente === codigo) ?? null
}

// Se puede reabrir un ticket cerrado hasta 7 días después del cierre.
export function limiteReapertura(ticket) {
    if (ticket.estado !== 'cerrado' || !ticket.cerradoEn) return null
    return sumarDias(ticket.cerradoEn, PLAZO_REAPERTURA_DIAS)
}

export function puedeReabrir(ticket) {
    const limite = limiteReapertura(ticket)
    return limite !== null && new Date() <= limite
}

// Solo se cancela mientras nadie lo haya asignado.
export function puedeCancelar(ticket) {
    return ticket.estado === 'abierto' && !ticket.tecnicoId
}

export function admiteComentarios(ticket) {
    return ticket.estado !== 'cerrado' && ticket.estado !== 'cancelado'
}

// ---------- Cambios ----------

function siguienteCodigo(lista) {
    const mayor = lista.reduce((max, t) => Math.max(max, Number(t.codigo.slice(-5))), 0)
    return 'TCK-' + new Date().getFullYear() + '-' + String(mayor + 1).padStart(5, '0')
}

function nombreCompleto(usuario) {
    return usuario.nombres + ' ' + usuario.apellidos
}

// datos: { categoriaId, subcategoriaId, ambiente, prioridad, asunto, descripcion, evidencia }
export function registrarTicket(datos, usuario) {
    const lista = cargar()
    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)

    const ticket = {
        codigo: siguienteCodigo(lista),
        usuarioId: usuario.id,
        solicitante: autor,
        asunto: datos.asunto.trim(),
        descripcion: datos.descripcion.trim(),
        categoriaId: datos.categoriaId,
        subcategoriaId: datos.subcategoriaId,
        ambiente: datos.ambiente.trim().toUpperCase(),
        prioridad: datos.prioridad,
        estado: 'abierto',
        registradoEn: ahora,
        cerradoEn: null,
        tecnicoId: null,
        evidencia: datos.evidencia,
        bitacora: [{ id: 'b0', autor, rol: 'usuario', texto: datos.descripcion.trim(), tipo: 'publico', fecha: ahora }],
        historial: [{ tipo: 'abierto', autor, fecha: ahora }],
    }

    if (!actualizar([ticket, ...lista])) return { ok: false, motivo: 'almacenamiento' }
    return { ok: true, ticket }
}

function modificar(codigo, transformar) {
    const nuevos = cargar().map((t) => (t.codigo === codigo ? transformar(t) : t))
    return actualizar(nuevos)
}

export function agregarComentario(codigo, usuario, texto) {
    const ahora = new Date().toISOString()
    return modificar(codigo, (t) => ({
        ...t,
        bitacora: [
            ...t.bitacora,
            { id: codigo + '-b' + t.bitacora.length, autor: nombreCompleto(usuario), rol: usuario.rol, texto: texto.trim(), tipo: 'publico', fecha: ahora },
        ],
    }))
}

export function cancelarTicket(codigo, usuario) {
    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket || !puedeCancelar(ticket)) return { ok: false, motivo: 'no_cancelable' }

    const ahora = new Date().toISOString()
    const guardado = modificar(codigo, (t) => ({
        ...t,
        estado: 'cancelado',
        historial: [...t.historial, { tipo: 'cancelado', autor: nombreCompleto(usuario), fecha: ahora }],
    }))
    return guardado ? { ok: true } : { ok: false, motivo: 'almacenamiento' }
}

export function reabrirTicket(codigo, usuario, motivo) {
    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket || ticket.estado !== 'cerrado') return { ok: false, motivo: 'no_cerrado' }
    if (!puedeReabrir(ticket)) return { ok: false, motivo: 'fuera_de_plazo' }

    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)
    const guardado = modificar(codigo, (t) => ({
        ...t,
        estado: 'reabierto',
        cerradoEn: null,
        encuestaPendiente: false,
        bitacora: [
            ...t.bitacora,
            { id: codigo + '-b' + t.bitacora.length, autor, rol: 'usuario', texto: 'Reapertura: ' + motivo.trim(), tipo: 'publico', fecha: ahora },
        ],
        historial: [...t.historial, { tipo: 'reabierto', autor, fecha: ahora }],
    }))
    return guardado ? { ok: true } : { ok: false, motivo: 'almacenamiento' }
}

// ---------- Cola y asignación (HU-4) ----------
// Estas operaciones devuelven { ok: true, afectados } o { ok: false, mensaje } para que la
// pantalla muestre el aviso tal cual.

function tomar(codigos) {
    const objetivo = cargar().filter((t) => codigos.includes(t.codigo))
    return objetivo
}

function entrada(lista, t, rol, texto, tipo, autor, fecha) {
    return [...lista, { id: t.codigo + '-b' + lista.length, autor, rol, texto, tipo, fecha }]
}

// Asigna (o reasigna) uno o varios tickets a un técnico. Para reasignar hay que indicar el motivo.
// opciones: { motivo, nota }
export function asignarTickets(codigos, tecnicoId, opciones, usuario) {
    const tecnico = buscarTecnico(tecnicoId)
    if (!tecnico) return { ok: false, mensaje: 'Selecciona un técnico para asignar.' }

    const objetivo = tomar(codigos)
    if (objetivo.length === 0) return { ok: false, mensaje: 'No se encontraron los tickets seleccionados.' }

    const motivo = (opciones.motivo ?? '').trim()
    const nota = (opciones.nota ?? '').trim()

    for (const t of objetivo) {
        if (!estaEnCurso(t)) return { ok: false, mensaje: `${t.codigo} está ${nombreEstado(t.estado).toLowerCase()} y ya no admite asignación.` }
        if (!tecnico.categorias.includes(t.categoriaId)) return { ok: false, mensaje: `${tecnico.nombres} no está habilitado para ${t.codigo}.` }
        if (t.tecnicoId === tecnicoId) return { ok: false, mensaje: `${t.codigo} ya está asignado a ${tecnico.nombres}.` }
        if (t.tecnicoId && !motivo) return { ok: false, mensaje: 'Para reasignar debes indicar un motivo.' }
    }

    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)
    const nombreTecnico = tecnico.nombres + ' ' + tecnico.apellidos

    const nuevos = cargar().map((t) => {
        if (!codigos.includes(t.codigo)) return t
        const reasignado = Boolean(t.tecnicoId)
        let bitacora = entrada(
            t.bitacora, t, 'supervisor',
            `${reasignado ? 'Reasignamos' : 'Asignamos'} tu ticket a ${nombreTecnico}.`, 'publico', autor, ahora
        )
        if (reasignado) bitacora = entrada(bitacora, t, 'supervisor', 'Motivo de la reasignación: ' + motivo, 'interno', autor, ahora)
        if (nota) bitacora = entrada(bitacora, t, 'supervisor', 'Nota para el técnico: ' + nota, 'interno', autor, ahora)

        return {
            ...t,
            tecnicoId,
            bitacora,
            historial: [...t.historial, { tipo: reasignado ? 'reasignado' : 'asignado', autor, fecha: ahora, detalle: nombreTecnico, motivo: motivo || null }],
        }
    })

    if (!actualizar(nuevos)) return { ok: false, mensaje: 'No pudimos guardar el cambio. Inténtalo otra vez.' }
    return { ok: true, afectados: nuevos.filter((t) => codigos.includes(t.codigo)), tecnico: nombreTecnico }
}

// Un técnico se toma un ticket sin asignar de sus propias categorías.
export function autoasignarTicket(codigo, usuario) {
    const tecnico = tecnicoDeUsuario(usuario)
    if (!tecnico) return { ok: false, mensaje: 'Tu cuenta no está en la matriz de técnicos por categoría.' }

    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket) return { ok: false, mensaje: 'No se encontró el ticket.' }
    if (ticket.tecnicoId) return { ok: false, mensaje: `${ticket.codigo} ya tiene un técnico asignado.` }

    return asignarTickets([codigo], tecnico.id, {}, usuario)
}

// Cambia la prioridad de varios tickets en curso; el motivo es obligatorio y queda en el historial.
export function cambiarPrioridadTickets(codigos, prioridad, motivo, usuario) {
    if (!PRIORIDADES.some((p) => p.id === prioridad)) return { ok: false, mensaje: 'Selecciona la nueva prioridad.' }
    if (!motivo.trim()) return { ok: false, mensaje: 'El motivo es obligatorio.' }

    const objetivo = tomar(codigos)
    if (objetivo.length === 0) return { ok: false, mensaje: 'No se encontraron los tickets seleccionados.' }
    if (objetivo.some((t) => !estaEnCurso(t))) return { ok: false, mensaje: 'Solo se puede cambiar la prioridad de tickets en curso.' }

    const cambiables = objetivo.filter((t) => t.prioridad !== prioridad).map((t) => t.codigo)
    if (cambiables.length === 0) return { ok: false, mensaje: 'Los tickets seleccionados ya tienen esa prioridad.' }

    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)
    const nombre = (id) => PRIORIDADES.find((p) => p.id === id).nombre

    const nuevos = cargar().map((t) => {
        if (!cambiables.includes(t.codigo)) return t
        const detalle = `Prioridad ${nombre(t.prioridad)} → ${nombre(prioridad)}`
        return {
            ...t,
            prioridad,
            bitacora: entrada(t.bitacora, t, 'supervisor', `${detalle}. Motivo: ${motivo.trim()}`, 'interno', autor, ahora),
            historial: [...t.historial, { tipo: 'prioridad', autor, fecha: ahora, detalle, motivo: motivo.trim() }],
        }
    })

    if (!actualizar(nuevos)) return { ok: false, mensaje: 'No pudimos guardar el cambio. Inténtalo otra vez.' }
    return { ok: true, afectados: nuevos.filter((t) => cambiables.includes(t.codigo)) }
}

// Quita el técnico y deja el ticket abierto otra vez. Los que no tienen técnico se omiten.
export function devolverTickets(codigos, usuario) {
    const objetivo = tomar(codigos)
    if (objetivo.length === 0) return { ok: false, mensaje: 'No se encontraron los tickets seleccionados.' }

    const elegibles = objetivo.filter((t) => estaEnCurso(t) && t.tecnicoId).map((t) => t.codigo)
    if (elegibles.length === 0) return { ok: false, mensaje: 'Ninguno de los tickets seleccionados tiene técnico asignado.' }

    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)

    const nuevos = cargar().map((t) => {
        if (!elegibles.includes(t.codigo)) return t
        return {
            ...t,
            tecnicoId: null,
            estado: 'abierto',
            historial: [...t.historial, { tipo: 'devuelto', autor, fecha: ahora, detalle: 'Devuelto a la cola de atención' }],
        }
    })

    if (!actualizar(nuevos)) return { ok: false, mensaje: 'No pudimos guardar el cambio. Inténtalo otra vez.' }
    return { ok: true, afectados: nuevos.filter((t) => elegibles.includes(t.codigo)), omitidos: objetivo.length - elegibles.length }
}

// ---------- Atención y cierre (HU-5) ----------
// Solo el técnico asignado registra la atención. Estas operaciones devuelven { ok: true } o
// { ok: false, mensaje, campo } para que la pantalla muestre el error junto al campo que corresponde.

export function puedeAtender(ticket, usuario) {
    if (usuario.rol !== 'tecnico' || !ticket.tecnicoId) return false
    const tecnico = tecnicoDeUsuario(usuario)
    return tecnico !== null && tecnico.id === ticket.tecnicoId && ticket.estado !== 'cerrado' && ticket.estado !== 'cancelado'
}

// Quien puede abrir el ticket: el técnico asignado y el supervisor (vista consolidada).
export function puedeVerAtencion(ticket, usuario) {
    if (usuario.rol === 'supervisor') return true
    if (usuario.rol !== 'tecnico') return false
    const tecnico = tecnicoDeUsuario(usuario)
    return tecnico !== null && tecnico.id === ticket.tecnicoId
}

function validarTexto(texto, campo, etiqueta) {
    const limpio = (texto ?? '').trim()
    if (!limpio) return { campo, mensaje: `${etiqueta} es obligatorio.` }
    if (limpio.length > MAX_TEXTO) return { campo, mensaje: `Usa ${MAX_TEXTO} caracteres como máximo.` }
    return null
}

function entradaDe(t, usuario, texto, tipo, fecha) {
    return { id: t.codigo + '-b' + t.bitacora.length, autor: nombreCompleto(usuario), rol: usuario.rol, texto, tipo, fecha }
}

const SIN_PERMISO = { ok: false, mensaje: 'Solo el técnico asignado puede registrar la atención.' }
const NO_GUARDO = { ok: false, mensaje: 'No pudimos guardar el cambio. Inténtalo otra vez.' }

export function agregarEntradaBitacora(codigo, usuario, texto, tipo) {
    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket || !puedeAtender(ticket, usuario)) return SIN_PERMISO
    if (!['publico', 'interno'].includes(tipo)) return { ok: false, campo: 'tipo', mensaje: 'Elige si es un comentario público o una nota interna.' }

    const error = validarTexto(texto, 'texto', 'El comentario')
    if (error) return { ok: false, ...error }

    const ahora = new Date().toISOString()
    const guardado = modificar(codigo, (t) => ({ ...t, bitacora: [...t.bitacora, entradaDe(t, usuario, texto.trim(), tipo, ahora)] }))
    return guardado ? { ok: true } : NO_GUARDO
}

// valores: { motivoEspera, retornoEstimado } (solo para pasar a "en espera")
export function cambiarEstadoTicket(codigo, estado, valores, usuario) {
    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket || !puedeAtender(ticket, usuario)) return SIN_PERMISO
    if (!(TRANSICIONES[ticket.estado] ?? []).includes(estado)) {
        return { ok: false, campo: 'estado', mensaje: `No se puede pasar de ${nombreEstado(ticket.estado)} a ${nombreEstado(estado)}.` }
    }

    let motivo = null
    let retorno = null
    if (estado === 'en_espera') {
        const error = validarTexto(valores.motivoEspera, 'motivoEspera', 'El motivo de la espera')
        if (error) return { ok: false, ...error }
        const fecha = new Date(valores.retornoEstimado)
        if (!valores.retornoEstimado || Number.isNaN(fecha.getTime()) || fecha <= new Date()) {
            return { ok: false, campo: 'retornoEstimado', mensaje: 'Ingresa una fecha futura de retorno.' }
        }
        motivo = valores.motivoEspera.trim()
        retorno = fecha.toISOString()
    }

    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)
    const guardado = modificar(codigo, (t) => {
        let bitacora = t.bitacora
        if (estado === 'en_espera') {
            bitacora = [...bitacora, entradaDe(t, usuario, `El ticket quedó en espera: ${motivo}.`, 'publico', ahora)]
        }
        if (estado === 'resuelto') {
            bitacora = [...bitacora, entradaDe(t, usuario, 'El técnico marcó el ticket como resuelto.', 'publico', ahora)]
        }
        return {
            ...t,
            estado,
            motivoEspera: motivo,
            retornoEstimado: retorno,
            resueltoEn: estado === 'resuelto' ? ahora : t.resueltoEn ?? null,
            bitacora,
            historial: [...t.historial, { tipo: estado, autor, fecha: ahora, motivo, retornoEstimado: retorno }],
        }
    })
    return guardado ? { ok: true } : NO_GUARDO
}

// Cierra un ticket en atención o resuelto: pide la solución y calcula el tiempo total de atención.
export function cerrarTicket(codigo, solucion, usuario) {
    const ticket = buscarTicket(cargar(), codigo)
    if (!ticket || !puedeAtender(ticket, usuario)) return SIN_PERMISO
    if (!['en_atencion', 'resuelto'].includes(ticket.estado)) {
        return { ok: false, campo: 'estado', mensaje: 'Solo se puede cerrar un ticket en atención o resuelto.' }
    }

    const error = validarTexto(solucion, 'solucion', 'La solución aplicada')
    if (error) return { ok: false, ...error }

    const ahora = new Date().toISOString()
    const autor = nombreCompleto(usuario)
    const texto = solucion.trim()

    const guardado = modificar(codigo, (t) => {
        // Si estaba en atención, queda registrado también el paso por "resuelto"
        const historial = t.estado === 'en_atencion' ? [...t.historial, { tipo: 'resuelto', autor, fecha: ahora }] : t.historial
        const conCierre = [...historial, { tipo: 'cerrado', autor, fecha: ahora, detalle: 'Solución: ' + texto }]

        return {
            ...t,
            estado: 'cerrado',
            motivoEspera: null,
            retornoEstimado: null,
            resueltoEn: t.resueltoEn ?? ahora,
            cerradoEn: ahora,
            solucion: texto,
            tiempoTotalAtencion: horasDeAtencion({ ...t, historial: conCierre }, new Date(ahora).getTime()),
            // el usuario recibe la encuesta (HU-6) y puede reabrir durante 7 días
            encuestaPendiente: Boolean(t.usuarioId),
            bitacora: [...t.bitacora, entradaDe(t, usuario, 'Ticket cerrado. Solución: ' + texto, 'publico', ahora)],
            historial: conCierre,
        }
    })
    return guardado ? { ok: true } : NO_GUARDO
}
