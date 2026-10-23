import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function LayoutPublico() {
    const { usuario, cerrarSesion } = useAuth()
    return (
        <div>
            <header>
                <Link to='/'>Mesa de Ayuda</Link>
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
            <main>
                <Outlet/>
            </main>
        </div>
    )
}

export default LayoutPublico