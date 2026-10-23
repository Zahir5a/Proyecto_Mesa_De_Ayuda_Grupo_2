import { useState } from 'react'
import ModalInvitarTecnico from '../../components/tecnicos/ModalInvitarTecnico'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useToast } from '../../hooks/useToast'
import { guardarMatriz, listarTecnicos, nombreDeCategoria } from '../../services/catalogoService'
import './catalogo.css'
import './tecnicos.css'

// La categoría con más tickets por técnico habilitado, si tiene pocos técnicos.
function buscarAdvertencia(categorias, tecnicos) {
    const candidatas = categorias
        .filter((c) => c.estado === 'activa')
        .map((c) => ({
            nombre: c.nombre,
            tickets: c.ticketsAbiertos,
            habilitados: tecnicos.filter((t) => t.categorias.includes(c.id)).length,
        }))
        .filter((c) => c.habilitados <= 2 && c.tickets > 0)
        .sort((a, b) => b.tickets / Math.max(b.habilitados, 0.5) - a.tickets / Math.max(a.habilitados, 0.5))

    if (candidatas.length === 0) return null
    const peor = candidatas[0]
    const tecnicosTexto =
        peor.habilitados === 0 ? 'ningún técnico habilitado' : `solo ${peor.habilitados} ${peor.habilitados === 1 ? 'técnico habilitado' : 'técnicos habilitados'}`
    return `${peor.nombre} tiene ${tecnicosTexto} y ${peor.tickets} tickets abiertos. Considera habilitar a otro técnico.`
}

function TecnicosCategoria() {
    const { categorias } = useCatalogo()
    const { exito } = useToast()
    const [tecnicos, setTecnicos] = useState(listarTecnicos)
    const [guardados, setGuardados] = useState(() => JSON.stringify(listarTecnicos()))
    const [invitando, setInvitando] = useState(false)

    const hayCambios = JSON.stringify(tecnicos) !== guardados
    const advertencia = buscarAdvertencia(categorias, tecnicos)

    function alternar(idTecnico, idCategoria) {
        setTecnicos(
            tecnicos.map((t) => {
                if (t.id !== idTecnico) return t
                const habilitada = t.categorias.includes(idCategoria)
                return {
                    ...t,
                    categorias: habilitada ? t.categorias.filter((c) => c !== idCategoria) : [...t.categorias, idCategoria],
                }
            })
        )
    }

    function guardar() {
        guardarMatriz(tecnicos)
        setGuardados(JSON.stringify(tecnicos))
        exito('Guardamos la matriz de técnicos por categoría.')
    }

    return (
        <div className="categorias-page">
            <div className="page-header">
                <div className="page-title-group">
                    <h1 className="page-title">Técnicos por categoría</h1>
                    <p className="page-subtitle">
                        Marca las categorías que cada técnico puede atender. La cola solo ofrece técnicos habilitados al asignar.
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={() => setInvitando(true)}>Invitar técnico</button>
                    <button className="btn btn-primary" onClick={guardar}>Guardar matriz</button>
                </div>
            </div>

            {hayCambios && <p className="aviso-cambios" role="status">Tienes cambios sin guardar.</p>}

            <div className="tabla-container">
                <div className="tabla-desplazable">
                    <table className="tabla-categorias tabla-matriz">
                        <thead>
                            <tr>
                                <th>TÉCNICO</th>
                                <th>ESPECIALIDAD DECLARADA</th>
                                <th>CARGA ACTUAL</th>
                                {categorias.map((c) => (
                                    <th key={c.id} className="matriz__categoria">
                                        {c.nombre}
                                        {c.estado !== 'activa' && <span className="matriz__inactiva">inactiva</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tecnicos.length === 0 && (
                                <tr>
                                    <td colSpan={3 + categorias.length} className="tabla-vacia">
                                        Aún no hay técnicos. Invita al primero con el botón “Invitar técnico”.
                                    </td>
                                </tr>
                            )}
                            {tecnicos.map((t) => (
                                <tr key={t.id}>
                                    <td className="nombre-tecnico">{t.nombres} {t.apellidos}</td>
                                    <td className="celda-suave">
                                        {t.especialidades.length > 0
                                            ? t.especialidades.map((id) => nombreDeCategoria(categorias, id)).join(', ')
                                            : '—'}
                                    </td>
                                    <td>
                                        <strong>{t.carga}</strong> <span className="celda-suave">tickets</span>
                                    </td>
                                    {categorias.map((c) => {
                                        const marcada = t.categorias.includes(c.id)
                                        return (
                                            <td key={c.id} className={marcada ? 'matriz__celda matriz__celda--marcada' : 'matriz__celda'}>
                                                <button
                                                    type="button"
                                                    role="checkbox"
                                                    aria-checked={marcada}
                                                    aria-label={`${t.nombres} ${t.apellidos} atiende ${c.nombre}`}
                                                    className="matriz__boton"
                                                    onClick={() => alternar(t.id, c.id)}
                                                >
                                                    {marcada ? '✓' : ''}
                                                </button>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="matriz__notas">
                <p className="matriz__aviso">
                    {advertencia ?? 'Todas las categorías con tickets tienen al menos tres técnicos habilitados.'}
                </p>
                <p className="matriz__nota">
                    Carga actual = tickets asignados en estado abierto, en atención o en espera.
                </p>
            </div>

            <ModalInvitarTecnico abierto={invitando} onCerrar={() => setInvitando(false)} />
        </div>
    )
}

export default TecnicosCategoria
