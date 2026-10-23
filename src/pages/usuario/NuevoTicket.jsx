import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Etiqueta from '../../components/ui/Etiqueta'
import { PRIORIDADES } from '../../data/contenidoPublico'
import { MAX_DESCRIPCION, MAX_EVIDENCIA_MB } from '../../data/tickets'
import { useAuth } from '../../hooks/useAuth'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useTickets } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { categoriasActivas } from '../../services/catalogoService'
import { buscarDuplicado, registrarTicket } from '../../services/ticketsService'
import { tiempoRelativo } from '../../utils/plazos'
import './tickets.css'

const VACIO = {
    categoriaId: '',
    subcategoriaId: '',
    ambiente: '',
    prioridad: 'media',
    asunto: '',
    descripcion: '',
}

const TIPOS_EVIDENCIA = ['image/jpeg', 'image/png']

function NuevoTicket() {
    const { usuario } = useAuth()
    const { ambientes } = useCatalogo()
    const tickets = useTickets()
    const { error } = useToast()
    const navigate = useNavigate()
    const selectorArchivo = useRef(null)

    const [form, setForm] = useState(VACIO)
    const [evidencia, setEvidencia] = useState(null)
    const [errorEvidencia, setErrorEvidencia] = useState('')
    const [intentado, setIntentado] = useState(false)
    const [buscado, setBuscado] = useState(false)
    const [arrastrando, setArrastrando] = useState(false)

    // Solo se ofrecen las categorías y subcategorías activas del catálogo (HU-2)
    const categorias = categoriasActivas()
    const categoria = categorias.find((c) => c.id === form.categoriaId)
    const subcategoria = categoria ? categoria.subcategorias.find((s) => s.id === form.subcategoriaId) : undefined
    const ambiente = ambientes.find((a) => a.codigo === form.ambiente.trim().toUpperCase())
    const duplicado = buscarDuplicado(tickets, form.categoriaId, form.ambiente)

    function cambiar(campo, valor) {
        setForm({ ...form, [campo]: valor })
    }

    function elegirCategoria(id) {
        setForm({ ...form, categoriaId: id, subcategoriaId: '', prioridad: 'media' })
    }

    // La prioridad se sugiere según la subcategoría, pero el usuario puede cambiarla
    function elegirSubcategoria(id) {
        const sub = categoria.subcategorias.find((s) => s.id === id)
        setForm({ ...form, subcategoriaId: id, prioridad: sub ? sub.prioridad : form.prioridad })
    }

    function elegirArchivo(archivo) {
        setErrorEvidencia('')
        if (!archivo) return
        if (!TIPOS_EVIDENCIA.includes(archivo.type)) {
            setErrorEvidencia('Solo se aceptan fotos JPG o PNG.')
            return
        }
        if (archivo.size > MAX_EVIDENCIA_MB * 1024 * 1024) {
            setErrorEvidencia(`La foto no puede superar los ${MAX_EVIDENCIA_MB} MB.`)
            return
        }
        setEvidencia(archivo)
    }

    function soltarArchivo(e) {
        e.preventDefault()
        setArrastrando(false)
        elegirArchivo(e.dataTransfer.files[0])
    }

    // Errores por campo; solo se muestran después de intentar registrar
    const errores = {}
    if (!form.categoriaId) errores.categoriaId = 'Elige una categoría.'
    if (form.categoriaId && !form.subcategoriaId) errores.subcategoriaId = 'Elige una subcategoría.'
    if (!form.ambiente.trim()) errores.ambiente = 'Indica el código del ambiente.'
    else if (!ambiente) errores.ambiente = 'No existe un ambiente con ese código.'
    if (form.asunto.trim().length < 5) errores.asunto = 'El asunto debe tener al menos 5 caracteres.'
    if (form.descripcion.trim().length < 20) errores.descripcion = 'Cuéntanos qué ocurre en al menos 20 caracteres.'

    const cantidadErrores = Object.keys(errores).length
    const mostrar = (campo) => (intentado ? errores[campo] : undefined)

    function enviar(e) {
        e.preventDefault()
        setIntentado(true)
        if (cantidadErrores > 0) return

        const resultado = registrarTicket({ ...form, evidencia: evidencia ? evidencia.name : '' }, usuario)
        if (!resultado.ok) {
            error('No pudimos registrar el ticket. Revisa tu conexión e inténtalo otra vez.')
            return
        }
        navigate(`/usuario/tickets/${resultado.ticket.codigo}/registrado`)
    }

    // Tiempo esperado: el de la subcategoría si se mantiene su prioridad; si no, el de la prioridad elegida
    const prioridadElegida = PRIORIDADES.find((p) => p.id === form.prioridad)
    const horas = subcategoria && subcategoria.prioridad === form.prioridad ? subcategoria.tiempoEsperado : prioridadElegida.horas

    return (
        <div>
            <h1>Registrar un ticket</h1>
            <p className="texto-aux tickets__subtitulo">
                Indica qué falla y dónde. La prioridad se sugiere según la categoría y el supervisor puede ajustarla.
            </p>

            {duplicado && (
                <div className="alerta-aviso tickets__duplicado" role="status">
                    <span>
                        Ya existe un ticket abierto para <strong className="codigo">{duplicado.ambiente}</strong> en{' '}
                        {categoria ? categoria.nombre : 'esa categoría'}: <strong className="codigo">{duplicado.codigo}</strong>, registrado{' '}
                        {tiempoRelativo(duplicado.registradoEn)}. Revísalo antes de crear otro.
                    </span>
                    {duplicado.usuarioId === usuario.id && (
                        <Link to={`/usuario/tickets/${duplicado.codigo}`} className="boton boton--aviso boton--chico">
                            Ver ese ticket
                        </Link>
                    )}
                </div>
            )}

            {intentado && cantidadErrores > 0 && (
                <p className="alerta-error tickets__error" role="alert">
                    No se pudo registrar: revisa {cantidadErrores === 1 ? 'el campo marcado' : `los ${cantidadErrores} campos marcados`}.
                </p>
            )}

            <div className="tickets__rejilla">
                <form className="tarjeta tickets__formulario" onSubmit={enviar} noValidate>
                    <div className="tickets__fila">
                        <div className={mostrar('categoriaId') ? 'campo campo--error' : 'campo'}>
                            <label htmlFor="categoria" className="campo__etiqueta">Categoría</label>
                            <select id="categoria" className="campo__control" value={form.categoriaId}
                                onChange={(e) => elegirCategoria(e.target.value)}>
                                <option value="">Selecciona una categoría</option>
                                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                            {mostrar('categoriaId') && <p className="campo__mensaje campo__mensaje--error">{errores.categoriaId}</p>}
                        </div>

                        <div className={mostrar('subcategoriaId') ? 'campo campo--error' : 'campo'}>
                            <label htmlFor="subcategoria" className="campo__etiqueta">Subcategoría</label>
                            <select id="subcategoria" className="campo__control" value={form.subcategoriaId} disabled={!categoria}
                                onChange={(e) => elegirSubcategoria(e.target.value)}>
                                <option value="">Selecciona una subcategoría</option>
                                {categoria && categoria.subcategorias.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <p className={mostrar('subcategoriaId') ? 'campo__mensaje campo__mensaje--error' : 'campo__mensaje'}>
                                {mostrar('subcategoriaId') ?? 'Depende de la categoría elegida.'}
                            </p>
                        </div>
                    </div>

                    <div className="tickets__fila">
                        <div className={mostrar('ambiente') ? 'campo campo--error' : 'campo'}>
                            <label htmlFor="ambiente" className="campo__etiqueta">Ambiente</label>
                            <div className="campo__envoltorio">
                                <input id="ambiente" className="campo__control campo__control--codigo" value={form.ambiente}
                                    placeholder="Ejemplo: A-201" autoComplete="off"
                                    onChange={(e) => { setBuscado(false); cambiar('ambiente', e.target.value) }} />
                                <button type="button" className="tickets__buscar" onClick={() => setBuscado(true)}>Buscar</button>
                            </div>
                            {ambiente && (
                                <p className="campo__mensaje">{ambiente.tipo} · Pabellón {ambiente.pabellon} · piso {ambiente.piso}</p>
                            )}
                            {!ambiente && (mostrar('ambiente') || (buscado && form.ambiente.trim())) && (
                                <p className="campo__mensaje campo__mensaje--error">
                                    {errores.ambiente ?? 'No existe un ambiente con ese código.'}
                                </p>
                            )}
                            {!ambiente && !mostrar('ambiente') && !(buscado && form.ambiente.trim()) && (
                                <p className="campo__mensaje">Escribe el código tal como aparece en la puerta.</p>
                            )}
                        </div>

                        <div className="campo">
                            <label htmlFor="prioridad" className="campo__etiqueta">Prioridad sugerida</label>
                            <div className="tickets__prioridad">
                                <Etiqueta tipo="prioridad" valor={form.prioridad} />
                                <select id="prioridad" value={form.prioridad} onChange={(e) => cambiar('prioridad', e.target.value)}>
                                    {PRIORIDADES.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <p className="campo__mensaje">
                                {subcategoria && subcategoria.prioridad === form.prioridad
                                    ? 'Sugerida por la subcategoría.'
                                    : 'El supervisor puede ajustar esta prioridad.'}
                            </p>
                        </div>
                    </div>

                    <div className={mostrar('asunto') ? 'campo campo--error' : 'campo'}>
                        <label htmlFor="asunto" className="campo__etiqueta">Asunto</label>
                        <input id="asunto" className="campo__control" value={form.asunto} maxLength={100}
                            placeholder="Ejemplo: Proyector no enciende en aula A-201"
                            onChange={(e) => cambiar('asunto', e.target.value)} />
                        {mostrar('asunto') && <p className="campo__mensaje campo__mensaje--error">{errores.asunto}</p>}
                    </div>

                    <div className={mostrar('descripcion') ? 'campo campo--error' : 'campo'}>
                        <label htmlFor="descripcion" className="campo__etiqueta">Descripción</label>
                        <textarea id="descripcion" className="campo__control tickets__area" value={form.descripcion}
                            maxLength={MAX_DESCRIPCION} placeholder="Describe qué ocurre, desde cuándo y qué intentaste…"
                            onChange={(e) => cambiar('descripcion', e.target.value)} />
                        <div className="tickets__contador">
                            <p className={mostrar('descripcion') ? 'campo__mensaje campo__mensaje--error' : 'campo__mensaje'}>
                                {mostrar('descripcion') ?? 'Indica qué probaste y desde cuándo ocurre.'}
                            </p>
                            <span>{form.descripcion.length} / {MAX_DESCRIPCION}</span>
                        </div>
                    </div>

                    <div className="campo">
                        <span className="campo__etiqueta">Evidencia (opcional)</span>
                        <div className={arrastrando ? 'tickets__evidencia tickets__evidencia--activa' : 'tickets__evidencia'}
                            onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                            onDragLeave={() => setArrastrando(false)}
                            onDrop={soltarArchivo}>
                            <input ref={selectorArchivo} type="file" accept=".jpg,.jpeg,.png" className="visualmente-oculto"
                                aria-label="Elegir una foto como evidencia"
                                onChange={(e) => { elegirArchivo(e.target.files[0]); e.target.value = '' }} />
                            {evidencia ? (
                                <p>
                                    <strong>{evidencia.name}</strong>{' '}
                                    <button type="button" className="tickets__quitar" onClick={() => setEvidencia(null)}>Quitar</button>
                                </p>
                            ) : (
                                <button type="button" className="tickets__elegir" onClick={() => selectorArchivo.current.click()}>
                                    Arrastra una foto o pulsa para elegir · JPG o PNG hasta {MAX_EVIDENCIA_MB} MB
                                </button>
                            )}
                        </div>
                        {errorEvidencia && <p className="campo__mensaje campo__mensaje--error">{errorEvidencia}</p>}
                    </div>

                    <div className="formulario__acciones">
                        <button type="submit" className="boton boton--primario">Registrar ticket</button>
                        <button type="button" className="boton" onClick={() => navigate('/usuario')}>Cancelar</button>
                    </div>
                </form>

                <aside className="tickets__lateral">
                    <div className="tarjeta">
                        <h2>Qué conviene incluir</h2>
                        <ul className="tickets__consejos">
                            <li>El código del ambiente tal como aparece en la puerta.</li>
                            <li>Desde cuándo ocurre la falla y si es intermitente.</li>
                            <li>Qué ya intentaste (cambiar cable, reiniciar equipo).</li>
                            <li>Si hay clase o evento en las próximas horas.</li>
                            <li>Un teléfono de contacto si hay que coordinar el acceso.</li>
                        </ul>
                    </div>
                    <div className="alerta-info tickets__tiempo">
                        <strong>Tiempo esperado para esta categoría</strong>
                        <p>
                            {subcategoria
                                ? `Prioridad ${prioridadElegida.nombre.toLowerCase()}: atención dentro de ${horas} horas hábiles desde el registro.`
                                : 'Elige una subcategoría para ver el tiempo de atención esperado.'}
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default NuevoTicket
