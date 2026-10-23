# Mesa de ayuda de servicios del campus (Tema 5)

Programación Web · Universidad de Lima · 2026-2 · Proyecto 1 (solo interfaz, datos simulados en el navegador).

## Integrantes

| Integrante | Historia |
| --- | --- |
| Zahir Alessandro De la Cruz Perez | HU-1 Cuenta y acceso |
| _(nombre)_ | HU-2 Catálogo de servicios |
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
    ui/       Campo, IndicadorFuerza, ConfirmDialog
  context/    AuthProvider (sesión) y ToastProvider (avisos)
  hooks/      useAuth, useToast, useFormulario
  services/   Capa de datos simulada sobre localStorage (almacen, usuarios, auth, invitaciones)
  data/       Semillas JSON, catálogos, menú por rol y textos públicos
  pages/      auth/, publico/, cuenta/, errores/, rol/
  utils/      validaciones y formato
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

### Datos de prueba

Todas las cuentas de `src/data/usuarios.json` usan la contraseña `Ulima2026`:

- Usuario: `camila.quispe@aloe.ulima.edu.pe`
- Técnico: `jparedes@ulima.edu.pe`
- Supervisor: `lmendoza@ulima.edu.pe`

Invitaciones de prueba: `/invitacion/inv-hloayza-2026` (técnico), `/invitacion/inv-supervisor-2026` (supervisor) e
`/invitacion/inv-vencida-2026` (vencida).

### Persistencia

Los datos viven en `localStorage` con prefijo `mda.`. Para reiniciar los datos de prueba, borra el almacenamiento
del sitio (F12 → Application → Local Storage → Clear).

## Cómo sumar una historia

1. Crear las pantallas en `src/pages/<carpeta>/` y sus datos en `src/services/`.
2. Registrar la ruta en `src/App.jsx`, dentro del bloque de su rol.
3. Agregar la opción al menú en `src/data/navegacion.js` (`MENU_POR_ROL`).

## Trabajo en equipo

Una rama por integrante (`feature/huN-...`) y los cambios entran a `main` mediante *pull request* revisado por otro
integrante. Los commits describen qué se hizo.
