import { Link } from 'react-router-dom'
import { CONTACTO } from '../../data/contenidoPublico'

function FooterPublico() {
    return (
        <footer className="pie">
            <div className="pie__rejilla">
                <div>
                    <strong>Mesa de Ayuda de Servicios</strong>
                    <p>Universidad de Lima · Dirección de Infraestructura y Servicios</p>
                    <p>{CONTACTO.correo} · anexo {CONTACTO.anexo}</p>
                    <p>{CONTACTO.horario}</p>
                </div>
                <div>
                    <h2>Reportar</h2>
                    <ul>
                        <li><Link to="/usuario/nuevo-ticket">Registrar un ticket</Link></li>
                        <li><Link to="/usuario/tickets">Seguir un ticket</Link></li>
                        <li><Link to="/como-reportar#categorias">Categorías de servicio</Link></li>
                    </ul>
                </div>
                <div>
                    <h2>Ayuda</h2>
                    <ul>
                        <li><Link to="/como-reportar#preguntas">Preguntas frecuentes</Link></li>
                        <li><Link to="/como-reportar#tiempos">Tiempos de atención esperados</Link></li>
                        <li>Emergencias eléctricas · anexo {CONTACTO.anexoEmergencias}</li>
                    </ul>
                </div>
            </div>
            <p className="pie__copia">© 2026 Universidad de Lima · Términos · Privacidad</p>
        </footer>
    )
}

export default FooterPublico
