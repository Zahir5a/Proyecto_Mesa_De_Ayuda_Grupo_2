import { useEffect, useRef, useState } from 'react'
import { useFormulario } from '../../hooks/useFormulario'
import { TIPOS_AMBIENTE } from '../../services/catalogoService'
import Campo from '../ui/Campo'

const TIPOS = TIPOS_AMBIENTE.map((tipo) => ({ valor: tipo, etiqueta: tipo }))

function validar(v) {
    const errores = {}
    const codigo = v.codigo.trim()
    if (!codigo) errores.codigo = 'El código es obligatorio.'
    else if (!/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/.test(codigo)) errores.codigo = 'Usa letras, números y guiones. Ejemplo: H-212.'
    else if (codigo.length > 12) errores.codigo = 'Usa 12 caracteres como máximo.'

    if (!v.tipo) errores.tipo = 'Selecciona el tipo de ambiente.'
    if (!v.pabellon.trim()) errores.pabellon = 'El pabellón es obligatorio.'
    if (!v.sede.trim()) errores.sede = 'La sede es obligatoria.'

    const piso = Number(v.piso)
    if (v.piso === '' || !Number.isInteger(piso) || piso < 1 || piso > 15) errores.piso = 'Un número de 1 a 15.'

    const capacidad = Number(v.capacidad)
    if (v.capacidad === '' || !Number.isInteger(capacidad) || capacidad < 1 || capacidad > 1000) {
        errores.capacidad = 'Un número de 1 a 1000.'
    }
    return errores
}

// Formulario dentro del modal. Se crea de nuevo cada vez que el modal se abre, así empieza limpio.
function FormularioAmbiente({ ambiente, onGuardar, onCancelar }) {
    const form = useFormulario(
        {
            codigo: ambiente ? ambiente.codigo : '',
            tipo: ambiente ? ambiente.tipo : '',
            pabellon: ambiente ? ambiente.pabellon : '',
            piso: ambiente ? String(ambiente.piso) : '',
            sede: ambiente ? ambiente.sede : 'Campus Monterrico',
            capacidad: ambiente ? String(ambiente.capacidad) : '',
        },
        validar
    )
    const [codigoRepetido, setCodigoRepetido] = useState(false)

    function enviar(e) {
        e.preventDefault()
        if (form.validarTodo() > 0) return

        const resultado = onGuardar(form.valores)
        if (!resultado.ok) setCodigoRepetido(true)
    }

    const codigo = form.campo('codigo')

    return (
        <form onSubmit={enviar} noValidate>
            <div className="modal__rejilla">
                <Campo etiqueta="Código" placeholder="H-212" autoFocus {...codigo}
                    onChange={(e) => { setCodigoRepetido(false); codigo.onChange(e) }}
                    error={codigo.error || (codigoRepetido ? 'Ya existe un ambiente con ese código.' : undefined)} />
                <Campo etiqueta="Tipo" tipo="select" placeholder="Selecciona…" opciones={TIPOS} {...form.campo('tipo')} />
                <Campo etiqueta="Pabellón" placeholder="H" {...form.campo('pabellon')} />
                <Campo etiqueta="Piso" tipo="number" min="1" placeholder="2" {...form.campo('piso')} />
                <Campo etiqueta="Sede" {...form.campo('sede')} />
                <Campo etiqueta="Capacidad" tipo="number" min="1" placeholder="30" {...form.campo('capacidad')} />
            </div>
            <div className="modal__acciones">
                <button type="button" className="boton" onClick={onCancelar}>Cancelar</button>
                <button type="submit" className="boton boton--primario">Guardar ambiente</button>
            </div>
        </form>
    )
}

// Ventana para registrar (ambiente = null) o editar un ambiente.
function ModalAmbiente({ abierto, ambiente, onGuardar, onCancelar }) {
    const ref = useRef(null)

    useEffect(() => {
        const dialogo = ref.current
        if (abierto && !dialogo.open) dialogo.showModal()
        if (!abierto && dialogo.open) dialogo.close()
    }, [abierto])

    return (
        <dialog
            ref={ref}
            className="modal modal--ancho"
            onCancel={(e) => {
                e.preventDefault()
                onCancelar()
            }}
            onClick={(e) => e.target === ref.current && onCancelar()}
        >
            <div className="modal__cabecera">
                <h2 className="modal__titulo">{ambiente ? 'Editar ambiente' : 'Nuevo ambiente'}</h2>
                <button type="button" className="modal__cerrar" aria-label="Cerrar" onClick={onCancelar}>×</button>
            </div>
            {abierto && (
                <FormularioAmbiente
                    key={ambiente ? ambiente.codigo : 'nuevo'}
                    ambiente={ambiente}
                    onGuardar={onGuardar}
                    onCancelar={onCancelar}
                />
            )}
        </dialog>
    )
}

export default ModalAmbiente
