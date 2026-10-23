// src/components/categorias/TablaCategoria.jsx
import { useState } from 'react'
import datos from '../../data/catalogoCategorias.json'
import './TablaCategoria.css'

function TablaCategoria({ busqueda, soloActivas, prioridad }) {
  const { categorias } = datos
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
    // Filtro de prioridad
    if (prioridad !== 'todas' && fila.prioridad.toLowerCase() !== prioridad) {
      return false
    }
    return true
  })

  // 3. Paginación
  const totalFilas = filasFiltradas.length
  const totalPaginas = Math.ceil(totalFilas / filasPorPagina)
  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const filasPagina = filasFiltradas.slice(inicio, fin)

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
              <td>{fila.tiempoEsperado} hhábiles</td>
              <td className="col-numero">{fila.ticketsAbiertos}</td>
              <td>
                <span className="badge estado-activa">Activa</span>
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
           Mostrando 13 de 26 filas · 7 categorías y 19 subcategorías
        </span>
        <div className="paginacion">
            <button>Anterior</button>
            <button className="activo">1</button>
            <button>2</button>
            <button>Siguiente</button>
        </div>
      </div>
    </div>
  )
}

export default TablaCategoria