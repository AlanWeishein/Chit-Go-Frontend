# Interfaz de SuperAdmin

Implementación en `feat/super-admin`, preparada para revisión mediante PR a `develop`.
La publicación de la rama y la apertura de la PR fueron autorizadas por el usuario. No se realiza merge.
El backend no fue modificado.

## Referencias y diseño

Se inspeccionaron `LoginAdmin`, `CambiarContrasena`, `PantallaProvisoria`, los componentes de acceso,
las pantallas de Cliente, los tokens de estilos y `DESIGN.md`.
En esta base, Admin y Gerente/Dueño aún tienen una pantalla provisoria; no hay un panel completo
con tablas o paginación para reutilizar. La distribución administrativa sigue la especificación
existente: menú lateral de 208 px en escritorio, contenido con márgenes de 24 px y navegación
en columna sobre el contenido en celular.

Se conservaron Chocolate y Menta, Fraunces para títulos, Inter para texto, iconos SVG del repositorio,
campos de 48 px, botones y bordes existentes, sin sombras ni dependencias nuevas.
Las secciones corresponden a las dos operaciones reales del backend. No se agregaron estadísticas,
tablas ficticias, consultas globales ni paginación sin un contrato que las respalde.

Se reutilizan `RutaProtegida`, `SesionProvider`, `LoginAdmin`, `CambiarContrasena`, `CampoContrasena`,
`CampoConRotulo`, estilos de campos y botones, `AvisoDeFallo` y `NotaInformativa`.
El nuevo diálogo sigue el patrón nativo de `HojaCancelar`: confirmación, Escape y devolución del foco.

## Contrato inspeccionado

Fuente: checkout local `C:/Proyectos/Chit-Go-Backend`, especialmente `SuperadminController`,
`DatosDeAltaDeLocal`, `LocalCreado`, `AltaDeLocalService`, `Contrasena`, `AutenticacionController`,
los manejadores de errores y `docs/superadmin-presentacion.md`.
Se tomó el código implementado como fuente; `superadmin-analisis.md` describe un inventario histórico.

| Método y ruta (prefijo `/api/v1`) | Uso y respuesta |
| --- | --- |
| `GET /auth/sesion` | Sesión existente; `SUPERADMIN`, local nulo y marca de primer ingreso |
| `POST /auth/admin/login` | Login existente por email y contraseña |
| `POST /auth/credencial` | Cambio obligatorio de contraseña provisoria |
| `POST /auth/logout` | Cierre de sesión existente |
| `POST /superadmin/locales` | Alta de local y Gerente/Dueño; 201 con `localId`, `nombreLocal`, `tokenStaff`, `gerenteId`, `email` |
| `POST /superadmin/gerentes/desbloquear` | Email; 200 con `DESBLOQUEADO` o `NO_ESTABA_BLOQUEADO` |

Permisos reales: `local.crear` y `gerente.desbloquear`. La sesión no enumera permisos: el frontend
protege la navegación por rol y el backend autoriza cada operación.
No se mandan identificadores del operador ni `localId` para desbloquear.

El alta envía `nombreLocal` (obligatorio, hasta 120), `direccion` (opcional, hasta 255),
`nombreGerente` (obligatorio, hasta 120), `email` (hasta 160) y `password`.
La contraseña de alta se valida por puntos de código (8–64) y bytes UTF-8 (hasta 72), como BCrypt
en el backend. Los textos se envían sin espacios exteriores; la contraseña se conserva literalmente.
Las validaciones definitivas corresponden al servidor.

## Comportamiento implementado

- `/plataforma` dirige a `/plataforma/locales/nuevo`.
- `/plataforma/gerentes/desbloquear` permite desbloquear por email.
- Sin sesión, el panel deriva a `/admin/login`. Otros roles regresan a su ruta inicial.
- Una sesión SuperAdmin con contraseña provisoria pasa por `/admin/cambiar-contrasena`.
- Formularios con revisión y confirmación, estado de envío y bloqueo de envíos duplicados.
- El resultado del alta muestra exclusivamente los datos devueltos y permite seleccionar el enlace
  de acceso del personal para configurar su QR. Se mantiene solo en memoria de esa pantalla.
- El desbloqueo distingue una modificación efectiva de la ausencia de bloqueo.
- 400/404/409 muestran el detalle de ProblemDetail; 401 limpia la sesión local y vuelve al login;
  403 con `CREDENCIAL_PROVISORIA` exige cambio de contraseña; los demás 403 muestran un aviso.
