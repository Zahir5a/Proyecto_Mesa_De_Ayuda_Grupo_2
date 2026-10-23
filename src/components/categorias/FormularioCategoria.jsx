import { useState } from 'react'
import './NuevaSubcategoria.css'

function NuevaSubcategoria({ onCancelar, onGuardar }) {
  const [form, setForm] = useState({
    nombre: '',
    categoriaPadre: '',
    prioridad: 'Critica',
    tiempoEsperado: 0,
    descripcion: '',
    activa: true,
  })

  const [errores, setErrores] = useState({})
  const [mostrarErrorGeneral, setMostrarErrorGeneral] = useState(false)

  const categoriasPadre = [
    { id: 1, nombre: 'Audiovisuales' },
    { id: 2, nombre: 'Climatización' },
    { id: 3, nombre: 'Redes y conectividad' },
    { id: 4, nombre: 'Mobiliario' },
  ]

  const prioridades = ['Critica', 'Alta', 'Media', 'Baja']

  const handleChange = (campo, valor) => {
    setForm({ ...form, [campo]: valor })
    if (errores[campo]) {
      setErrores({ ...errores, [campo]: null })
    }
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.'
    }
    if (Number(form.tiempoEsperado) <= 0) {
      nuevosErrores.tiempoEsperado = 'Debe ser un número mayor que cero.'
    }
    return nuevosErrores
  }

  const handleGuardar = () => {
    const nuevosErrores = validar()
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setMostrarErrorGeneral(true)
      return
    }
    if (onGuardar) onGuardar(form)
  }

  return (
    <div className="categoria-form-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link">Categorías</span>
        <span className="breadcrumb-sep">·</span>
        <span className="breadcrumb-current">Nueva subcategoría</span>
      </div>

      <h1 className="form-title">Nueva subcategoría</h1>

      {mostrarErrorGeneral && (
        <div className="alerta-error">
          No se pudo guardar: revisa los {Object.keys(errores).length} campos marcados.
        </div>
      )}

      <div className="form-layout">
        {/* Formulario principal */}
        <div className="form-card">
          <div className="form-grid">
            {/* NOMBRE */}
            <div className={`form-group ${errores.nombre ? 'con-error' : ''}`}>
              <label className="form-label" htmlFor="nombre">NOMBRE</label>
              <input
                type="text"
                id="nombre"
                className="form-input"
                placeholder="Escribe el nombre"
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
              />
              {errores.nombre && <span className="form-error">{errores.nombre}</span>}
            </div>

            {/* CATEGORÍA PADRE */}
            <div className="form-group">
              <label className="form-label" htmlFor="categoriaPadre">CATEGORÍA PADRE</label>
              <select
                id="categoriaPadre"
                className="form-select"
                value={form.categoriaPadre}
                onChange={(e) => handleChange('categoriaPadre', e.target.value)}
              >
                <option value="">Audiovisuales</option>
                {categoriasPadre.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
              <span className="form-hint">Déjalo vacío para crear una categoría de primer nivel.</span>
            </div>

            {/* PRIORIDAD POR DEFECTO */}
            <div className="form-group">
              <label className="form-label">PRIORIDAD POR DEFECTO</label>
              <div className="prioridad-grupo">
                {prioridades.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`prioridad-btn prioridad-${p.toLowerCase()} ${
                      form.prioridad === p ? 'activo' : ''
                    }`}
                    onClick={() => handleChange('prioridad', p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* TIEMPO ESPERADO */}
            <div className={`form-group ${errores.tiempoEsperado ? 'con-error' : ''}`}>
              <label className="form-label" htmlFor="tiempoEsperado">TIEMPO ESPERADO (HORAS)</label>
              <input
                type="number"
                id="tiempoEsperado"
                className="form-input"
                value={form.tiempoEsperado}
                onChange={(e) => handleChange('tiempoEsperado', e.target.value)}
              />
              {errores.tiempoEsperado && (
                <span className="form-error">{errores.tiempoEsperado}</span>
              )}
            </div>

            {/* DESCRIPCIÓN */}
            <div className="form-group full-width">
              <label className="form-label" htmlFor="descripcion">DESCRIPCIÓN</label>
              <textarea
                id="descripcion"
                className="form-textarea"
                placeholder="Falla del extensor HDMI que impide proyectar aunque el equipo encienda. Requiere revisión del rack del piso."
                value={form.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                maxLength={240}
              />
              <span className="form-hint">
                Se muestra al usuario al elegir la subcategoría. Máximo 240 caracteres.
              </span>
            </div>

            {/* CHECKBOX ACTIVA */}
            <div className="form-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) => handleChange('activa', e.target.checked)}
                />
                <span>Categoría activa · disponible al registrar tickets</span>
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={handleGuardar}>
              Guardar categoría
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
          </div>
        </div>

        {/* Panel lateral informativo */}
        <aside className="form-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">Efecto del tiempo esperado</h3>
            <p className="sidebar-text">
              El tiempo esperado define cuándo un ticket aparece como fuera de plazo en la cola y en el tablero. Cambiarlo no altera los tickets ya abiertos.
            </p>
            <div className="sidebar-divider"></div>
            <h4 className="sidebar-subtitle">REFERENCIA ACTUAL</h4>
            <p className="sidebar-ref">
              Crítica 2 h · Alta 8 h · Media 24 h · Baja 72 h hábiles
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default NuevaSubcategoria