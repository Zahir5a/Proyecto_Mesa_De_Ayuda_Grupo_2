import { useAuth } from '../../hooks/useAuth'

function InicioRol() {
    const { usuario } = useAuth()

    return (
        <div>
            <h1>Hola, {usuario.nombres}</h1>
            <p>Entraste con el rol de {usuario.rol}.</p>
        </div>
    )
}

export default InicioRol
