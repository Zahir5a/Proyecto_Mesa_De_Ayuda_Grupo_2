import { useEffect, useState } from 'react'

// Hora actual, que se actualiza cada minuto para que los plazos y las antigüedades se mantengan al día.
export function useAhora() {
    const [ahora, setAhora] = useState(() => Date.now())

    useEffect(() => {
        const reloj = setInterval(() => setAhora(Date.now()), 60000)
        return () => clearInterval(reloj)
    }, [])

    return ahora
}
