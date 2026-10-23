import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ETIQUETA_ROL, MENU_POR_ROL, rutaInicio } from '../../data/navegacion'

// Pantalla a la que lleva el login según el rol. Es provisional: cada historia
// (tickets, cola, catálogo…) reemplazará su parte; mientras tanto lista los accesos del rol.
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
                        <span className="insignia insignia--gris">En construcción</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default InicioRol
