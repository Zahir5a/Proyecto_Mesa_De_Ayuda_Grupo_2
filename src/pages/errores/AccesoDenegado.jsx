import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { rutaInicio } from '../../data/navegacion'

function AccesoDenegado() {
    const { usuario } = useAuth()

    return (
        <div>
            <h1>403</h1>
            <p>No tienes permiso para ver esta sección.</p>
            <Link to={rutaInicio(usuario.rol)}>Ir a mi inicio</Link>
        </div>
    )
}

export default AccesoDenegado
