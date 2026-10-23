import { useId, useState } from 'react'

// Campo de formulario con etiqueta y un solo mensaje (error, éxito o ayuda) junto al control.
function Campo({ etiqueta, error, exito, ayuda, tipo = 'text', opciones = [], placeholder, ...resto }) {
    const id = useId()
    const [visible, setVisible] = useState(false)
    const mensaje = error || exito || ayuda
    const comunes = { id, className: 'campo__control', 'aria-invalid': error ? 'true' : undefined, ...resto }

    let control
    if (tipo === 'select') {
        control = (
            <select {...comunes}>
                <option value="">{placeholder}</option>
                {opciones.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                ))}
            </select>
        )
    } else if (tipo === 'password') {
        control = (
            <div className="campo__envoltorio campo__envoltorio--clave">
                <input {...comunes} type={visible ? 'text' : 'password'} />
                <button type="button" className="campo__mostrar" aria-pressed={visible}
                    disabled={resto.disabled} onClick={() => setVisible(!visible)}>
                    {visible ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>
        )
    } else {
        control = (
            <div className="campo__envoltorio">
                <input {...comunes} type={tipo} placeholder={placeholder} />
                {exito && !error && <span className="campo__visto" aria-hidden="true">✓</span>}
            </div>
        )
    }

    let clase = 'campo'
    if (error) clase += ' campo--error'
    else if (exito) clase += ' campo--exito'

    let claseMensaje = 'campo__mensaje'
    if (error) claseMensaje += ' campo__mensaje--error'
    else if (exito) claseMensaje += ' campo__mensaje--exito'

    return (
        <div className={clase}>
            <label htmlFor={id} className="campo__etiqueta">{etiqueta}</label>
            {control}
            {mensaje && <p className={claseMensaje}>{mensaje}</p>}
        </div>
    )
}

export function CampoCasilla({ children, error, ...resto }) {
    const id = useId()
    return (
        <div className={error ? 'campo campo--error' : 'campo'}>
            <label htmlFor={id} className="casilla">
                <input id={id} type="checkbox" aria-invalid={error ? 'true' : undefined} {...resto} />
                <span>{children}</span>
            </label>
            {error && <p className="campo__mensaje campo__mensaje--error">{error}</p>}
        </div>
    )
}

export default Campo
