// src/components/categorias/TablaCategoria.jsx
import { useState } from 'react'
import Paginacion from '../ui/Paginacion'
import { PRIORIDADES } from '../../data/contenidoPublico'
import './TablaCategoria.css'

const FILAS_POR_PAGINA = 13

function nombrePrioridad(id) {
  return PRIORIDADES.find(p => p.id === id).nombre
}

function TablaCategoria({ categorias, busqueda, soloActivas, prioridad, onEditar, onCambiarEstado }) {
  const [paginaActual, setPaginaActual] = useState(1)

  // 1. Filtros: una fila se muestra si cumple búsqueda, estado y prioridad
  const texto = busqueda.trim().toLowerCase()

  function cumple(item, activaEfectiva) {
    if (texto && !item.nombre.toLowerCase().includes(texto)) return false
    if (soloActivas && !activaEfectiva) return false
    if (prioridad !== 'todas' && item.prioridad !== prioridad) return false
    return true
  }

  // 2. Aplanar el árbol en una sola lista. Una categoría también se muestra si alguna
  // de sus subcategorías cumple, para que la subcategoría no quede sin contexto.
  const filas = []
  categorias.forEach(cat => {
    const activaCat = cat.estado === 'activa'
    const subsVisibles = cat.subcategorias.filter(sub => cumple(sub, activaCat && sub.estado === 'activa'))

    if (cumple(cat, activaCat) || subsVisibles.length > 0) {
      filas.push({ ...cat, esCategoria: true, activa: activaCat })
    }
    subsVisibles.forEach(sub => {
      filas.push({ ...sub, esCategoria: false, activa: activaCat && sub.estado === 'activa' })
    })
  })

  // 3. Paginación
  const totalFilas = filas.length
  const totalPaginas = Math.max(1, Math.ceil(totalFilas / FILAS_POR_PAGINA))
  // Si los filtros dejan menos páginas, volvemos a la última que exista
  const pagina = Math.min(paginaActual, totalPaginas)
  const inicio = (pagina - 1) * FILAS_POR_PAGINA
  const filasPagina = filas.slice(inicio, inicio + FILAS_POR_PAGINA)

  const totalCategorias = filas.filter(f => f.esCategoria).length
  const totalSubcategorias = totalFilas - totalCategorias

  return (
    <div className="tabla-container">
      <table className="tabla-categorias tabla-catalogo">
        <thead>
          <tr>
            <th>CATEGORÍA · SUBCATEGORÍA</th>
            <th>PRIORIDAD</th>
            <th>TIEMPO ESPERADO</th>
            <th>TICKETS ABIERTOS</th>
            <th>ESTADO</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {filasPagina.length === 0 && (
            <tr>
              <td colSpan={6} className="tabla-vacia">
                Ninguna categoría coincide con los filtros.
              </td>
            </tr>
          )}
          {filasPagina.map((fila) => (
            <tr key={fila.id} className={fila.esCategoria ? 'fila-categoria' : 'fila-subcategoria'}>
              <td className={fila.esCategoria ? 'nombre-categoria' : 'nombre-subcategoria'}>
                {fila.nombre}
              </td>
              <td>
                <span className={`badge prioridad-${fila.prioridad}`}>
                  {nombrePrioridad(fila.prioridad)}
                </span>
              </td>
              <td>{fila.tiempoEsperado} h hábiles</td>
              <td className="col-numero">{fila.ticketsAbiertos}</td>
              <td>
                <span className={`badge ${fila.activa ? 'estado-activa' : 'estado-inactiva'}`}>
                  {fila.activa ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className="col-acciones">
                <button className="btn-link btn-editar" onClick={() => onEditar(fila.id)}>
                  Editar
                </button>
                {fila.estado === 'activa' ? (
                  <button className="btn-link btn-desactivar" onClick={() => onCambiarEstado(fila, false)}>
                    Desactivar
                  </button>
                ) : (
                  <button className="btn-link btn-editar" onClick={() => onCambiarEstado(fila, true)}>
                    Activar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer con paginación */}
      <div className="tabla-footer">
        <span className="tabla-info">
          Mostrando {filasPagina.length} de {totalFilas} filas · {totalCategorias} categorías y {totalSubcategorias} subcategorías
        </span>
        <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPaginaActual} />
      </div>
    </div>
  )
}

export default TablaCategoria
