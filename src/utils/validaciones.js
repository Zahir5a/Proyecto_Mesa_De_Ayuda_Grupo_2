export const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarCorreoInstitucional(valor) {
    const v = valor.trim()
    if (!v) return 'El correo institucional es obligatorio.'
    if (!REGEX_CORREO.test(v)) return 'Escribe un correo válido.'
    if (!v.endsWith('@ulima.edu.pe') && !v.endsWith('@aloe.ulima.edu.pe')) {
        return 'Usa tu correo institucional (@ulima.edu.pe o @aloe.ulima.edu.pe).'
    }
    return ''
}

export function validarPassword(valor) {
    if (!valor) return 'La contraseña es obligatoria.'
    if (valor.length < 8 || !/[A-Z]/.test(valor) || !/\d/.test(valor)) {
        return 'Mínimo 8 caracteres, con una mayúscula y un número.'
    }
    return ''
}

export function validarTelefono(valor) {
    if (!valor.trim()) return 'El teléfono es obligatorio.'
    const digitos = valor.replace(/\s/g, '')
    if (!/^9\d{8}$/.test(digitos)) {
        return 'Ingresa un celular de 9 dígitos que empiece con 9.'
    }
    return ''
}

export function validarConfirmacion(password, confirmacion) {
    if (!confirmacion) return 'Confirma tu contraseña.'
    if (password !== confirmacion) return 'Las contraseñas no coinciden.'
    return ''
}

// 0 = vacía, 1 = débil (no cumple la regla), 2 = media, 3 = segura.
export const ETIQUETA_FUERZA = ['', 'Débil', 'Media', 'Segura']

export function fuerzaPassword(valor) {
    if (!valor) return 0
    if (validarPassword(valor) !== '') return 1
    if (valor.length >= 12 || /[^A-Za-z0-9]/.test(valor)) return 3
    return 2
}
