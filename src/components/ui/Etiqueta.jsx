import { PRIORIDADES } from '../../data/contenidoPublico'
import { nombreEstado } from '../../data/tickets'
import './etiqueta.css'

// Cuadro pequeño con la prioridad o el estado de un ticket, con el color del sistema de diseño.
function Etiqueta({ tipo, valor }) {
    const texto = tipo === 'prioridad' ? PRIORIDADES.find((p) => p.id === valor).nombre : nombreEstado(valor)
    return <span className={`etiqueta etiqueta--${tipo}-${valor}`}>{texto}</span>
}

export default Etiqueta
