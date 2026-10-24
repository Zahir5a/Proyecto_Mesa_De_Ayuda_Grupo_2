import { Link } from 'react-router-dom'
import { CONTACTO, PRIORIDADES } from '../../data/contenidoPublico'
import './publico.css'

const TIEMPOS = PRIORIDADES
    .map((p, i) => (i === 0 ? p.nombre : p.nombre.toLowerCase()) + ' ' + p.horas + ' h')
    .join(' · ')

const TARJETAS = [
    {
        titulo: 'Qué se reporta',
        texto: 'Audiovisuales, climatización, redes, mobiliario, eléctrico, limpieza y cerraduras.',
    },
    {
        titulo: 'Cómo se prioriza',
        texto: 'Crítica, alta, media y baja según el impacto en clases y en la seguridad.',
    },
    { titulo: 'Tiempo de atención', texto: TIEMPOS + ' hábiles.' },
    {
        titulo: 'Emergencias',
        texto: 'Fugas de agua o riesgo eléctrico: llama al anexo ' + CONTACTO.anexoEmergencias + ' y registra el ticket después.',
        destacada: true,
    },
]

function Landing() {
    return (
        <div>
            <section className="tarjeta hero">
                <div className="hero__texto">
                    <p className="etiqueta-acento">Infraestructura y servicios del campus</p>
                    <h1 className="hero__titulo">Reporta una falla del campus y sigue su atención en un solo lugar</h1>
                    <p className="texto-aux">
                        Proyectores, aire acondicionado, red, mobiliario, electricidad, limpieza y accesos. Registra el
                        ticket con el ambiente y la categoría; el supervisor lo prioriza y lo asigna a un técnico el
                        mismo día.
                    </p>
                    <div className="formulario__acciones">
                        <Link to="/usuario/nuevo-ticket" className="boton boton--primario">Registrar un ticket</Link>
                        <Link to="/como-reportar" className="boton">Ver cómo reportar</Link>
                    </div>
                </div>
                <img className="hero__imagen" src="/hero-soporte.png" alt="Persona de soporte atendiendo con auriculares frente a una computadora" />
            </section>

            <section className="info-tarjetas" aria-label="Información del servicio">
                {TARJETAS.map((t) => (
                    <article key={t.titulo} className={t.destacada ? 'tarjeta info-tarjeta info-tarjeta--destacada' : 'tarjeta info-tarjeta'}>
                        <h2>{t.titulo}</h2>
                        <p className="texto-aux">{t.texto}</p>
                    </article>
                ))}
            </section>
        </div>
    )
}

export default Landing
