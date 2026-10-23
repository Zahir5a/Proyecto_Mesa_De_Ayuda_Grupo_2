// src/components/categorias/TablaCategoria.jsx
import { useState } from 'react'
import './TablaCategoria.css'

function TablaCategoria({ categorias, busqueda, soloActivas, prioridad }) {
  const [paginaActual, setPaginaActual] = useState(1)
  const filasPorPagina = 13

  // 1. Aplanar categorías y subcategorías en una sola lista
  const filas = []
  categorias.forEach(cat => {
    filas.push({ ...cat, esCategoria: true, parentId: null })
    cat.subcategorias.forEach(sub => {
      filas.push({ ...sub, esCategoria: false, parentId: cat.id, categoriaNombre: cat.nombre })
    })
  })

  // 2. Aplicar filtros (Semana 4: filter)
  const filasFiltradas = filas.filter(fila => {
    // Filtro de búsqueda
    if (busqueda && !fila.nombre.toLowerCase().includes(busqueda.toLowerCase())) {
      return false
    }
    // Filtro de solo activas
    if (soloActivas && fila.estado !== 'activa') {
      return false
    }
    // Filtro de prioridad
    if (prioridad !== 'todas' && fila.prioridad.toLowerCase() !== prioridad) {
      return false
    }
    return true
  })

  // 3. Paginación
  const totalFilas = filasFiltradas.length
  const totalPaginas = Math.max(1, Math.ceil(totalFilas / filasPorPagina))
  // Si los filtros dejan menos páginas, volvemos a la última que exista
  const pagina = Math.min(paginaActual, totalPaginas)
  const inicio = (pagina - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const filasPagina = filasFiltradas.slice(inicio, fin)

  const totalCategorias = filasFiltradas.filter(f => f.esCategoria).length
  const totalSubcategorias = totalFilas - totalCategorias

  return (
    <div className="tabla-container">
      <table className="tabla-categorias">
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
          {filasPagina.map((fila) => (
            <tr key={fila.id} className={fila.esCategoria ? 'fila-categoria' : 'fila-subcategoria'}>
              <td className={fila.esCategoria ? 'nombre-categoria' : 'nombre-subcategoria'}>
                {fila.nombre}
              </td>
              <td>
                <span className={`badge prioridad-${fila.prioridad.toLowerCase()}`}>
                  {fila.prioridad}
                </span>
              </td>
              <td>{fila.tiempoEsperado} h hábiles</td>
              <td className="col-numero">{fila.ticketsAbiertos}</td>
              <td>
                <span className={`badge estado-${fila.estado}`}>
                  {fila.estado === 'activa' ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className="col-acciones">
                <button className="btn-link btn-editar">Editar</button>
                <button className="btn-link btn-desactivar">Desactivar</button>
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
        <div className="paginacion">
          <button disabled={pagina === 1} onClick={() => setPaginaActual(pagina - 1)}>
            Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
            <button
              key={numero}
              className={numero === pagina ? 'activo' : ''}
              onClick={() => setPaginaActual(numero)}
            >
              {numero}
            </button>
          ))}
          <button disabled={pagina === totalPaginas} onClick={() => setPaginaActual(pagina + 1)}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}

export default TablaCategoria
