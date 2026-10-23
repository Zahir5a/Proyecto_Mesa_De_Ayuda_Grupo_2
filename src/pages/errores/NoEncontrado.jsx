import { Link } from 'react-router-dom'

function NoEncontrado() {
    return (
        <div>
            <h1>404</h1>
            <p>No encontramos esta pagina</p>
            <Link to="/">Ir al inicio</Link>
        </div>
    )
}

export default NoEncontrado