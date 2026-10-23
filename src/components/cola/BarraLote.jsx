// Barra flotante con las acciones que se pueden aplicar a todos los tickets elegidos a la vez.
function BarraLote({ cantidad, onAsignar, onPrioridad, onDevolver, onQuitar }) {
    return (
        <div className="barra-lote" role="region" aria-label="Acciones sobre la selección">
            <strong>{cantidad} {cantidad === 1 ? 'ticket seleccionado' : 'tickets seleccionados'}</strong>
            <button type="button" className="barra-lote__boton barra-lote__boton--claro" onClick={onAsignar}>Asignar a técnico</button>
            <button type="button" className="barra-lote__boton" onClick={onPrioridad}>Cambiar prioridad</button>
            <button type="button" className="barra-lote__boton" onClick={onDevolver}>Devolver a la cola</button>
            <button type="button" className="barra-lote__quitar" onClick={onQuitar}>Quitar selección</button>
        </div>
    )
}

export default BarraLote
