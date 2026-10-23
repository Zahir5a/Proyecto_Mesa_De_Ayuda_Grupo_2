import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { buscarItem } from '../../data/navegacion'

// Marcador de las pantallas que construyen otras historias (tickets, cola, catálogo…).
function PaginaPendiente() {
    const { usuario } = useAuth()
    const { pathname } = useLocation()
    const item = buscarItem(usuario.rol, pathname)

    return (
        <div>
            <h1>{item ? item.etiqueta : 'Detalle'}</h1>
            <p className="texto-aux">Esta pantalla pertenece a otra historia de usuario y aún está en construcción.</p>
        </div>
    )
}

export default PaginaPendiente
