import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { CONTACTO } from '../../data/contenidoPublico'
import { ACCESO_PRINCIPAL, ETIQUETA_ROL, EXCLUSIVO_DE, buscarItem } from '../../data/navegacion'
import './errores.css'

// Vista 403: se dibuja dentro del marco con menú, en lugar de la pantalla que se intentó abrir.
function AccesoDenegado({ rolesPermitidos = [] }) {
    const { usuario } = useAuth()
    const { pathname } = useLocation()
    const rolRequerido = rolesPermitidos[0]
    const item = buscarItem(rolRequerido, pathname)
    const acceso = ACCESO_PRINCIPAL[usuario.rol]

    return (
        <div className="tarjeta estado-pagina">
            <span className="estado-pagina__codigo estado-pagina__codigo--error">403</span>
            <h1>No tienes permiso para ver {item ? item.permiso : 'esta sección'}</h1>
            <p className="texto-aux">
                Tu cuenta tiene el rol de {ETIQUETA_ROL[usuario.rol].toLowerCase()}. {EXCLUSIVO_DE[rolRequerido]} Si
                necesitas ese acceso, solicítalo a Infraestructura y Servicios.
            </p>
            <div className="formulario__acciones">
                <Link to={acceso.ruta} className="boton boton--primario">{acceso.etiqueta}</Link>
                <a href={'mailto:' + CONTACTO.correo + '?subject=Solicitud de acceso'} className="boton">Solicitar acceso</a>
            </div>
        </div>
    )
}

export default AccesoDenegado
