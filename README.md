# Mesa de ayuda de servicios del campus (Tema 5)

Programación Web · Universidad de Lima · 2026-2 · Proyecto 1 (solo interfaz, datos simulados en el navegador).

## Integrantes

| Integrante | Historia |
| --- | --- |
| Zahir Alessandro De la Cruz Perez | HU-1 Cuenta y acceso |
| Alessandro Morales Moreno | HU-2 Catálogo de servicios |
| _(nombre)_ | HU-3 Registro de tickets |
| _(nombre)_ | HU-4 Cola y asignación |
| _(nombre)_ | HU-5 Atención y cierre |

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
    layout/   LayoutPublico, LayoutApp, FooterPublico y guardas de ruta (RutaProtegida, RequiereRol, RutaSoloVisitante)
    ui/       Campo, IndicadorFuerza, ConfirmDialog, Avatar, Paginacion
    categorias/  TablaCategoria y FormularioCategoria (HU-2)
    ambientes/   ModalAmbiente (HU-2)
    tecnicos/    ModalInvitarTecnico (HU-2)
  context/    AuthProvider (sesión) y ToastProvider (avisos)
  hooks/      useAuth, useToast, useFormulario, useCatalogo
  services/   Capa de datos simulada sobre localStorage (almacen, usuarios, auth, invitaciones, catálogo)
  data/       Semillas JSON, catálogos, menú por rol y textos públicos
  pages/      auth/, publico/, cuenta/, errores/, rol/, supervisor/
  utils/      validaciones, formato y exportación del catálogo
```

Las pantallas no tocan `localStorage`: piden todo a `services/`. En la segunda entrega solo se reescriben los servicios.

## HU-1 · Cuenta y acceso

| Ruta | Pantalla |
| --- | --- |
| `/` y `/como-reportar` | Página de inicio e indicaciones para reportar |
| `/login` | Inicio de sesión (bloqueo de 15 min tras 5 intentos fallidos) |
| `/registro` | Registro de usuario con validación en línea |
| `/invitacion/:token` | Alta de técnico o supervisor por invitación |
| `/recuperar-contrasena` | Recuperación en tres pasos |
| `/cuenta` | Mi cuenta: datos personales y cambio de contraseña |
| `/usuario`, `/tecnico`, `/supervisor` | Inicio de cada rol (protegidos por sesión y rol; otro rol ve el 403) |

## HU-2 · Catálogo de servicios

Solo para el rol supervisor (otros roles ven el 403).

| Ruta | Pantalla |
| --- | --- |
| `/supervisor/categorias` | Categorías y subcategorías: búsqueda, filtros por prioridad y estado, paginación, exportar a CSV, desactivar con confirmación si hay tickets en curso |
| `/supervisor/categorias/nueva` | Alta de categoría o subcategoría, con errores de validación en línea |
| `/supervisor/categorias/:id` | Edición y eliminación (no se elimina lo que tiene tickets en curso) |
| `/supervisor/ambientes` | Sedes y ambientes: filtros por sede, pabellón y tipo, paginación y modal de alta, edición y eliminación |
| `/supervisor/tecnicos-categoria` | Matriz de técnicos por categoría e invitación de técnicos |

El catálogo vive en `localStorage` (`mda.catalogo`) y lo administra `src/services/catalogoService.js`. Las demás
pantallas lo leen con `useCatalogo` (por ejemplo, los contadores del menú y las especialidades de la invitación).
Las categorías inactivas no se ofrecen para tickets nuevos.

## Datos de prueba

Todas las cuentas de `src/data/usuarios.json` usan la contraseña `Ulima2026`:

- Usuario: `camila.quispe@aloe.ulima.edu.pe`
- Técnico: `jparedes@ulima.edu.pe`
- Supervisor: `lmendoza@ulima.edu.pe`

Invitaciones de prueba: `/invitacion/inv-hloayza-2026` (técnico), `/invitacion/inv-supervisor-2026` (supervisor) e
`/invitacion/inv-vencida-2026` (vencida). Desde "Técnicos por categoría" el supervisor puede crear invitaciones nuevas.

## Persistencia

Los datos viven en `localStorage` con prefijo `mda.`. Para reiniciar los datos de prueba, borra el almacenamiento
del sitio (F12 → Application → Local Storage → Clear).

## Cómo sumar una historia

1. Crear las pantallas en `src/pages/<carpeta>/` y sus datos en `src/services/`.
2. Registrar la ruta en `src/App.jsx`, dentro del bloque de su rol.
3. Agregar la opción al menú en `src/data/navegacion.js` (`MENU_POR_ROL`).

## Trabajo en equipo

Una rama por integrante (`feature/huN-...`) y los cambios entran a `main` mediante *pull request* revisado por otro
integrante. Los commits describen qué se hizo.
