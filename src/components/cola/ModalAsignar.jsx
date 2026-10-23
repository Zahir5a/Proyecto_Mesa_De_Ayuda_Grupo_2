import { useState } from 'react'
import Modal from '../ui/Modal'
import { PRIORIDADES } from '../../data/contenidoPublico'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useToast } from '../../hooks/useToast'
import { listarTecnicos } from '../../services/catalogoService'
import { asignarTickets, cargaDe, estaEnCurso } from '../../services/ticketsService'

// Asignar o reasignar uno o varios tickets (mockup 4.2). Solo se ofrecen los técnicos
// habilitados para todas las categorías elegidas, según la matriz de HU-2.
function ModalAsignar({ seleccionados, todos, onCerrar, onListo }) {
    const { usuario } = useAuth()
    const { categorias } = useCatalogo()
    const { exito, error } = useToast()
    const [tecnicoId, setTecnicoId] = useState(null)
    const [motivo, setMotivo] = useState('')
    const [nota, setNota] = useState('')
    const [intentado, setIntentado] = useState(false)

    const unico = seleccionados.length === 1 ? seleccionados[0] : null
    const reasigna = seleccionados.some((t) => t.tecnicoId)
    const bloqueados = seleccionados.filter((t) => !estaEnCurso(t))

    const habilitados = listarTecnicos()
        .filter((tec) => seleccionados.every((t) => tec.categorias.includes(t.categoriaId)))
        .sort((a, b) => cargaDe(todos, a.id).total - cargaDe(todos, b.id).total)

    const nombreCategoria = (id) => (categorias.find((c) => c.id === id) ?? { nombre: id }).nombre
    const verbo = reasigna ? 'Reasignar' : 'Asignar'
    const titulo = unico ? `${verbo} ${unico.codigo}` : `${verbo} ${seleccionados.length} tickets`
    const subtitulo = unico
        ? `${nombreCategoria(unico.categoriaId)} · ${unico.ambiente} · prioridad ${PRIORIDADES.find((p) => p.id === unico.prioridad).nombre.toLowerCase()}`
        : [...new Set(seleccionados.map((t) => nombreCategoria(t.categoriaId)))].join(', ')

    const errorTecnico = intentado && !tecnicoId ? 'Selecciona un técnico.' : ''
    const errorMotivo = intentado && reasigna && !motivo.trim() ? 'El motivo es obligatorio para reasignar.' : ''

    function enviar(e) {
        e.preventDefault()
        setIntentado(true)
        if (!tecnicoId || (reasigna && !motivo.trim()) || bloqueados.length > 0) return

        const resultado = asignarTickets(seleccionados.map((t) => t.codigo), tecnicoId, { motivo, nota }, usuario)
        if (!resultado.ok) {
            error(resultado.mensaje)
            return
        }
        exito(
            resultado.afectados.length === 1
                ? `Ticket ${resultado.afectados[0].codigo} ${reasigna ? 'reasignado' : 'asignado'} a ${resultado.tecnico}.`
                : `${resultado.afectados.length} tickets ${reasigna ? 'reasignados' : 'asignados'} a ${resultado.tecnico}.`
        )
        onListo()
    }

    return (
        <Modal
            titulo={titulo}
            subtitulo={subtitulo}
            onCerrar={onCerrar}
            acciones={(
                <>
                    <button type="button" className="boton" onClick={onCerrar}>Cancelar</button>
                    <button type="submit" form="form-asignar" className="boton boton--primario"
                        disabled={bloqueados.length > 0 || habilitados.length === 0}>
                        {verbo}
                    </button>
                </>
            )}
        >
            <form id="form-asignar" onSubmit={enviar} noValidate>
                {bloqueados.length > 0 && (
                    <p className="alerta-error cola__aviso" role="alert">
                        {bloqueados.map((t) => t.codigo).join(', ')} {bloqueados.length === 1 ? 'está resuelto o cerrado' : 'están resueltos o cerrados'}.
                        Quítalos de la selección para asignar.
                    </p>
                )}

                <fieldset className="tecnicos">
                    <legend className="campo__etiqueta">Técnico habilitado</legend>
                    {habilitados.length === 0 && (
                        <p className="alerta-aviso cola__aviso">
                            No hay un técnico habilitado para todas las categorías elegidas. Asigna por categoría o habilita
                            técnicos en la matriz de “Técnicos por categoría”.
                        </p>
                    )}
                    {habilitados.map((tec) => {
                        const carga = cargaDe(todos, tec.id)
                        const yaAsignado = seleccionados.some((t) => t.tecnicoId === tec.id)
                        return (
                            <label key={tec.id}
                                className={`tecnicos__opcion${tecnicoId === tec.id ? ' tecnicos__opcion--elegida' : ''}${yaAsignado ? ' tecnicos__opcion--bloqueada' : ''}`}>
                                <input type="radio" name="tecnico" className="visualmente-oculto" disabled={yaAsignado}
                                    checked={tecnicoId === tec.id} onChange={() => setTecnicoId(tec.id)} />
                                <span className="tecnicos__nombre">{tec.nombres} {tec.apellidos}</span>
                                <span className="tecnicos__carga">
                                    {yaAsignado ? 'ya asignado' : `${carga.total} tickets · ${carga.criticos} ${carga.criticos === 1 ? 'crítico' : 'críticos'}`}
                                </span>
                            </label>
                        )
                    })}
                    {errorTecnico && <p className="campo__mensaje campo__mensaje--error">{errorTecnico}</p>}
                </fieldset>

                {reasigna && (
                    <div className={errorMotivo ? 'campo campo--error' : 'campo'}>
                        <label htmlFor="motivo-asignar" className="campo__etiqueta">Motivo de la reasignación (obligatorio)</label>
                        <textarea id="motivo-asignar" className="campo__control tickets__area tickets__area--corta" value={motivo}
                            onChange={(e) => setMotivo(e.target.value)} />
                        {errorMotivo && <p className="campo__mensaje campo__mensaje--error">{errorMotivo}</p>}
                    </div>
                )}

                <div className="campo">
                    <label htmlFor="nota-asignar" className="campo__etiqueta">Nota para el técnico</label>
                    <textarea id="nota-asignar" className="campo__control tickets__area tickets__area--corta" value={nota}
                        onChange={(e) => setNota(e.target.value)} />
                    <p className="campo__mensaje">Opcional. La verá el técnico en la bitácora del ticket.</p>
                </div>
            </form>
        </Modal>
    )
}

export default ModalAsignar
