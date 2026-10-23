import { Link } from 'react-router-dom'
import './errores.css'

// Vista 404: se dibuja dentro del marco público (cabecera y pie).
function NoEncontrado() {
    return (
        <div className="tarjeta estado-pagina">
            <span className="estado-pagina__codigo">404</span>
            <h1>No encontramos esta página</h1>
            <p className="texto-aux">
                El enlace puede haber cambiado. Si buscabas un ticket, ingresa su código en el buscador de tu panel.
            </p>
            <div className="formulario__acciones">
                <Link to="/" className="boton boton--primario">Ir al inicio</Link>
                <Link to="/usuario/tickets" className="boton">Buscar un ticket</Link>
            </div>
        </div>
    )
}

export default NoEncontrado
