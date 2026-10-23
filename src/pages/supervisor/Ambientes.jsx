import { useState } from 'react'
import ModalAmbiente from '../../components/ambientes/ModalAmbiente'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Paginacion from '../../components/ui/Paginacion'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { crearAmbiente, editarAmbiente, eliminarAmbiente } from '../../services/catalogoService'
import { ambientesConAbiertos } from '../../utils/conteos'
import '../../components/categorias/TablaCategoria.css'
import './catalogo.css'
import './ambientes.css'

const FILAS_POR_PAGINA = 10

function unicos(lista) {
    return [...new Set(lista)].sort((a, b) => String(a).localeCompare(String(b), 'es', { numeric: true }))
}

function Ambientes() {
    // Los tickets abiertos por ambiente salen de los tickets reales
    const ambientes = ambientesConAbiertos(useCatalogo().ambientes, useTickets())
    const { exito } = useToast()

    const [busqueda, setBusqueda] = useState('')
    const [sede, setSede] = useState('todas')
    const [pabellon, setPabellon] = useState('todos')
    const [tipo, setTipo] = useState('todos')
    const [paginaActual, setPaginaActual] = useState(1)

    // Modal de alta o edición: null = cerrado, 'nuevo' = alta, o el ambiente que se edita
    const [modal, setModal] = useState(null)
    const [porEliminar, setPorEliminar] = useState(null)

    const sedes = unicos(ambientes.map((a) => a.sede))
    const pabellones = unicos(ambientes.filter((a) => sede === 'todas' || a.sede === sede).map((a) => a.pabellon))
    const tipos = unicos(ambientes.map((a) => a.tipo))

    const texto = busqueda.trim().toLowerCase()
    const filtrados = ambientes.filter((a) => {
        if (texto && !a.codigo.toLowerCase().includes(texto) && !a.tipo.toLowerCase().includes(texto)) return false
        if (sede !== 'todas' && a.sede !== sede) return false
        if (pabellon !== 'todos' && a.pabellon !== pabellon) return false
        if (tipo !== 'todos' && a.tipo !== tipo) return false
        return true
    })

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / FILAS_POR_PAGINA))
    const pagina = Math.min(paginaActual, totalPaginas)
    const inicio = (pagina - 1) * FILAS_POR_PAGINA
    const filasPagina = filtrados.slice(inicio, inicio + FILAS_POR_PAGINA)

    function cambiarSede(valor) {
        setSede(valor)
        setPabellon('todos')
        setPaginaActual(1)
    }

    function guardar(datos) {
        const editando = modal !== 'nuevo'
        const resultado = editando ? editarAmbiente(modal.codigo, datos) : crearAmbiente(datos)
        if (!resultado.ok) return resultado

        exito(`Ambiente ${datos.codigo.trim().toUpperCase()} ${editando ? 'actualizado' : 'registrado'} correctamente.`)
        setModal(null)
        return resultado
    }

    function eliminar() {
        eliminarAmbiente(porEliminar.codigo, porEliminar.ticketsAbiertos)
        exito(`Ambiente ${porEliminar.codigo} eliminado.`)
        setPorEliminar(null)
    }

    const sedesTexto = sedes.length === 1 ? `en el ${sedes[0]}` : `en ${sedes.length} sedes`

    return (
        <div className="categorias-page">
            <div className="page-header">
                <div className="page-title-group">
                    <h1 className="page-title">Sedes y ambientes</h1>
                    <p className="page-subtitle">{ambientes.length} ambientes registrados {sedesTexto}.</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => setModal('nuevo')}>Nuevo ambiente</button>
                </div>
            </div>

            <div className="filtros-bar">
                <div className="filtros-izquierda">
                    <input
                        type="search"
                        className="filtro-buscador"
                        placeholder="Buscar por código o nombre"
                        aria-label="Buscar por código o nombre"
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
                    />
                    <select className="filtro-select" aria-label="Filtrar por sede" value={sede}
                        onChange={(e) => cambiarSede(e.target.value)}>
                        <option value="todas">Sede: todas</option>
                        {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="filtro-select" aria-label="Filtrar por pabellón" value={pabellon}
                        onChange={(e) => { setPabellon(e.target.value); setPaginaActual(1) }}>
                        <option value="todos">Pabellón: todos</option>
                        {pabellones.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select className="filtro-select" aria-label="Filtrar por tipo" value={tipo}
                        onChange={(e) => { setTipo(e.target.value); setPaginaActual(1) }}>
                        <option value="todos">Tipo: todos</option>
                        {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="tabla-container">
                <table className="tabla-categorias tabla-ambientes">
                    <thead>
                        <tr>
                            <th>CÓDIGO</th>
                            <th>TIPO DE AMBIENTE</th>
                            <th>PABELLÓN</th>
                            <th>PISO</th>
                            <th>SEDE</th>
                            <th>CAPACIDAD</th>
                            <th>TICKETS ABIERTOS</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filasPagina.length === 0 && (
                            <tr>
                                <td colSpan={8} className="tabla-vacia">Ningún ambiente coincide con los filtros.</td>
                            </tr>
                        )}
                        {filasPagina.map((a) => (
                            <tr key={a.codigo}>
                                <td className="codigo-ambiente">{a.codigo}</td>
                                <td>{a.tipo}</td>
                                <td>{a.pabellon}</td>
                                <td>{a.piso}</td>
                                <td className="celda-suave">{a.sede}</td>
                                <td>{a.capacidad}</td>
                                <td>{a.ticketsAbiertos}</td>
                                <td className="col-acciones">
                                    <button className="btn-link btn-editar" onClick={() => setModal(a)}>Editar</button>
                                    <button className="btn-link btn-desactivar" disabled={a.ticketsAbiertos > 0}
                                        title={a.ticketsAbiertos > 0 ? 'Tiene tickets en curso: no se puede eliminar' : undefined}
                                        onClick={() => setPorEliminar(a)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="tabla-footer">
                    <span className="tabla-info">
                        {filtrados.length === 0
                            ? 'Mostrando 0 ambientes'
                            : `Mostrando ${inicio + 1}–${inicio + filasPagina.length} de ${filtrados.length} ambientes`}
                    </span>
                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPaginaActual} />
                </div>
            </div>

            <ModalAmbiente
                abierto={modal !== null}
                ambiente={modal === 'nuevo' ? null : modal}
                onGuardar={guardar}
                onCancelar={() => setModal(null)}
            />

            <ConfirmDialog
                abierto={porEliminar !== null}
                titulo={`¿Eliminar el ambiente ${porEliminar ? porEliminar.codigo : ''}?`}
                textoConfirmar="Eliminar"
                destructivo
                onConfirmar={eliminar}
                onCancelar={() => setPorEliminar(null)}
            >
                Se borra del catálogo y ya no se podrá elegir al registrar un ticket.
            </ConfirmDialog>
        </div>
    )
}

export default Ambientes
