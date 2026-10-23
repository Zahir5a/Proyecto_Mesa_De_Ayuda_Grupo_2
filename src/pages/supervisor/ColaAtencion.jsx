import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BarraLote from '../../components/cola/BarraLote'
import FiltrosCola from '../../components/cola/FiltrosCola'
import ModalAsignar from '../../components/cola/ModalAsignar'
import ModalPrioridad from '../../components/cola/ModalPrioridad'
import TablaCola from '../../components/cola/TablaCola'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Paginacion from '../../components/ui/Paginacion'
import { useAhora } from '../../hooks/useAhora'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { FILAS_POR_PAGINA, useCola } from '../../hooks/useCola'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { listarTecnicos } from '../../services/catalogoService'
import { devolverTickets } from '../../services/ticketsService'
import '../../components/categorias/TablaCategoria.css'
import '../../components/ui/estadoVacio.css'
import '../usuario/tickets.css'
import './cola.css'

const RESUMEN = [
    { estado: 'abierto', campo: 'abiertos', nombre: 'Abiertos' },
    { estado: 'en_atencion', campo: 'en_atencion', nombre: 'En atención' },
    { estado: 'en_espera', campo: 'en_espera', nombre: 'En espera' },
    { estado: 'resuelto', campo: 'resuelto', nombre: 'Resueltos hoy' },
]

// Cola de atención del supervisor: filtros, orden, asignación, cambio de prioridad y acciones en lote (HU-4).
function ColaAtencion() {
    const { usuario } = useAuth()
    const { categorias, ambientes } = useCatalogo()
    const tickets = useTickets()
    const { exito, error, aviso } = useToast()
    const ahora = useAhora()
    const [parametros] = useSearchParams()

    // "Bandejas de técnicos" enlaza aquí con ?tecnico=<id>
    const tecnicoInicial = parametros.get('tecnico')
    const cola = useCola(tickets, categorias, ahora, tecnicoInicial ? { tecnicoId: tecnicoInicial, estado: 'en_curso' } : {})
    const [ventana, setVentana] = useState(null) // 'asignar' | 'prioridad' | 'devolver'

    const cantidad = cola.seleccionados.length
    const { resumen } = cola
    const tecnicos = listarTecnicos()

    function terminar() {
        setVentana(null)
        cola.limpiarSeleccion()
    }

    function devolver() {
        const resultado = devolverTickets(cola.seleccionados.map((t) => t.codigo), usuario)
        setVentana(null)
        if (!resultado.ok) {
            error(resultado.mensaje)
            return
        }
        exito(`${resultado.afectados.length} ${resultado.afectados.length === 1 ? 'ticket devuelto' : 'tickets devueltos'} a la cola.`)
        if (resultado.omitidos) {
            aviso(`${resultado.omitidos} ${resultado.omitidos === 1 ? 'ticket se omitió' : 'tickets se omitieron'} por no tener técnico asignado.`)
        }
        cola.limpiarSeleccion()
    }

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Cola de atención</h1>
                    <p className="texto-aux">
                        {resumen.enCola} tickets en cola · {resumen.sinAsignar} sin asignar · {resumen.fueraDePlazo} fuera del tiempo esperado
                    </p>
                </div>
                <div className="cola__resumen" role="group" aria-label="Resumen por estado">
                    {RESUMEN.map((r) => (
                        <button key={r.estado} type="button"
                            className={`cola__etiqueta cola__etiqueta--${r.estado}${cola.filtros.estado === r.estado ? ' cola__etiqueta--activa' : ''}`}
                            onClick={() => cola.cambiarFiltro('estado', cola.filtros.estado === r.estado ? 'en_curso' : r.estado)}>
                            {r.nombre} {resumen[r.campo]}
                        </button>
                    ))}
                </div>
            </div>

            <FiltrosCola filtros={cola.filtros} cambiarFiltro={cola.cambiarFiltro} categorias={categorias}
                ambientes={ambientes} tecnicos={tecnicos} chips={cola.chips} limpiar={cola.limpiarFiltros}
                orden={cola.orden} setOrden={cola.setOrden} />

            {cola.total === 0 ? (
                <div className="estado-vacio">
                    <span className="estado-vacio__icono" aria-hidden="true" />
                    <h2>No hay tickets con estos filtros</h2>
                    <p>La cola está al día para los filtros aplicados.</p>
                    <button type="button" className="boton boton--primario" onClick={cola.limpiarFiltros}>Quitar filtros</button>
                </div>
            ) : (
                <div className="tabla-container">
                    <TablaCola filas={cola.filasPagina} categorias={categorias} seleccion={cola.seleccion}
                        onAlternar={cola.alternar} onAlternarPagina={cola.alternarPagina}
                        paginaCompleta={cola.paginaCompletaSeleccionada} ahora={ahora} />
                    <div className="tabla-footer">
                        <span className="tabla-info">
                            Mostrando {(cola.pagina - 1) * FILAS_POR_PAGINA + 1}–{(cola.pagina - 1) * FILAS_POR_PAGINA + cola.filasPagina.length} de {cola.total} tickets
                        </span>
                        <Paginacion pagina={cola.pagina} totalPaginas={Math.max(1, Math.ceil(cola.total / FILAS_POR_PAGINA))}
                            onCambiar={cola.setPagina} />
                    </div>
                </div>
            )}

            {cantidad > 0 && (
                <BarraLote cantidad={cantidad} onAsignar={() => setVentana('asignar')} onPrioridad={() => setVentana('prioridad')}
                    onDevolver={() => setVentana('devolver')} onQuitar={cola.limpiarSeleccion} />
            )}

            {ventana === 'asignar' && (
                <ModalAsignar seleccionados={cola.seleccionados} todos={tickets} onCerrar={() => setVentana(null)} onListo={terminar} />
            )}
            {ventana === 'prioridad' && (
                <ModalPrioridad seleccionados={cola.seleccionados} onCerrar={() => setVentana(null)} onListo={terminar} />
            )}
            <ConfirmDialog
                abierto={ventana === 'devolver'}
                titulo={`¿Devolver ${cantidad} ${cantidad === 1 ? 'ticket' : 'tickets'} a la cola?`}
                textoConfirmar="Devolver a la cola"
                destructivo
                onConfirmar={devolver}
                onCancelar={() => setVentana(null)}
            >
                Se quitará el técnico asignado y los tickets volverán al estado Abierto. La bitácora conserva el historial.
            </ConfirmDialog>
        </div>
    )
}

export default ColaAtencion
