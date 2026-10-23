import { useRef, useState } from 'react'
import { ToastContext } from './toast-context'

const DURACION_MS = 5000

// Avisos flotantes de resultado ("Cuenta creada", "Cambios guardados").
// El enunciado exige notificar el resultado de toda operación de escritura.
function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const contador = useRef(0)

    function descartar(id) {
        setToasts((lista) => lista.filter((t) => t.id !== id))
    }

    function notificar(tipo, mensaje) {
        contador.current += 1
        const id = contador.current
        setToasts((lista) => [...lista, { id, tipo, mensaje }])
        setTimeout(() => descartar(id), DURACION_MS)
    }

    const valor = {
        exito: (mensaje) => notificar('exito', mensaje),
        error: (mensaje) => notificar('error', mensaje),
        aviso: (mensaje) => notificar('aviso', mensaje),
        info: (mensaje) => notificar('info', mensaje),
    }

    return (
        <ToastContext.Provider value={valor}>
            {children}
            <div className="toasts" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast--${t.tipo}`} role={t.tipo === 'error' ? 'alert' : 'status'}>
                        <span>{t.mensaje}</span>
                        <button type="button" className="toast__cerrar" onClick={() => descartar(t.id)}
                            aria-label="Cerrar aviso">×</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export default ToastProvider
