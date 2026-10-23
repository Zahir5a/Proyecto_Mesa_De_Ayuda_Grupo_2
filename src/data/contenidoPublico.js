// Contenido estático de las páginas públicas (landing y "Cómo reportar") y datos de contacto.

export const CONTACTO = {
    correo: 'soporte.campus@ulima.edu.pe',
    anexo: '30500',
    anexoEmergencias: '30111',
    horario: 'Atención de lunes a sábado, 07:00 a 21:00',
}

export const PRIORIDADES = [
    { id: 'critica', nombre: 'Crítica', horas: 2 },
    { id: 'alta', nombre: 'Alta', horas: 8 },
    { id: 'media', nombre: 'Media', horas: 24 },
    { id: 'baja', nombre: 'Baja', horas: 72 },
]

export const PASOS_REPORTE = [
    { titulo: 'Crea tu cuenta o inicia sesión', texto: 'Usa tu correo institucional. Es gratis y queda activa al instante.' },
    { titulo: 'Registra el ticket', texto: 'Elige la categoría, indica el ambiente afectado y describe qué ocurre y qué ya probaste.' },
    { titulo: 'Guarda el código', texto: 'Recibes un código TCK-2026-… con el que puedes buscar tu ticket en cualquier momento.' },
    { titulo: 'Sigue la atención', texto: 'El supervisor lo prioriza y lo asigna a un técnico; ves cada avance en la bitácora.' },
    { titulo: 'Califica el servicio', texto: 'Cuando se cierra el ticket respondes una encuesta de menos de un minuto.' },
]

export const PREGUNTAS_FRECUENTES = [
    {
        pregunta: '¿Quién puede registrar un ticket?',
        respuesta: 'Cualquier miembro de la comunidad con correo institucional: alumnos, docentes y personal administrativo.',
    },
    {
        pregunta: '¿Qué hago ante una fuga de agua o un riesgo eléctrico?',
        respuesta: 'Llama primero al anexo de emergencias y registra el ticket después.',
    },
    {
        pregunta: '¿Puedo reabrir un ticket cerrado?',
        respuesta: 'Sí, hasta 7 días después del cierre, indicando el motivo.',
    },
]
