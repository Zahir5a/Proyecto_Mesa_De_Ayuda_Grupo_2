// src/pages/supervisor/Categorias.jsx
import { useState } from 'react'
import CategoriaTabla from '../../components/categorias/TablaCategoria'
import NuevaSubcategoria from '../../components/categorias/NuevaSubcategoria'
import datosCatalogo from '../../data/catalogoCategorias.json'
import './categorias.css'

function CategoriasPage() {
  // Estados para los filtros
  const [busqueda, setBusqueda] = useState('')
  const [soloActivas, setSoloActivas] = useState(true)
  const [prioridad, setPrioridad] = useState('todas')

  // ⭐ Estado para alternar entre tabla y formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // ⭐ NUEVO: Estado con las categorías (inicializado con el JSON)
  const [categorias, setCategorias] = useState(datosCatalogo.categorias)

  // ⭐ FUNCIÓN para agregar una nueva subcategoría
  const handleGuardar = (nuevaSub) => {
    // 1. Buscamos la categoría padre por su nombre
    const categoriaPadre = categorias.find(c => c.nombre === nuevaSub.categoriaPadre)

    // 2. Si no existe categoría padre, creamos una nueva categoría de primer nivel
    if (!categoriaPadre) {
      const nuevaCategoria = {
        id: categorias.length + 1,
        nombre: nuevaSub.nombre,
        prioridad: nuevaSub.prioridad,
        tiempoEsperado: Number(nuevaSub.tiempoEsperado),
        ticketsAbiertos: 0,
        estado: nuevaSub.activa ? 'activa' : 'inactiva',
        subcategorias: []
      }
      // ⭐ Spread operator: creamos un nuevo arreglo con la categoría agregada
      setCategorias([...categorias, nuevaCategoria])
    } else {
      // 3. Si sí existe, le agregamos la subcategoría
      // ⭐ Spread operator + map: creamos un nuevo arreglo con la categoría actualizada
      const categoriasActualizadas = categorias.map(c => {
        if (c.nombre === nuevaSub.categoriaPadre) {
          const nuevaSubcategoria = {
            id: Date.now(), // ID único basado en la fecha
            nombre: nuevaSub.nombre,
            prioridad: nuevaSub.prioridad,
            tiempoEsperado: Number(nuevaSub.tiempoEsperado),
            ticketsAbiertos: 0,
            estado: nuevaSub.activa ? 'activa' : 'inactiva'
          }
          // ⭐ Spread operator: copiamos la categoría y le agregamos la subcategoría
          return {
            ...c,
            subcategorias: [...c.subcategorias, nuevaSubcategoria]
          }
        }
        return c
      })
      setCategorias(categoriasActualizadas)
    }

    // 4. Volvemos a la tabla
    setMostrarFormulario(false)
  }

  // Si está en modo formulario, mostrar el formulario
  if (mostrarFormulario) {
    return (
      <div className="categorias-page">
        <NuevaSubcategoria
          onCancelar={() => setMostrarFormulario(false)}
          onGuardar={handleGuardar}
        />
      </div>
    )
  }

  // Si NO está en modo formulario, mostrar la tabla
  return (
    <div className="categorias-page">
      
      {/* 1. Encabezado */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Categorías de servicio</h1>
          <p className="page-subtitle">
            7 categorías activas · 19 subcategorías · la prioridad por defecto se aplica a cada ticket nuevo.
          </p>
        </div>
        
        <div className="page-actions">
          <button className="btn btn-secondary">Exportar catálogo</button>
          <button 
            className="btn btn-primary" 
            onClick={() => setMostrarFormulario(true)}
          >
            Nueva categoría
          </button>
        </div>
      </div>

      {/* 2. Barra de filtros */}
      <div className="filtros-bar">
        <div className="filtros-izquierda">
          <input 
            type="text" 
            className="filtro-buscador"
            placeholder="Buscar categoría o subcategoría"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          
          {soloActivas && (
            <button className="filtro-chip" onClick={() => setSoloActivas(false)}>
              Solo activas <span className="chip-x">×</span>
            </button>
          )}
          
          <select 
            className="filtro-select"
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
          >
            <option value="todas">Prioridad: todas</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        
        <div className="filtros-derecha">
          <span className="filtros-info">
            Filtros activos: 1 · <button className="btn-limpiar">Limpiar</button>
          </span>
        </div>
      </div>

      {/* 3. Tabla - ⭐ Pasamos las categorías como prop */}
      <CategoriaTabla 
        categorias={categorias}
        busqueda={busqueda}
        soloActivas={soloActivas}
        prioridad={prioridad}
      />
      
    </div>
  )
}

export default CategoriasPage