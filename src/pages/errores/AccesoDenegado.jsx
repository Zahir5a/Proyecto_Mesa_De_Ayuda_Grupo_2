import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { CONTACTO } from '../../data/contenidoPublico'
import { ETIQUETA_ROL, rutaInicio } from '../../data/navegacion'
import './errores.css'

// Vista 403: se dibuja dentro del marco con menú, en lugar de la pantalla que se intentó abrir.
function AccesoDenegado({ rolesPermitidos = [] }) {
    const { usuario } = useAuth()
    const exclusiva = rolesPermitidos.map((r) => ETIQUETA_ROL[r].toLowerCase()).join(' o ')

    return (
        <div className="tarjeta estado-pagina">
            <span className="estado-pagina__codigo estado-pagina__codigo--error">403</span>
            <h1>No tienes permiso para ver esta sección</h1>
            <p className="texto-aux">
                Tu cuenta tiene el rol de {ETIQUETA_ROL[usuario.rol].toLowerCase()}.
                {exclusiva && ' Esta sección es exclusiva del ' + exclusiva + '.'} Si necesitas ese acceso,
                solicítalo a Infraestructura y Servicios.
            </p>
            <div className="formulario__acciones">
                <Link to={rutaInicio(usuario.rol)} className="boton boton--primario">Ir a mi inicio</Link>
                <a href={'mailto:' + CONTACTO.correo + '?subject=Solicitud de acceso'} className="boton">Solicitar acceso</a>
            </div>
        </div>
    )
}

export default AccesoDenegado
