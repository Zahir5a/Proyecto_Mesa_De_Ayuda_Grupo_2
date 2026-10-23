import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { validarConfirmacion, validarPassword } from '../../utils/validaciones'
import Campo from '../../components/ui/Campo'

const INICIAL = { actual: '', nueva: '', confirmar: '' }

function validar(v) {
    const errores = {}
    if (!v.actual) errores.actual = 'Ingresa tu contraseña actual.'

    const errorNueva = validarPassword(v.nueva)
    if (errorNueva) errores.nueva = errorNueva
    else if (v.nueva === v.actual) errores.nueva = 'La nueva contraseña debe ser distinta de la actual.'

    const errorConfirmar = validarConfirmacion(v.nueva, v.confirmar)
    if (errorConfirmar) errores.confirmar = errorConfirmar

    return errores
}

// Sección dentro de la tarjeta de Mi cuenta.
function CambiarPassword() {
    const { cambiarPassword } = useAuth()
    const { exito } = useToast()
    const form = useFormulario(INICIAL, validar)
    const [errorActual, setErrorActual] = useState('')

    function enviar(e) {
        e.preventDefault()
        setErrorActual('')
        if (form.validarTodo() > 0) return

        const resultado = cambiarPassword(form.valores.actual, form.valores.nueva)

        if (resultado.ok) {
            exito('Actualizaste tu contraseña.')
            form.reiniciar()
        } else {
            setErrorActual('La contraseña actual no es correcta.')
        }
    }

    const actual = form.campo('actual')

    return (
        <section>
            <h2>Cambiar contraseña</h2>
            <form className="formulario formulario__rejilla formulario__rejilla--tres" onSubmit={enviar} noValidate>
                <Campo etiqueta="Actual" tipo="password" {...actual} error={actual.error || errorActual || undefined} />
                <Campo etiqueta="Nueva" tipo="password"
                    ayuda="Mínimo 8 caracteres, con una mayúscula y un número." {...form.campo('nueva')} />
                <Campo etiqueta="Confirmar" tipo="password" {...form.campo('confirmar')} />

                <div className="formulario__ancho formulario__acciones">
                    <button type="submit" className="boton boton--primario">Actualizar contraseña</button>
                </div>
            </form>
        </section>
    )
}

export default CambiarPassword
