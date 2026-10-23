import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { crearInvitacion } from '../../services/invitacionesService'
import { validarCorreoInstitucional } from '../../utils/validaciones'
import { formatearFecha } from '../../utils/formato'
import Campo from '../ui/Campo'

function validar(v) {
    const errores = {}
    if (!v.nombres.trim()) errores.nombres = 'Los nombres son obligatorios.'
    if (!v.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.'
    const errorCorreo = validarCorreoInstitucional(v.correo)
    if (errorCorreo) errores.correo = errorCorreo
    return errores
}

const MOTIVOS = {
    correo_en_uso: 'Ese correo ya tiene una cuenta.',
    ya_invitado: 'Ese correo ya tiene una invitación pendiente.',
}

// Formulario y, una vez creada la invitación, el enlace que el supervisor debe compartir.
function ContenidoInvitar({ onCerrar }) {
    const { usuario } = useAuth()
    const { exito } = useToast()
    const form = useFormulario({ nombres: '', apellidos: '', correo: '' }, validar)
    const [errorCorreo, setErrorCorreo] = useState('')
    const [invitacion, setInvitacion] = useState(null)
    const [copiado, setCopiado] = useState(false)

    function enviar(e) {
        e.preventDefault()
        setErrorCorreo('')
        if (form.validarTodo() > 0) return

        const resultado = crearInvitacion({
            ...form.valores,
            invitadoPor: usuario.nombres + ' ' + usuario.apellidos,
        })
        if (!resultado.ok) {
            setErrorCorreo(MOTIVOS[resultado.motivo])
            return
        }
        setInvitacion(resultado.invitacion)
        exito(`Invitación creada para ${resultado.invitacion.nombres} ${resultado.invitacion.apellidos}.`)
    }

    async function copiar(enlace) {
        try {
            await navigator.clipboard.writeText(enlace)
            setCopiado(true)
        } catch {
            // sin permiso para el portapapeles: el enlace sigue visible para copiarlo a mano
        }
    }

    if (invitacion) {
        const enlace = window.location.origin + '/invitacion/' + invitacion.token
        return (
            <div>
                <p className="modal__texto">
                    No enviamos correos desde esta versión: comparte este enlace con {invitacion.nombres}. Vence el{' '}
                    {formatearFecha(invitacion.venceEl + 'T00:00:00')}.
                </p>
                <input className="campo__control" readOnly value={enlace} aria-label="Enlace de invitación"
                    onFocus={(e) => e.target.select()} />
                <div className="modal__acciones modal__acciones--separadas">
                    <button type="button" className="boton" onClick={() => copiar(enlace)}>
                        {copiado ? 'Copiado ✓' : 'Copiar enlace'}
                    </button>
                    <button type="button" className="boton boton--primario" onClick={onCerrar}>Listo</button>
                </div>
            </div>
        )
    }

    const correo = form.campo('correo')

    return (
        <form onSubmit={enviar} noValidate>
            <div className="modal__rejilla">
                <Campo etiqueta="Nombres" autoFocus {...form.campo('nombres')} />
                <Campo etiqueta="Apellidos" {...form.campo('apellidos')} />
                <div className="modal__ancho">
                    <Campo etiqueta="Correo institucional" tipo="email" placeholder="nombre@ulima.edu.pe" {...correo}
                        error={correo.error || errorCorreo || undefined} />
                </div>
            </div>
            <div className="modal__acciones">
                <button type="button" className="boton" onClick={onCerrar}>Cancelar</button>
                <button type="submit" className="boton boton--primario">Crear invitación</button>
            </div>
        </form>
    )
}

// Ventana para invitar a un técnico: al aceptar, elige su especialidad (HU-1).
function ModalInvitarTecnico({ abierto, onCerrar }) {
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
                onCerrar()
            }}
            onClick={(e) => e.target === ref.current && onCerrar()}
        >
            <div className="modal__cabecera">
                <h2 className="modal__titulo">Invitar técnico</h2>
                <button type="button" className="modal__cerrar" aria-label="Cerrar" onClick={onCerrar}>×</button>
            </div>
            {abierto && <ContenidoInvitar onCerrar={onCerrar} />}
        </dialog>
    )
}

export default ModalInvitarTecnico
