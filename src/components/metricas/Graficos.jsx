// Gráficos sencillos hechos con SVG y CSS, sin librerías.

// Anillo con un tramo por cada grupo; en el centro, el total.
export function Anillo({ datos, total, etiqueta }) {
    const radio = 52
    const largo = 2 * Math.PI * radio

    return (
        <svg className="anillo" viewBox="0 0 140 140" role="img" aria-label={`${total} ${etiqueta}: ${datos.map((d) => `${d.nombre} ${d.valor}`).join(', ')}`}>
            <circle cx="70" cy="70" r={radio} fill="none" stroke="var(--bg)" strokeWidth="22" />
            {datos.map((d, i) => {
                const tramo = (d.valor / total) * largo
                const acumulado = (datos.slice(0, i).reduce((suma, x) => suma + x.valor, 0) / total) * largo
                const circulo = (
                    <circle key={d.id} cx="70" cy="70" r={radio} fill="none" stroke={d.color} strokeWidth="22"
                        strokeDasharray={`${tramo} ${largo - tramo}`} strokeDashoffset={-acumulado} transform="rotate(-90 70 70)" />
                )
                return circulo
            })}
            <text x="70" y="70" textAnchor="middle" className="anillo__total">{total}</text>
            <text x="70" y="88" textAnchor="middle" className="anillo__etiqueta">{etiqueta}</text>
        </svg>
    )
}

// Lista de barras horizontales; la más larga ocupa todo el ancho.
export function Barras({ datos, color = 'var(--primary)', mono = false }) {
    const mayor = Math.max(1, ...datos.map((d) => d.valor))

    return (
        <ul className="barras-h">
            {datos.map((d) => (
                <li key={d.clave}>
                    <p className="barras-h__texto">
                        <span className={mono ? 'codigo' : undefined}>{d.nombre}</span>
                        <span className="texto-aux">{d.valor}</span>
                    </p>
                    <div className="barras__fondo">
                        <div className="barras-h__relleno" style={{ width: `${(d.valor / mayor) * 100}%`, background: color }} />
                    </div>
                </li>
            ))}
        </ul>
    )
}
