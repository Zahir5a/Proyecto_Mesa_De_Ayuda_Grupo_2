import { useState } from 'react'

export function useFormulario(inicial, validar) {
    const [valores, setValores] = useState(inicial)
    const [tocados, setTocados] = useState({})
    const errores = validar(valores)

    function cambiar(e) {
        const { name, type, value, checked } = e.target
        setValores({ ...valores, [name]: type === 'checkbox' ? checked : value })
    }

    function tocar(e) {
        setTocados({ ...tocados, [e.target.name]: true })
    }

    function campo(nombre) {
        return {
            name: nombre,
            value: valores[nombre],
            onChange: cambiar,
            onBlur: tocar,
            error: tocados[nombre] ? errores[nombre] : undefined,
        }
    }

    function validarTodo() {
        const todos = {}
        for (const nombre in valores) {
            todos[nombre] = true
        }
        setTocados(todos)
        return Object.keys(errores).length
    }

    return { valores, errores, campo, cambiar, validarTodo }
}
