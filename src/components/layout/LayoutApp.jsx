import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useEncuestas } from '../../hooks/useEncuestas'
import { useTickets } from '../../hooks/useTickets'
import { CONTACTO } from '../../data/contenidoPublico'
import { ETIQUETA_ROL, MENU_POR_ROL, rutaInicio } from '../../data/navegacion'
import { listarTecnicos } from '../../services/catalogoService'
import { listarUsuarios } from '../../services/usuariosService'
import { encuestasDeUsuario } from '../../services/encuestasService'
import { resumenDeCola, resumenDeTecnico, resumenDeTickets, tecnicoDeUsuario } from '../../services/ticketsService'
import Avatar from '../ui/Avatar'
import BuscadorTicket from './BuscadorTicket'
import './app.css'

function LayoutApp() {
    const { usuario, cerrarSesion } = useAuth()
    const { info } = useToast()
    const menu = MENU_POR_ROL[usuario.rol]
    const inicio = rutaInicio(usuario.rol)
    const catalogo = useCatalogo()
    const tickets = useTickets()
    const encuestas = useEncuestas()
    // Los contadores del catálogo salen de los datos reales, para que cambien al crear o borrar.
    // Los contadores de tickets del usuario también salen de sus tickets reales (HU-3).
    const resumen = {
        ...usuario.resumen,
        ...(usuario.rol === 'usuario'
            ? { ...resumenDeTickets(tickets, usuario.id), encuestasRespondidas: encuestasDeUsuario(encuestas, usuario.id).length }
            : {}),
        ...(usuario.rol === 'tecnico' ? resumenDeTecnico(tickets, (tecnicoDeUsuario(usuario) ?? { id: usuario.id }).id) : {}),
        ...(usuario.rol === 'supervisor' ? { ...resumenDeCola(tickets), bandejas: listarTecnicos().length, usuarios: listarUsuarios().length } : {}),
        categorias: catalogo.categorias.length,
        ambientes: catalogo.ambientes.length,
    }
    // "Mi cuenta" va aparte, al pie del menú.
    const items = menu.items.filter((item) => item.ruta !== '/cuenta')

    function salir() {
        cerrarSesion()
        info('Cerraste sesión.')
    }

    return (
        <div className={'app app--' + usuario.rol}>
            <header className="app__cabecera">
                <Link className="app__marca" to={inicio}>
                    <span className="app__logo" aria-hidden="true" />
                    Mesa de Ayuda
                </Link>
                <BuscadorTicket />
                <span className="app__insignia">
                    {menu.insignia.etiqueta}
                    <strong>{resumen[menu.insignia.clave] ?? 0}</strong>
                </span>
                <div className="app__usuario">
                    <div className="app__usuario-datos">
                        <strong>{usuario.nombres} {usuario.apellidos}</strong>
                        <span>{ETIQUETA_ROL[usuario.rol]}</span>
                    </div>
                    <Avatar usuario={usuario} />
                </div>
            </header>

            <div className="app__cuerpo">
                <aside className="app__lateral">
                    <nav aria-label="Menú principal">
                        <p className="app__seccion">{menu.titulo}</p>
                        {items.map((item) => (
                            <NavLink key={item.ruta} to={item.ruta} end={item.ruta === inicio}>
                                <span>{item.etiqueta}</span>
                                {item.contador && <span className="app__contador">{resumen[item.contador] ?? 0}</span>}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="app__lateral-pie">
                        <NavLink to="/cuenta">Mi cuenta</NavLink>
                        <button type="button" onClick={salir}>Cerrar sesión</button>
                    </div>
                </aside>

                <div className="app__columna">
                    <main className="app__contenido">
                        <Outlet />
                    </main>
                    <footer className="app__pie">
                        <span>Mesa de Ayuda de Servicios del Campus · Universidad de Lima</span>
                        <span>{CONTACTO.correo} · anexo {CONTACTO.anexo} · Términos · Privacidad</span>
                    </footer>
                </div>
            </div>
        </div>
    )
}

export default LayoutApp
