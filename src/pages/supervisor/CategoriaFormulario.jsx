import { Navigate, useNavigate, useParams } from 'react-router-dom'
import FormularioCategoria from '../../components/categorias/FormularioCategoria'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useToast } from '../../hooks/useToast'
import {
    buscarCategoria,
    crearCategoria,
    editarCategoria,
    eliminarCategoria,
} from '../../services/catalogoService'
import './catalogo.css'

// Alta (/supervisor/categorias/nueva) y edición (/supervisor/categorias/:id) de una categoría o subcategoría.
function CategoriaFormulario() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { categorias } = useCatalogo()
    const { exito, error } = useToast()
    const volver = () => navigate('/supervisor/categorias')

    const encontrada = id ? buscarCategoria(id) : null
    if (id && encontrada === null) {
        return <Navigate to="/supervisor/categorias" replace />
    }

    function guardar(datos) {
        const resultado = id ? editarCategoria(id, datos) : crearCategoria(datos)
        if (!resultado.ok) return resultado

        const tipo = datos.padreId ? 'Subcategoría' : 'Categoría'
        exito(`${tipo} “${datos.nombre.trim()}” ${id ? 'actualizada' : 'creada'} correctamente.`)
        volver()
        return resultado
    }

    function eliminar() {
        const resultado = eliminarCategoria(id)
        if (resultado.ok) {
            exito(`“${encontrada.categoria.nombre}” se eliminó del catálogo.`)
        } else {
            error('No se puede eliminar: tiene tickets en curso.')
        }
        volver()
    }

    // Datos del formulario cuando se edita
    const inicial = encontrada && {
        nombre: encontrada.categoria.nombre,
        padreId: encontrada.padre ? encontrada.padre.id : '',
        prioridad: encontrada.categoria.prioridad,
        tiempoEsperado: encontrada.categoria.tiempoEsperado,
        descripcion: encontrada.categoria.descripcion ?? '',
        activa: encontrada.categoria.estado === 'activa',
    }

    return (
        <div className="categorias-page">
            <FormularioCategoria
                key={id ?? 'nueva'}
                inicial={inicial}
                ticketsAbiertos={encontrada ? encontrada.categoria.ticketsAbiertos : 0}
                categoriasPadre={categorias}
                onCancelar={volver}
                onGuardar={guardar}
                onEliminar={eliminar}
            />
        </div>
    )
}

export default CategoriaFormulario
