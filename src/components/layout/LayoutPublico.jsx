import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { rutaInicio } from '../../data/navegacion'
import FooterPublico from './FooterPublico'
import './layout.css'

function LayoutPublico() {
    const { usuario, cerrarSesion } = useAuth()
    const { info } = useToast()

    function salir() {
        cerrarSesion()
        info('Cerraste sesión.')
    }

    return (
        <div className='publico'>
            <header className='cabecera'>
                <Link className='cabecera__marca' to='/'>
                    <span className='marca__logo' aria-hidden='true' />
                    <span>Mesa de Ayuda <span className='marca__sub'>· Campus Ulima</span></span>
                </Link>
                <nav className='cabecera__nav' aria-label='Principal'>
                    <NavLink to='/' end>Inicio</NavLink>
                    <NavLink to='/como-reportar'>Cómo reportar</NavLink>
                    <Link to='/como-reportar#categorias'>Categorías de servicio</Link>
                    <Link to='/como-reportar#tiempos'>Tiempos de atención</Link>
                </nav>
                <div className='cabecera__acciones'>
                    {usuario ? (
                        <>
                            <Link to={rutaInicio(usuario.rol)} className='boton boton--primario boton--chico'>Ir a mi panel</Link>
                            <button className='boton boton--chico' onClick={salir}>Cerrar sesión</button>
                        </>
                    ) : (
                        <>
                            <Link to='/login' className='boton boton--chico'>Iniciar sesión</Link>
                            <Link to='/registro' className='boton boton--primario boton--chico'>Registrarme</Link>
                        </>
                    )}
                </div>
            </header>
            <main className='contenido'>
                <Outlet />
            </main>
            <FooterPublico />
        </div>
    )
}

export default LayoutPublico
