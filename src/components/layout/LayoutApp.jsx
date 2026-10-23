import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { ETIQUETA_ROL, MENU_POR_ROL, rutaInicio } from '../../data/navegacion'
import './layout.css'

function LayoutApp() {
    const { usuario, cerrarSesion } = useAuth()
    const { info } = useToast()
    const menu = MENU_POR_ROL[usuario.rol]
    const inicio = rutaInicio(usuario.rol)

    function salir() {
        cerrarSesion()
        info('Cerraste sesión.')
    }

    return (
        <div className="app">
            <header className="app__cabecera">
                <Link className="app__marca" to={inicio}>Mesa de Ayuda</Link>
                <div className="app__usuario">
                    <strong>{usuario.nombres} {usuario.apellidos}</strong>
                    <span>{ETIQUETA_ROL[usuario.rol]}</span>
                </div>
            </header>

            <div className="app__cuerpo">
                <aside className="app__lateral">
                    <nav>
                        {menu.map((item) => (
                            <NavLink key={item.ruta} to={item.ruta} end={item.ruta === inicio}>
                                {item.etiqueta}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="app__lateral-pie">
                        <NavLink to="/cuenta">Mi cuenta</NavLink>
                        <button onClick={salir}>Cerrar sesión</button>
                    </div>
                </aside>

                <main className="app__contenido">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default LayoutApp
