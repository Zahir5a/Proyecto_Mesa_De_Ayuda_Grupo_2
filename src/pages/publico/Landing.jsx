import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

function Landing() {
    const { usuario } = useAuth()
    return (
        <div>
            <h1>Reporta una falla del campus</h1>
            <p>Sigue su atención en un solo lugar.</p>
            <p>{usuario ? 'Sesión de ' + usuario.nombres : 'Sin sesión iniciada'}</p>
            <Link to="/login">Iniciar sesión</Link>
        </div>
    )
}

export default Landing
