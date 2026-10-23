import { PERIODOS } from '../../utils/periodos'

// Lista de periodos y, si se elige "Rango de fechas…", los dos campos de fecha.
// `valor` es { id, desde, hasta }; quien lo usa guarda ese objeto y recibe los cambios en `onCambiar`.
function SelectorPeriodo({ valor, onCambiar }) {
    return (
        <div className="periodo">
            <select className="tickets__control" aria-label="Periodo" value={valor.id}
                onChange={(e) => onCambiar({ ...valor, id: e.target.value })}>
                {PERIODOS.map((p) => <option key={p.id} value={p.id}>Periodo: {p.nombre.toLowerCase()}</option>)}
            </select>
            {valor.id === 'rango' && (
                <>
                    <label className="tickets__fecha">
                        Desde
                        <input type="date" value={valor.desde} max={valor.hasta || undefined}
                            onChange={(e) => onCambiar({ ...valor, desde: e.target.value })} />
                    </label>
                    <label className="tickets__fecha">
                        Hasta
                        <input type="date" value={valor.hasta} min={valor.desde || undefined}
                            onChange={(e) => onCambiar({ ...valor, hasta: e.target.value })} />
                    </label>
                </>
            )}
        </div>
    )
}

export default SelectorPeriodo
