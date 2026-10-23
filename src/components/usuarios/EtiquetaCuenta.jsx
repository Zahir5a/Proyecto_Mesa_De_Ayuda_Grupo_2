import { ESTADOS_CUENTA, ROLES } from '../../utils/cuentas'
import './usuarios.css'

// Cuadro pequeño con el rol o el estado de una cuenta.
function EtiquetaCuenta({ tipo, valor }) {
    const lista = tipo === 'rol' ? ROLES : ESTADOS_CUENTA
    return <span className={`etiqueta etiqueta--cuenta-${tipo}-${valor}`}>{lista.find((x) => x.id === valor).nombre}</span>
}

export default EtiquetaCuenta