- Errores de red o inesperados indican que el resultado no pudo confirmarse. No hay reintentos
  automáticos de escrituras que puedan haberse confirmado en el servidor.
- Se conserva `api()` como único cliente HTTP, con cookies `HttpOnly`, `credentials: include`
  y CSRF vigente mediante `X-XSRF-TOKEN`. No se agregó autenticación paralela ni mocks de SuperAdmin.
- No hay lista inicial que cargar: los formularios comienzan vacíos y los resultados aparecen solo
  después de una respuesta real. La carga inicial de sesión conserva el comportamiento existente.

## Archivos

Nuevos:

- `src/compartido/api/plataforma.ts`
- `src/compartido/tipos/plataforma.ts`
- `src/compartido/ui/ConfirmarOperacion.tsx`
- `src/roles/plataforma/validacion.ts`
- `src/roles/plataforma/useFalloPlataforma.ts`
- `src/roles/plataforma/componentes/ResultadoOperacion.tsx`
- `src/roles/plataforma/paginas/PanelPlataforma.tsx`
- `src/roles/plataforma/paginas/CrearLocal.tsx`
- `src/roles/plataforma/paginas/DesbloquearGerente.tsx`
- `docs/superadmin.md`

Modificados:

- `src/App.tsx`: panel protegido en la ruta de plataforma existente.
- `src/compartido/api/auth.ts`: tipo de rol SuperAdmin.
- `src/compartido/tipos/auth.ts`: reutiliza el mismo catálogo de roles.
- `src/compartido/sesion/rutas.ts`: destinos y nombre del rol; acceso por email.
- `src/compartido/sesion/RutaProtegida.tsx`: usa el login existente para SuperAdmin.
- `src/compartido/sesion/SesionContext.tsx`: invalidación local al recibir 401.
- `src/roles/acceso/paginas/LoginAdmin.tsx`: acceso identificado y aviso de sesión vencida.
- `src/roles/acceso/paginas/CambiarContrasena.tsx`: identifica correctamente el rol en el primer ingreso.

## Verificación y pendientes

**No se ejecutaron el frontend, la compilación, pruebas ni una revisión visual en navegador.**
El usuario pidió expresamente dejar la implementación sin probar. Antes de esa indicación,
la terminal no encontraba Node/npm y no se autorizó descargar un runtime temporal.
El backend estaba detenido. La integración está implementada según el contrato inspeccionado,
pero no se afirma que haya sido comprobada de punta a punta ni que esté libre de regresiones.

Queda pendiente verificar autenticación y primer ingreso con una cuenta real, permisos/CSRF,
alta y conflictos, ambos resultados de desbloqueo, errores, navegación, cierre/vencimiento,
accesibilidad del diálogo y responsive a 375, 768, 1024 y 1280 px.
También queda pendiente ejecutar los scripts existentes `npm run typecheck` y `npm run build`.
El repositorio no incluye un runner de pruebas automatizadas.

Capacidades que el backend no proporciona: listado global, búsqueda de locales o Gerentes,
edición/baja/suspensión de locales, métricas, auditoría global, impersonación, gestión HTTP
de operadores SuperAdmin y recuperación de contraseñas. No están implementadas en la interfaz.
El alta y desbloqueo de la cuenta SuperAdmin se realizan por los comandos operativos del backend.

## Levantar y acceder cuando se decida probar

1. Preparar el backend con la migración V10 y una cuenta SuperAdmin siguiendo
   `C:/Proyectos/Chit-Go-Backend/docs/superadmin-presentacion.md`. Usar la base de prueba aislada
   indicada allí; no aplicar migraciones o seeds sobre una base compartida sin revisar su alcance.
2. Con Node compatible con Vite 7 disponible, ejecutar `npm ci` y luego `npm run dev` en el frontend.
3. Mantener `VITE_MOCKS` ausente o en `false`; no existe una cuenta SuperAdmin simulada.
4. Abrir `http://localhost:5173/admin/login` y entrar con la cuenta SuperAdmin preparada.
   Si Vite informa otro puerto, usar ese origen. Completar el cambio inicial cuando corresponda.
5. El rol dirige a `/plataforma/locales/nuevo`; la segunda sección se abre desde el menú.

Vite conserva el proxy `/api` al backend en `http://localhost:8080`, sin cambiar el origen de las cookies.
No se crearon credenciales ni se modificaron datos del backend durante esta entrega.
