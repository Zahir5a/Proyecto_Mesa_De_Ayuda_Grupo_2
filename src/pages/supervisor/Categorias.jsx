// src/pages/supervisor/Categorias.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TablaCategoria from '../../components/categorias/TablaCategoria'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PRIORIDADES } from '../../data/contenidoPublico'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useToast } from '../../hooks/useToast'
import { cambiarEstadoCategoria, contarCategorias } from '../../services/catalogoService'
import { exportarCatalogo } from '../../utils/exportarCatalogo'
import '../../components/ui/estadoVacio.css'
import './catalogo.css'

function CategoriasPage() {
  const navigate = useNavigate()
  const { categorias } = useCatalogo()
  const { exito } = useToast()

  // Estados para los filtros
  const [busqueda, setBusqueda] = useState('')
  const [soloActivas, setSoloActivas] = useState(true)
  const [prioridad, setPrioridad] = useState('todas')

  // Categoría o subcategoría que se quiere desactivar y está pendiente de confirmación
  const [porDesactivar, setPorDesactivar] = useState(null)

  const { activas, subcategorias } = contarCategorias(categorias)
  const filtrosActivos = [busqueda.trim() !== '', soloActivas, prioridad !== 'todas'].filter(Boolean).length

  function limpiarFiltros() {
    setBusqueda('')
    setSoloActivas(false)
    setPrioridad('todas')
  }

  function cambiarEstado(fila, activar) {
    // Con tickets en curso hay que confirmar antes de desactivar
    if (!activar && fila.ticketsAbiertos > 0) {
      setPorDesactivar(fila)
      return
    }
    aplicarEstado(fila, activar)
  }

  function aplicarEstado(fila, activar) {
    cambiarEstadoCategoria(fila.id, activar)
    exito(`${fila.esCategoria ? 'Categoría' : 'Subcategoría'} “${fila.nombre}” ${activar ? 'activada' : 'desactivada'}.`)
    setPorDesactivar(null)
  }

  function exportar() {
    exportarCatalogo(categorias)
    exito('Exportamos el catálogo a un archivo CSV.')
  }

  // Catálogo vacío: se invita a crear la primera categoría
  if (categorias.length === 0) {
    return (
      <div className="categorias-page">
        <div className="estado-vacio">
          <span className="estado-vacio__icono" aria-hidden="true" />
          <h1>Aún no hay categorías de servicio</h1>
          <p>
            Crea la primera categoría para que la comunidad pueda registrar tickets. Puedes empezar con
            Audiovisuales y Redes.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/supervisor/categorias/nueva')}>
            Crear primera categoría
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="categorias-page">

      {/* 1. Encabezado */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Categorías de servicio</h1>
          <p className="page-subtitle">
            {activas} categorías activas · {subcategorias} subcategorías · la prioridad por defecto se aplica a cada ticket nuevo.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={exportar}>Exportar catálogo</button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/supervisor/categorias/nueva')}
          >
            Nueva categoría
          </button>
        </div>
      </div>

      {/* 2. Barra de filtros */}
      <div className="filtros-bar">
        <div className="filtros-izquierda">
          <input
            type="search"
            className="filtro-buscador"
            placeholder="Buscar categoría o subcategoría"
            aria-label="Buscar categoría o subcategoría"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <button
            className={soloActivas ? 'filtro-chip' : 'filtro-chip filtro-chip--apagado'}
            aria-pressed={soloActivas}
            onClick={() => setSoloActivas(!soloActivas)}
          >
            Solo activas {soloActivas && <span className="chip-x">×</span>}
          </button>

          <select
            className="filtro-select"
            aria-label="Filtrar por prioridad"
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
          >
            <option value="todas">Prioridad: todas</option>
            {PRIORIDADES.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filtros-derecha">
          <span className="filtros-info">
            Filtros activos: {filtrosActivos} · <button className="btn-limpiar" onClick={limpiarFiltros}>Limpiar</button>
          </span>
        </div>
      </div>

      {/* 3. Tabla */}
      <TablaCategoria
        categorias={categorias}
        busqueda={busqueda}
        soloActivas={soloActivas}
        prioridad={prioridad}
        onEditar={(id) => navigate(`/supervisor/categorias/${id}`)}
        onCambiarEstado={cambiarEstado}
      />

      {/* 4. Confirmación al desactivar algo con tickets en curso */}
      <ConfirmDialog
        abierto={porDesactivar !== null}
        titulo={`¿Desactivar “${porDesactivar ? porDesactivar.nombre : ''}”?`}
        textoConfirmar="Desactivar"
        destructivo
        onConfirmar={() => aplicarEstado(porDesactivar, false)}
        onCancelar={() => setPorDesactivar(null)}
      >
        Tiene {porDesactivar ? porDesactivar.ticketsAbiertos : 0} tickets en curso. Seguirán su atención hasta
        cerrarse, pero ya no se podrán registrar tickets nuevos en esta{' '}
        {porDesactivar && porDesactivar.esCategoria ? 'categoría' : 'subcategoría'}.
      </ConfirmDialog>
    </div>
  )
}

export default CategoriasPage
