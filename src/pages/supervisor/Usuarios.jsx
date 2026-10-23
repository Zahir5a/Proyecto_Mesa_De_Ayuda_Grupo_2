import { useState } from 'react'
import { Link } from 'react-router-dom'
import ModalInvitarTecnico from '../../components/tecnicos/ModalInvitarTecnico'
import EtiquetaCuenta from '../../components/usuarios/EtiquetaCuenta'
import ModalBloqueo from '../../components/usuarios/ModalBloqueo'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Paginacion from '../../components/ui/Paginacion'
import { UNIDADES } from '../../data/catalogos'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { ticketsDeUsuario } from '../../services/ticketsService'
import { desbloquearUsuario, listarUsuarios } from '../../services/usuariosService'
import { descargarCsv } from '../../utils/exportarCsv'
import { ESTADOS_CUENTA, ROLES, unidadOEspecialidad } from '../../utils/cuentas'
import '../../components/categorias/TablaCategoria.css'
import '../usuario/tickets.css'
import './usuarios.css'

const FILAS_POR_PAGINA = 10
const SIN_FILTROS = { texto: '', rol: 'todos', estado: 'todos', unidad: 'todas' }

// Gestión de usuarios del supervisor (HU-7): búsqueda, filtros, paginación, ficha y bloqueo de cuentas.
function Usuarios() {
    const { usuario: yo } = useAuth()
    const { categorias } = useCatalogo()
    const tickets = useTickets()
    const { exito } = useToast()

    // El servicio de usuarios no avisa de los cambios: se lee de nuevo cada vez que cambia `version`
    const [version, setVersion] = useState(0)
    const [filtros, setFiltros] = useState(SIN_FILTROS)
    const [paginaActual, setPaginaActual] = useState(1)
    const [bloqueando, setBloqueando] = useState(null)
    const [desbloqueando, setDesbloqueando] = useState(null)
    const [invitando, setInvitando] = useState(false)

    const cuentas = listarUsuarios()
    const nombreCategoria = (id) => (categorias.find((c) => c.id === id) ?? { nombre: id }).nombre
    const reportados = (u) => ticketsDeUsuario(tickets, u.id).length

    function cambiarFiltro(campo, valor) {
        setFiltros({ ...filtros, [campo]: valor })
        setPaginaActual(1)
    }

    const texto = filtros.texto.trim().toLowerCase()
    const filtradas = cuentas.filter((u) => {
        if (texto && !`${u.nombres} ${u.apellidos}`.toLowerCase().includes(texto) && !u.correo.toLowerCase().includes(texto)) return false
        if (filtros.rol !== 'todos' && u.rol !== filtros.rol) return false
        if (filtros.estado !== 'todos' && u.estado !== filtros.estado) return false
        if (filtros.unidad !== 'todas' && u.unidad !== filtros.unidad) return false
        return true
    })

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / FILAS_POR_PAGINA))
    const pagina = Math.min(paginaActual, totalPaginas)
    const inicio = (pagina - 1) * FILAS_POR_PAGINA
    const filasPagina = filtradas.slice(inicio, inicio + FILAS_POR_PAGINA)
    const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS)

    const resumen = ROLES.map((r) => {
        const cantidad = cuentas.filter((u) => u.rol === r.id).length
        return `${cantidad} ${cantidad === 1 ? r.nombre.toLowerCase() : r.plural}`
    }).join(', ')

    function desbloquear() {
        const resultado = desbloquearUsuario(desbloqueando.id)
        if (resultado.ok) exito(`Cuenta desbloqueada. ${desbloqueando.nombres} ${desbloqueando.apellidos} ya puede iniciar sesión.`)
        setDesbloqueando(null)
        setVersion(version + 1)
    }

    function exportar() {
        const filas = [['Usuario', 'Correo', 'Rol', 'Unidad o especialidad', 'Tickets reportados', 'Estado']]
        filtradas.forEach((u) => {
            filas.push([`${u.nombres} ${u.apellidos}`, u.correo, u.rol, unidadOEspecialidad(u, nombreCategoria), reportados(u), u.estado])
        })
        descargarCsv('cuentas.csv', filas)
        exito('Exportamos las cuentas a un archivo CSV.')
    }

    return (
        <div>
            <div className="tickets__encabezado">
                <div>
                    <h1>Usuarios</h1>
                    <p className="texto-aux">{cuentas.length} cuentas · {resumen}</p>
                </div>
                <div className="satisfaccion__acciones">
                    <button type="button" className="boton" onClick={() => setInvitando(true)}>Invitar técnico</button>
                    <button type="button" className="boton boton--primario" onClick={exportar}>Exportar cuentas</button>
                </div>
            </div>

            <div className="tickets__filtros">
                <input type="search" className="tickets__control usuarios__buscador" placeholder="Buscar por nombre o correo"
                    aria-label="Buscar por nombre o correo" value={filtros.texto} onChange={(e) => cambiarFiltro('texto', e.target.value)} />
                <select className="tickets__control" aria-label="Rol" value={filtros.rol} onChange={(e) => cambiarFiltro('rol', e.target.value)}>
                    <option value="todos">Rol: todos</option>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>Rol: {r.nombre.toLowerCase()}</option>)}
                </select>
                <select className="tickets__control" aria-label="Estado" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                    <option value="todos">Estado: todos</option>
                    {ESTADOS_CUENTA.map((e) => <option key={e.id} value={e.id}>Estado: {e.nombre.toLowerCase()}</option>)}
                </select>
                <select className="tickets__control" aria-label="Unidad" value={filtros.unidad} onChange={(e) => cambiarFiltro('unidad', e.target.value)}>
                    <option value="todas">Unidad: todas</option>
                    {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.etiqueta}</option>)}
                </select>
                {hayFiltros && (
                    <button type="button" className="tickets__limpiar" onClick={() => { setFiltros(SIN_FILTROS); setPaginaActual(1) }}>Limpiar filtros</button>
                )}
            </div>

            <div className="tabla-container">
                <div className="tabla-desplazable">
                    <table className="tabla-categorias tabla-usuarios">
                        <thead>
                            <tr>
                                <th>USUARIO</th><th>CORREO</th><th>ROL</th><th>UNIDAD O ESPECIALIDAD</th><th>TICKETS REPORTADOS</th><th>ESTADO</th><th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filasPagina.length === 0 && (
                                <tr><td colSpan={7} className="tabla-vacia">Ninguna cuenta coincide con los filtros.</td></tr>
                            )}
                            {filasPagina.map((u) => (
                                <tr key={u.id}>
                                    <td><strong>{u.nombres} {u.apellidos}</strong></td>
                                    <td className="celda-suave">{u.correo}</td>
                                    <td><EtiquetaCuenta tipo="rol" valor={u.rol} /></td>
                                    <td>{unidadOEspecialidad(u, nombreCategoria)}</td>
                                    <td><strong>{reportados(u)}</strong></td>
                                    <td><EtiquetaCuenta tipo="estado" valor={u.estado} /></td>
                                    <td className="col-acciones">
                                        <Link to={`/supervisor/usuarios/${u.id}`} className="btn-link btn-editar">Ver ficha</Link>
                                        {u.estado === 'bloqueado' ? (
                                            <button type="button" className="btn-link btn-editar" onClick={() => setDesbloqueando(u)}>Desbloquear</button>
                                        ) : (
                                            <button type="button" className="btn-link btn-desactivar" disabled={u.id === yo.id}
                                                title={u.id === yo.id ? 'No puedes bloquear tu propia cuenta' : undefined}
                                                onClick={() => setBloqueando(u)}>
                                                Bloquear
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="tabla-footer">
                    <span className="tabla-info">
                        {filtradas.length === 0 ? 'Mostrando 0 cuentas' : `Mostrando ${inicio + 1}–${inicio + filasPagina.length} de ${filtradas.length} cuentas`}
                    </span>
                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPaginaActual} />
                </div>
            </div>

            {bloqueando && (
                <ModalBloqueo persona={bloqueando} tickets={tickets} onCerrar={() => setBloqueando(null)}
                    onListo={() => { setBloqueando(null); setVersion(version + 1) }} />
            )}
            <ConfirmDialog
                abierto={desbloqueando !== null}
                titulo={`¿Desbloquear la cuenta de ${desbloqueando ? desbloqueando.nombres + ' ' + desbloqueando.apellidos : ''}?`}
                textoConfirmar="Desbloquear cuenta"
                onConfirmar={desbloquear}
                onCancelar={() => setDesbloqueando(null)}
            >
                La persona podrá iniciar sesión otra vez. El bloqueo se puede repetir desde su ficha.
            </ConfirmDialog>
            <ModalInvitarTecnico abierto={invitando} onCerrar={() => setInvitando(false)} />
        </div>
    )
}

export default Usuarios
