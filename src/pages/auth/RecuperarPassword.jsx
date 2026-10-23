import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { restablecerPassword } from '../../services/authService'
import { REGEX_CORREO, validarConfirmacion, validarPassword } from '../../utils/validaciones'
import Campo from '../../components/ui/Campo'
import IndicadorFuerza from '../../components/ui/IndicadorFuerza'
import './auth.css'

const SEGUNDOS_REENVIO = 45
const PASOS = ['Tu correo', 'Enlace enviado', 'Nueva contraseña']

function validarCorreo(v) {
    const errores = {}
    if (!v.correo.trim()) errores.correo = 'Ingresa tu correo institucional.'
    else if (!REGEX_CORREO.test(v.correo.trim())) errores.correo = 'Escribe un correo válido.'
    return errores
}

function validarClave(v) {
    const errores = {}
    const errorPassword = validarPassword(v.password)
    if (errorPassword) errores.password = errorPassword
    const errorConfirmar = validarConfirmacion(v.password, v.confirmar)
    if (errorConfirmar) errores.confirmar = errorConfirmar
    return errores
}

function formatoCuenta(segundos) {
    return Math.floor(segundos / 60) + ':' + String(segundos % 60).padStart(2, '0')
}

// Flujo de tres pasos en una sola dirección. No se envían correos reales: el paso 2 ofrece un botón
// que simula abrir el enlace. Por seguridad, el paso 2 se muestra exista o no la cuenta.
function RecuperarPassword() {
    const { exito, info } = useToast()
    const navigate = useNavigate()
    const [paso, setPaso] = useState(1)
    const [segundos, setSegundos] = useState(SEGUNDOS_REENVIO)
    const [errorGlobal, setErrorGlobal] = useState('')

    const formCorreo = useFormulario({ correo: '' }, validarCorreo)
    const formClave = useFormulario({ password: '', confirmar: '' }, validarClave)

    // La cuenta regresiva solo corre mientras estamos en el paso 2.
    useEffect(() => {
        if (paso !== 2) return undefined
        const id = setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000)
        return () => clearInterval(id)
    }, [paso])

    function enviarEnlace(e) {
        e.preventDefault()
        if (formCorreo.validarTodo() > 0) return
        setSegundos(SEGUNDOS_REENVIO)
        setPaso(2)
    }

    function reenviar() {
        setSegundos(SEGUNDOS_REENVIO)
        info('Enviamos un nuevo enlace a tu correo.')
    }

    function guardar(e) {
        e.preventDefault()
        setErrorGlobal('')
        if (formClave.validarTodo() > 0) return

        const resultado = restablecerPassword(formCorreo.valores.correo, formClave.valores.password)

        if (resultado.ok) {
            exito('Contraseña actualizada. Ya puedes iniciar sesión.')
            navigate('/login')
        } else {
            setErrorGlobal('El enlace ya no es válido. Solicita uno nuevo.')
        }
    }

    return (
        <div className="auth auth--simple">
        <div className="tarjeta tarjeta--formulario auth__tarjeta auth__tarjeta--recuperar">
            <ol className="pasos" aria-label="Progreso">
                {PASOS.map((nombre, i) => {
                    const numero = i + 1
                    let estado = ''
                    if (numero === paso) estado = 'pasos__item--actual'
                    else if (numero < paso) estado = 'pasos__item--hecho'
                    return (
                        <li key={nombre} className={'pasos__item ' + estado} aria-current={numero === paso ? 'step' : undefined}>
                            <span className="pasos__numero">{numero < paso ? '✓' : numero}</span>
                            <span className="pasos__nombre">{nombre}</span>
                        </li>
                    )
                })}
            </ol>

            {paso === 1 && (
                <form className="formulario" onSubmit={enviarEnlace} noValidate>
                    <h1>Recuperar mi contraseña</h1>
                    <p className="texto-aux">Te enviaremos un enlace de restablecimiento válido por 30 minutos.</p>
                    <Campo etiqueta="Correo institucional" tipo="email"
                        ayuda="Si la cuenta existe recibirás el enlace; por seguridad no informamos lo contrario."
                        {...formCorreo.campo('correo')} />
                    <div className="formulario__acciones">
                        <button type="submit" className="boton boton--primario">Enviar enlace</button>
                        <Link to="/login" className="boton boton--terciario">Volver a iniciar sesión</Link>
                    </div>
                </form>
            )}

            {paso === 2 && (
                <div className="formulario">
                    <span className="icono-visto" aria-hidden="true">✓</span>
                    <h1>Revisa tu correo</h1>
                    <p className="texto-aux">
                        Enviamos el enlace a {formCorreo.valores.correo.trim()}. Vence en 30 minutos.
                    </p>
                    <button type="button" className="boton boton--terciario boton--izquierda" disabled={segundos > 0} onClick={reenviar}>
                        {segundos > 0 ? 'Reenviar enlace (disponible en ' + formatoCuenta(segundos) + ')' : 'Reenviar enlace'}
                    </button>
                    <p className="texto-aux">
                        Demostración: no se envían correos reales. Usa el botón para simular que abres el enlace.
                    </p>
                    <div className="formulario__acciones">
                        <button type="button" className="boton boton--primario" onClick={() => setPaso(3)}>
                            Abrir enlace del correo
                        </button>
                        <button type="button" className="boton boton--terciario" onClick={() => setPaso(1)}>Cambiar correo</button>
                    </div>
                </div>
            )}

            {paso === 3 && (
                <form className="formulario" onSubmit={guardar} noValidate>
                    <h1>Nueva contraseña</h1>
                    {errorGlobal && <p className="alerta-error">{errorGlobal}</p>}
                    <Campo etiqueta="Nueva contraseña" tipo="password" {...formClave.campo('password')} />
                    <IndicadorFuerza password={formClave.valores.password} />
                    <Campo etiqueta="Confirmar" tipo="password" {...formClave.campo('confirmar')} />
                    <button type="submit" className="boton boton--primario boton--bloque">Guardar contraseña</button>
                </form>
            )}
        </div>
        </div>
    )
}

export default RecuperarPassword
