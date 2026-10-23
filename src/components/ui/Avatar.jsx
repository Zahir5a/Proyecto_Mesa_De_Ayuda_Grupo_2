import { iniciales } from '../../utils/formato'

// Cuadro con las iniciales de la persona (Camila Quispe → CQ).
function Avatar({ usuario, grande = false }) {
    return (
        <span className={grande ? 'avatar avatar--grande' : 'avatar'} aria-hidden="true">
            {iniciales(usuario.nombres, usuario.apellidos)}
        </span>
    )
}

export default Avatar
