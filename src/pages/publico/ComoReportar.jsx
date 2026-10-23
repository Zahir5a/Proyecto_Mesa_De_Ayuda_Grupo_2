import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCatalogo } from '../../hooks/useCatalogo'
import { CONTACTO, PASOS_REPORTE, PREGUNTAS_FRECUENTES, PRIORIDADES } from '../../data/contenidoPublico'
import './publico.css'

function ComoReportar() {
    const { hash } = useLocation()
    // Solo las categorías activas admiten tickets nuevos (HU-2)
    const categorias = useCatalogo().categorias.filter((c) => c.estado === 'activa')

    // Los enlaces de la cabecera y del pie apuntan a secciones (#categorias, #tiempos, #preguntas).
    useEffect(() => {
        if (hash) {
            const seccion = document.getElementById(hash.slice(1))
            if (seccion) seccion.scrollIntoView()
        } else {
            window.scrollTo(0, 0)
        }
    }, [hash])

    return (
        <div className="texto-publico">
            <h1>Cómo reportar una incidencia</h1>
            <p className="texto-aux">Cinco pasos desde el reporte hasta la encuesta de satisfacción.</p>

            <ol className="pasos-reporte">
                {PASOS_REPORTE.map((paso) => (
                    <li key={paso.titulo} className="tarjeta">
                        <h2>{paso.titulo}</h2>
                        <p className="texto-aux">{paso.texto}</p>
                    </li>
                ))}
            </ol>
            <div className="formulario__acciones">
                <Link to="/usuario/nuevo-ticket" className="boton boton--primario">Registrar un ticket</Link>
                <Link to="/registro" className="boton">Crear mi cuenta</Link>
            </div>

            <section id="categorias" className="seccion-publica">
                <h2>Categorías de servicio</h2>
                <ul className="lista-chips">
                    {categorias.map((c) => (
                        <li key={c.id} className="chip chip--estatico">{c.nombre}</li>
                    ))}
                </ul>
            </section>

            <section id="tiempos" className="seccion-publica">
                <h2>Tiempos de atención</h2>
                <div className="tarjeta tabla-contenedor">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th scope="col">Prioridad</th>
                                <th scope="col">Atención esperada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PRIORIDADES.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.nombre}</td>
                                    <td>{p.horas} horas hábiles</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="texto-aux">
                    Emergencias eléctricas o fugas de agua: llama al anexo {CONTACTO.anexoEmergencias} y registra el
                    ticket después.
                </p>
            </section>

            <section id="preguntas" className="seccion-publica">
                <h2>Preguntas frecuentes</h2>
                {PREGUNTAS_FRECUENTES.map((p) => (
                    <details key={p.pregunta} className="tarjeta faq">
                        <summary>{p.pregunta}</summary>
                        <p className="texto-aux">{p.respuesta}</p>
                    </details>
                ))}
            </section>
        </div>
    )
}

export default ComoReportar
