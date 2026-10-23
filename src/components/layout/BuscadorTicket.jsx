import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { rutaTicket } from '../../data/navegacion'

const FORMATO_CODIGO = /^TCK-\d{4}-\d{5}$/

// Buscador de la cabecera: lleva al detalle de un ticket a partir de su código.
function BuscadorTicket() {
    const { usuario } = useAuth()
    const { aviso } = useToast()
    const navigate = useNavigate()
    const id = useId()
    const [texto, setTexto] = useState('')

    function buscar(e) {
        e.preventDefault()
        const codigo = texto.trim().toUpperCase()
        if (!FORMATO_CODIGO.test(codigo)) {
            aviso('El código debe tener el formato TCK-2026-00123.')
            return
        }
        navigate(rutaTicket(usuario.rol, codigo))
        setTexto('')
    }

    return (
        <form className="buscador" onSubmit={buscar} role="search">
            <label htmlFor={id} className="visualmente-oculto">Buscar un ticket por su código</label>
            <input id={id} type="search" className="buscador__campo" value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar por código de ticket · TCK-2026-…" />
        </form>
    )
}

export default BuscadorTicket
