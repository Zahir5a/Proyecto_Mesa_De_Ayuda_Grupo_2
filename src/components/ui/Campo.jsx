import { useId } from 'react'

function Campo({ etiqueta, error, ayuda, tipo = 'text', opciones = [], placeholder, ...resto }) {
    const id = useId()
    const mensaje = error || ayuda

    return (
        <div className={error ? 'campo campo--error' : 'campo'}>
            <label htmlFor={id} className="campo__etiqueta">{etiqueta}</label>

            {tipo === 'select' ? (
                <select id={id} className="campo__control" aria-invalid={error ? 'true' : undefined} {...resto}>
                    <option value="">{placeholder}</option>
                    {opciones.map((o) => (
                        <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                    ))}
                </select>
            ) : (
                <input id={id} type={tipo} className="campo__control" placeholder={placeholder}
                    aria-invalid={error ? 'true' : undefined} {...resto} />
            )}

            {mensaje && (
                <p className={error ? 'campo__mensaje campo__mensaje--error' : 'campo__mensaje'}>{mensaje}</p>
            )}
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
