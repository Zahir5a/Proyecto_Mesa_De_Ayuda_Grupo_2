import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { UNIDADES } from '../../data/catalogos'
import { validarTelefono } from '../../utils/validaciones'
import Campo from '../../components/ui/Campo'
import CambiarPassword from './CambiarPassword'

function validar(v) {
    const errores = {}
    if (!v.nombres.trim()) errores.nombres = 'Los nombres son obligatorios.'
    if (!v.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.'
    const errorTelefono = validarTelefono(v.telefono)
    if (errorTelefono) errores.telefono = errorTelefono
    if (!v.unidad) errores.unidad = 'Selecciona tu unidad o carrera.'
    return errores
}

function MiCuenta() {
    const { usuario, actualizarPerfil } = useAuth()
    const { exito } = useToast()
    const form = useFormulario(
        {
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            telefono: usuario.telefono,
            unidad: usuario.unidad,
        },
        validar
    )

    function guardar(e) {
        e.preventDefault()
        if (form.validarTodo() > 0) return

        const v = form.valores
        actualizarPerfil({
            nombres: v.nombres.trim(),
            apellidos: v.apellidos.trim(),
            telefono: v.telefono,
            unidad: v.unidad,
        })
        exito('Guardamos los cambios de tu cuenta.')
    }

    return (
        <div>
            <h1>Mi cuenta</h1>
            <p className="texto-aux">Tus datos se usan para contactarte durante la atención de un ticket.</p>

            <div className="tarjeta tarjeta--ancha">
                <h2>Datos personales</h2>
                <form className="formulario formulario__rejilla" onSubmit={guardar} noValidate>
                    <Campo etiqueta="Nombres" {...form.campo('nombres')} />
                    <Campo etiqueta="Apellidos" {...form.campo('apellidos')} />
                    <Campo etiqueta="Correo institucional" value={usuario.correo}
                        ayuda="No editable." readOnly disabled />
                    <Campo etiqueta="Teléfono" tipo="tel" {...form.campo('telefono')} />
                    <Campo etiqueta="Unidad o carrera" tipo="select" placeholder="Selecciona…"
                        opciones={UNIDADES} {...form.campo('unidad')} />

                    <div className="formulario__ancho formulario__acciones">
                        <button type="submit" className="boton boton--primario">Guardar cambios</button>
                    </div>
                </form>
            </div>

            <CambiarPassword />
        </div>
    )
}

export default MiCuenta
