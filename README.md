# Mesa de ayuda de servicios del campus (Tema 5)

Programación Web · Universidad de Lima · 2026-2 · Proyecto 1 (solo interfaz, datos simulados en el navegador).

Aplicación en React (Vite) con las historias del enunciado: cuenta y acceso, catálogo de servicios, registro y
seguimiento de tickets, cola y asignación, atención y cierre, y encuesta de satisfacción.

## Integrantes

| Integrante | Historia |
| --- | --- |
| Zahir Alessandro De la Cruz Perez | HU-1 Cuenta y acceso |
| Alessandro Morales Moreno | HU-2 Catálogo de servicios |
| Gustavo Montes | HU-3 Registro y seguimiento de tickets |
| Vivian Paredes | HU-4 Cola de atención y asignación |
| Renzo Alejandro Custodio Caceres | HU-5 Atención y cierre |
| Mariana Figueroa Zúñiga | HU-6 Encuesta de satisfacción |

## Cómo levantar el proyecto

```bash
npm install
npm run dev
```

Abrir la dirección que indique Vite (normalmente http://localhost:5173).

Otros comandos: `npm run lint` (revisa el código) y `npm run build` (empaqueta el proyecto).

## Estructura

```
src/
  components/
    layout/      LayoutPublico, LayoutApp, FooterPublico, BuscadorTicket y guardas de ruta (RutaProtegida, RequiereRol, RutaSoloVisitante)
    ui/          Campo, ConfirmDialog, Modal, Avatar, Etiqueta, Paginacion, IndicadorFuerza
    categorias/  TablaCategoria y FormularioCategoria (HU-2)
    ambientes/   ModalAmbiente (HU-2)
    tecnicos/    ModalInvitarTecnico (HU-2)
    tickets/     ModalReabrir (HU-3)
    cola/        Filtros, tabla, barra de lote y ventanas de asignación y prioridad (HU-4)
    atencion/    Ventanas de cambio de estado y de cierre (HU-5)
  context/    AuthProvider (sesión) y ToastProvider (avisos)
  hooks/      useAuth, useToast, useFormulario, useCatalogo, useTickets, useEncuestas, useCola, useAhora
  services/   Capa de datos simulada sobre localStorage: almacen, usuarios, auth, invitaciones, catálogo, tickets, encuestas
  data/       Semillas JSON, catálogos, menú por rol y textos públicos
  pages/      auth/, publico/, cuenta/, errores/, rol/, usuario/, tecnico/, supervisor/
  utils/      validaciones, formato, plazos, tiempos, etapas, conteos y exportación del catálogo
```

Las pantallas no tocan `localStorage`: piden todo a `services/`. En la segunda entrega solo se reescriben los servicios.
Los datos que comparten varias historias (catálogo, tickets, encuestas) se leen con hooks (`useCatalogo`, `useTickets`,
`useEncuestas`) que redibujan la pantalla cuando alguien los cambia.

## Rutas por historia

### HU-1 · Cuenta y acceso

| Ruta | Pantalla |
| --- | --- |
| `/` y `/como-reportar` | Página de inicio e indicaciones para reportar |
| `/login` | Inicio de sesión (bloqueo de 15 min tras 5 intentos fallidos) |
| `/registro` | Registro de usuario con validación en línea |
| `/invitacion/:token` | Alta de técnico o supervisor por invitación |
| `/recuperar-contrasena` | Recuperación en tres pasos |
| `/cuenta` | Mi cuenta: datos personales y cambio de contraseña |
| `/usuario` | Inicio del usuario (las rutas de cada rol están protegidas por sesión y rol; otro rol ve el 403) |

### HU-2 · Catálogo de servicios (supervisor)

| Ruta | Pantalla |
| --- | --- |
| `/supervisor/categorias` | Categorías y subcategorías: búsqueda, filtros, paginación, exportar a CSV, desactivar con confirmación si hay tickets en curso |
| `/supervisor/categorias/nueva` y `/supervisor/categorias/:id` | Alta, edición y eliminación |
| `/supervisor/ambientes` | Sedes y ambientes con filtros, paginación y ventana de alta y edición |
| `/supervisor/tecnicos-categoria` | Matriz de técnicos por categoría e invitación de técnicos |

### HU-3 · Registro y seguimiento de tickets (usuario)

| Ruta | Pantalla |
| --- | --- |
| `/usuario/nuevo-ticket` | Registrar un ticket, con aviso si ya existe uno abierto para el mismo ambiente y categoría |
| `/usuario/tickets/:codigo/registrado` | Confirmación con el código y el plazo de atención |
| `/usuario/tickets` | Mis tickets con filtros por estado, fechas y categoría, y búsqueda por código |
| `/usuario/tickets/:codigo` | Detalle con bitácora, cancelación (si no está asignado) y reapertura (hasta 7 días tras el cierre) |

### HU-4 · Cola de atención y asignación

| Ruta | Pantalla |
| --- | --- |
| `/supervisor/cola` | Cola con filtros, orden, asignación, reasignación, cambio de prioridad con motivo, devolución y acciones en lote |
| `/supervisor/bandejas` | Carga de cada técnico, con enlace a la cola filtrada |
| `/tecnico`, `/tecnico/en-atencion`, `/tecnico/en-espera`, `/tecnico/resueltos` | Bandeja del técnico con contadores y autoasignación |

### HU-5 · Atención y cierre

| Ruta | Pantalla |
| --- | --- |
| `/tecnico/tickets/:codigo` | Bitácora con comentarios públicos y notas internas, cambio de estado y cierre con la solución |
| `/tecnico/tickets/:codigo/historial` | Historial de cambios con el tiempo en cada etapa |
| `/tecnico/historial` | Tickets que el técnico ya cerró |
| `/supervisor/cola/:codigo` | Vista consolidada del ticket para el supervisor (solo lectura) |

### HU-6 · Encuesta de satisfacción

| Ruta | Pantalla |
| --- | --- |
| `/usuario/encuesta-pendiente` y `/usuario/encuesta/:codigo` | Responder o editar la encuesta (una por ticket cerrado, editable 7 días) |
| `/usuario/encuestas` | Mis encuestas |
| `/supervisor/satisfaccion` | Promedios por técnico y categoría con filtro de periodo, y comentarios recibidos |

## Datos de prueba

Todas las cuentas de `src/data/usuarios.json` usan la contraseña `Ulima2026`:

- Usuario: `camila.quispe@aloe.ulima.edu.pe`
- Técnico: `jparedes@ulima.edu.pe`
- Supervisor: `lmendoza@ulima.edu.pe`

Invitaciones de prueba: `/invitacion/inv-hloayza-2026` (técnico), `/invitacion/inv-supervisor-2026` (supervisor) e
`/invitacion/inv-vencida-2026` (vencida). El supervisor puede crear invitaciones nuevas desde "Técnicos por categoría".

Las fechas de los tickets de ejemplo se calculan respecto al día en que se abre el proyecto, para que los plazos de
atención, reapertura y encuesta sigan vigentes.

## Diseño

Las pantallas siguen el PDF de mockups del enunciado. Medidas que se respetan:

- Letra IBM Plex Sans: 15 px en el cuerpo, 14 px en datos secundarios, 13 px en etiquetas y 12 px en cabeceras de tabla. Títulos de 28 px.
- Menú lateral de 260 px y contenido de hasta 1600 px; la cola y la bandeja usan todo el ancho.
- Tablas con filas de 45 px y columnas con los anchos del mockup en pantallas anchas.
- Etiquetas de 23 px de alto con los colores del mockup (prioridad, estado y cuenta).
- Colores como variables en `src/index.css` (`--primary`, `--accent`, `--danger`, etc.), sin sombras salvo en las ventanas.

En pantallas angostas (hasta 390 px) el menú pasa arriba y las tablas se desplazan hacia los lados.

## Persistencia

Todo vive en el navegador, en `localStorage` con prefijo `mda.` (usuarios, sesión, catálogo, tickets, encuestas e invitaciones).
No hay servidor ni base de datos.

- La primera vez que se abre el proyecto, las semillas de `src/data/*.json` se copian a `localStorage`.
- Cada navegador y cada equipo tienen sus propios datos.
- Las contraseñas se guardan sin cifrar porque es una simulación de la interfaz; en la segunda entrega las maneja el servidor.
- Para reiniciar los datos de prueba, borra el almacenamiento del sitio (F12 → Application → Local Storage → Clear).

## Cómo sumar una historia

1. Crear las pantallas en `src/pages/<carpeta>/` y sus datos en `src/services/`.
2. Registrar la ruta en `src/App.jsx`, dentro del bloque de su rol.
3. Agregar la opción al menú en `src/data/navegacion.js` (`MENU_POR_ROL`).

## Trabajo en equipo

Una rama por historia (`feature/huN-...`) y los cambios entran a `main` mediante *pull request*. Cada integrante hizo
sus commits desde su propia cuenta. Los mensajes describen qué se hizo.
