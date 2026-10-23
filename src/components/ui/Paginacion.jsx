import './paginacion.css'

// Botones Anterior / 1 2 3 / Siguiente. Quien la usa decide qué filas mostrar según la página.
function Paginacion({ pagina, totalPaginas, onCambiar }) {
    const numeros = Array.from({ length: totalPaginas }, (_, i) => i + 1)

    return (
        <nav className="paginacion" aria-label="Paginación">
            <button type="button" disabled={pagina === 1} onClick={() => onCambiar(pagina - 1)}>
                Anterior
            </button>
            {numeros.map((numero) => (
                <button
                    key={numero}
                    type="button"
                    className={numero === pagina ? 'activo' : ''}
                    aria-current={numero === pagina ? 'page' : undefined}
                    onClick={() => onCambiar(numero)}
                >
                    {numero}
                </button>
            ))}
            <button type="button" disabled={pagina === totalPaginas} onClick={() => onCambiar(pagina + 1)}>
                Siguiente
            </button>
        </nav>
    )
}

export default Paginacion
