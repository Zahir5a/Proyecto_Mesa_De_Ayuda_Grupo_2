import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { rutaInicio } from '../../data/navegacion'

// Login, registro y recuperación son para quien NO tiene sesión: si ya la tiene, va a su inicio.
function RutaSoloVisitante() {
    const { usuario } = useAuth()

    if (usuario) {
        return <Navigate to={rutaInicio(usuario.rol)} replace />
    }

    return <Outlet />
}

export default RutaSoloVisitante
