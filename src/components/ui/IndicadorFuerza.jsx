import { ETIQUETA_FUERZA, fuerzaPassword } from '../../utils/validaciones'

// Tres barras que se llenan según qué tan segura es la contraseña escrita.
function IndicadorFuerza({ password }) {
    const nivel = fuerzaPassword(password)

    return (
        <div className={`fuerza fuerza--${nivel}`} aria-live="polite">
            <div className="fuerza__barras" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                    <span key={n} className={n <= nivel ? 'activa' : ''} />
                ))}
            </div>
            <span className="fuerza__texto">{ETIQUETA_FUERZA[nivel]}</span>
        </div>
    )
}

export default IndicadorFuerza
