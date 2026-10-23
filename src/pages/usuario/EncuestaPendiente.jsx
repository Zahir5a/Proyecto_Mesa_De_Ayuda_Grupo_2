import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTickets } from '../../hooks/useTickets'
import { esperaEncuesta, ticketsDeUsuario } from '../../services/ticketsService'
import '../../components/ui/estadoVacio.css'

// "Encuesta pendiente" del menú: lleva a la encuesta del ticket cerrado más antiguo que sigue en plazo.
function EncuestaPendiente() {
    const { usuario } = useAuth()
    const pendientes = ticketsDeUsuario(useTickets(), usuario.id)
        .filter(esperaEncuesta)
        .sort((a, b) => new Date(a.cerradoEn) - new Date(b.cerradoEn))

    if (pendientes.length > 0) return <Navigate to={`/usuario/encuesta/${pendientes[0].codigo}`} replace />

    return (
        <div className="estado-vacio">
            <span className="estado-vacio__icono" aria-hidden="true" />
            <h1>No tienes encuestas pendientes</h1>
            <p>Cuando se cierre uno de tus tickets te pediremos calificar la atención.</p>
            <Link to="/usuario/encuestas" className="boton boton--primario">Ver mis encuestas</Link>
        </div>
    )
}

export default EncuestaPendiente
