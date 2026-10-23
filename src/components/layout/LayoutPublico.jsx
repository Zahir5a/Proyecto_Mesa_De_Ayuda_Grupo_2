import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './layout.css'

function LayoutPublico() {
    const { usuario, cerrarSesion } = useAuth()
    return (
        <div className='cabecera_acciones'>
            <header className='cabecera'>
                <Link className='cabecera_marca' to='/'>Mesa de Ayuda</Link>
                {usuario ? (
                    <>
                        <span>Hola, {usuario.nombres}</span>
                        <button onClick={cerrarSesion}>Cerrar sesión</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Iniciar sesión</Link>
                        <Link to="/registro">Registrarme</Link>
                    </>
                )}
            </header>
            <main className='contenido'>
                <Outlet/>
            </main>
        </div>
    )
}

export default LayoutPublico