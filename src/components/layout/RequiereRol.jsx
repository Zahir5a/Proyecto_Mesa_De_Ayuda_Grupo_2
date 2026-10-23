import { Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AccesoDenegado from '../../pages/errores/AccesoDenegado'

function RequiereRol({ roles }) {
    const { usuario } = useAuth()

    if (!roles.includes(usuario.rol)) {
        return <AccesoDenegado />
    }

    return <Outlet />
}

export default RequiereRol
