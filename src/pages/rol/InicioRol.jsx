import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ETIQUETA_ROL, MENU_POR_ROL, rutaInicio } from '../../data/navegacion'

// Pantalla de bienvenida del usuario: atajos a cada sección de su menú.
function InicioRol() {
    const { usuario } = useAuth()
    const accesos = MENU_POR_ROL[usuario.rol].items.filter(
        (item) => item.ruta !== rutaInicio(usuario.rol) && item.ruta !== '/cuenta'
    )

    return (
        <div>
            <h1>Hola, {usuario.nombres.split(' ')[0]}</h1>
            <p className="texto-aux">Entraste con el rol de {ETIQUETA_ROL[usuario.rol].toLowerCase()}.</p>

            <div className="rejilla-accesos">
                {accesos.map((acceso) => (
                    <Link key={acceso.ruta} to={acceso.ruta} className="tarjeta acceso">
                        <strong>{acceso.etiqueta}</strong>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default InicioRol
