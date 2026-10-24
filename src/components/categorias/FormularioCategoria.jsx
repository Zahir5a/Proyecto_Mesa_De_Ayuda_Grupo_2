import { useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../ui/ConfirmDialog'
import { PRIORIDADES } from '../../data/contenidoPublico'
import './FormularioCategoria.css'

const VACIO = {
  nombre: '',
  padreId: '',
  prioridad: 'critica',
  tiempoEsperado: 0,
  descripcion: '',
  activa: true,
}

// Formulario para crear o editar una categoría o subcategoría.
// - inicial: los datos a editar (si no viene, es un alta)
// - categoriasPadre: categorías de primer nivel para el selector
// - onGuardar(datos): guarda y devuelve el resultado del servicio
function FormularioCategoria({
  inicial = null,
  ticketsAbiertos = 0,
  categoriasPadre,
  onCancelar,
  onGuardar,
  onEliminar,
}) {
  const editando = inicial !== null
  const [form, setForm] = useState(inicial ?? VACIO)
  const [errores, setErrores] = useState({})
  const [mostrarErrorGeneral, setMostrarErrorGeneral] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const titulo = form.padreId
    ? editando ? 'Editar subcategoría' : 'Nueva subcategoría'
    : editando ? 'Editar categoría' : 'Nueva categoría'

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
    } else if (form.nombre.trim().length > 60) {
      nuevosErrores.nombre = 'Usa 60 caracteres como máximo.'
    }
    const tiempo = Number(form.tiempoEsperado)
    if (!Number.isInteger(tiempo) || tiempo <= 0) {
      nuevosErrores.tiempoEsperado = 'Debe ser un número entero mayor que cero.'
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

    const resultado = onGuardar(form)
    if (resultado && !resultado.ok && resultado.motivo === 'nombre_repetido') {
      setErrores({ nombre: 'Ya existe una categoría con ese nombre en este nivel.' })
      setMostrarErrorGeneral(true)
    }
  }

  const cantidadErrores = Object.values(errores).filter(Boolean).length

  return (
    <div className="categoria-form-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/supervisor/categorias" className="breadcrumb-link">Categorías</Link>
        <span className="breadcrumb-sep">·</span>
        <span className="breadcrumb-current">{titulo}</span>
      </div>

      <h1 className="form-title">{titulo}</h1>

      {mostrarErrorGeneral && cantidadErrores > 0 && (
        <div className="form-alerta" role="alert">
          No se pudo guardar: revisa {cantidadErrores === 1 ? 'el campo marcado' : `los ${cantidadErrores} campos marcados`}.
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
              <label className="form-label" htmlFor="padreId">CATEGORÍA PADRE</label>
              <select
                id="padreId"
                className="form-select"
                value={form.padreId}
                disabled={editando}
                onChange={(e) => handleChange('padreId', e.target.value)}
              >
                <option value="">Sin categoría padre</option>
                {categoriasPadre.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              <span className="form-hint">
                {editando
                  ? 'No se puede cambiar de nivel una categoría ya creada.'
                  : 'Déjalo vacío para crear una categoría de primer nivel.'}
              </span>
            </div>

            {/* PRIORIDAD POR DEFECTO */}
            <div className="form-group">
              <label className="form-label">PRIORIDAD POR DEFECTO</label>
              <div className="prioridad-grupo">
                {PRIORIDADES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={form.prioridad === p.id}
                    className={`prioridad-btn prioridad-${p.id} ${
                      form.prioridad === p.id ? 'activo' : ''
                    }`}
                    onClick={() => handleChange('prioridad', p.id)}
                  >
                    {p.nombre}
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
                min="0"
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
                Se muestra al usuario al elegir la subcategoría. Máximo 240 caracteres ({form.descripcion.length}/240).
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
            {editando && (
              <button
                type="button"
                className="btn btn-peligro"
                disabled={ticketsAbiertos > 0}
                onClick={() => setConfirmarEliminar(true)}
              >
                Eliminar
              </button>
            )}
          </div>
          {editando && ticketsAbiertos > 0 && (
            <p className="form-hint form-hint--aparte">
              Tiene {ticketsAbiertos} tickets en curso: no se puede eliminar. Puedes desactivarla desde la lista.
            </p>
          )}
        </div>

        {/* Panel lateral informativo */}
        <aside className="form-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">Efecto del tiempo esperado</h3>
            <p className="sidebar-text">
              El tiempo esperado define cuándo un ticket aparece como fuera de plazo en la cola. Cambiarlo no altera los tickets ya abiertos.
            </p>
            <div className="sidebar-divider"></div>
            <h4 className="sidebar-subtitle">REFERENCIA ACTUAL</h4>
            <p className="sidebar-ref">
              {PRIORIDADES.map((p) => `${p.nombre} ${p.horas} h`).join(' · ')} hábiles
            </p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        abierto={confirmarEliminar}
        titulo={`¿Eliminar “${inicial ? inicial.nombre : ''}”?`}
        textoConfirmar="Eliminar"
        destructivo
        onConfirmar={onEliminar}
        onCancelar={() => setConfirmarEliminar(false)}
      >
        Se borra del catálogo y no se puede deshacer.
        {inicial && !inicial.padreId && ' También se borran sus subcategorías.'}
      </ConfirmDialog>
    </div>
  )
}

export default FormularioCategoria
