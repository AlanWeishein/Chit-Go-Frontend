# chit-go-front

Front de Chit&Go: una sola PWA con React, Vite, TypeScript y Tailwind, con una sección por rol.
El back está en [Chit-Go-Backend](https://github.com/AlanWeishein/Chit-Go-Backend).

## Stack

React 19, Vite 7, TypeScript 5.9, Tailwind 4, `react-router-dom` 7 y `@stomp/stompjs` 7 (las versiones
exactas están en `package.json`). Hace falta Node 20.19+ o 22.12+, que es lo que pide Vite 7.

## Cómo correrlo

1. Levantar el back (Compose con MySQL en el 3307, y el back con el perfil `dev`). Los pasos están en su
   [README](https://github.com/AlanWeishein/Chit-Go-Backend/blob/develop/README.md#c%C3%B3mo-correrlo).
   Para saber si está vivo: `GET http://localhost:8080/api/v1/ping`.
2. En esta carpeta: `npm install` y `npm run dev`.
3. Abrir `http://localhost:5173` (si el puerto está ocupado, Vite elige otro y lo dice en la consola).

Se entra siempre por la URL de Vite, nunca directo al 8080. En desarrollo Vite reenvía `/api` y `/ws` al
back (`vite.config.ts`), así el front y la API comparten origen y las cookies andan sin CORS.

## Variables de entorno

Hay una sola, y es opcional: `VITE_MOCKS`. Con `VITE_MOCKS=true` en un archivo `.env.local` (que git
ignora), `npm run dev` responde el login con datos de prueba. Los datos están en el comentario
de `src/compartido/api/auth.ts`. Cubre la lista de staff, el PIN, la sesión y el login del Admin. Todo lo
demás va siempre al back real: la cookie de dispositivo, `/auth/mozo/login`, `/auth/credencial`, la mesa y
el pedido. Sin el archivo, o con la variable en `false`, va todo al back. Para probar contra el back, que
sea `false`. En el build de producción los mocks nunca se usan.

## Scripts

- `npm run dev`: servidor de desarrollo de Vite.
- `npm run build`: revisa los tipos (`tsc --noEmit`) y arma el build en `dist/`.
- `npm run preview`: sirve el build ya armado.
- `npm run typecheck`: solo revisa los tipos.

No hay tests automáticos. Cada cambio se prueba con `npm run build` y un recorrido en el navegador, a
375 px de ancho, contra el back real.

## Carpetas

```
src/
├── roles/        una carpeta por rol, cada una con paginas/ y componentes/
│   ├── cliente/      la carta, el carrito y el pedido (se entra por /mesa/{token})
│   ├── acceso/       el login de todo el personal y el primer ingreso
│   └── caja, cocina, mozo, admin, plataforma   todavía vacías
├── compartido/
│   ├── api/          http.ts (el único que llama a fetch), auth.ts (login y sesión) y cliente.ts (mesa, carta, pedido)
│   ├── sesion/       quién está logueado, las rutas protegidas y el token de la mesa del celular
│   ├── ws/           la conexión STOMP a /ws (todavía no la usa ninguna pantalla)
│   ├── tipos/        los tipos del contrato
│   ├── ui/           piezas que usan varios roles
│   ├── utils/        funciones chicas
│   └── estilos/      index.css, con los colores como tokens de Tailwind
└── mocks/            vacía: los mocks del login están en compartido/api/auth.ts
```

Rutas (`src/App.tsx`):

- `/mesa/{tokenQR}`: el cliente.
- `/staff/{tokenStaff}`: el login con PIN de Mozo, Caja y Cocina. `/staff/{tokenStaff}/elegir-pin` es el primer ingreso.
- `/admin/login`: el login con email del Admin y del Gerente/Dueño. `/admin/cambiar-contrasena` es su primer ingreso.
- `/mozo`, `/caja`, `/cocina` y `/admin`: una pantalla provisoria que muestra quién entró y tiene "Cerrar sesión".
- `/plataforma`: "En construcción".

Las pantallas nunca llaman a `fetch` directo: pasan por `compartido/api`.

## Cómo se habla con el back

El contrato completo (rutas, cuerpos y errores) es `chit-go-endpoints-api`, que está en un PDF: pedíselo a
Eze. Acá va solo lo que el front tiene que respetar.

**Personal** (Mozo, Caja, Cocina, Admin y Gerente/Dueño):

- La sesión es una cookie `HttpOnly` (`chitgo_sesion`). El front no la puede leer: para saber quién está
  logueado llama a `GET /api/v1/auth/sesion`, que da `401` si no hay sesión.
- Todo `POST`, `PUT`, `PATCH` y `DELETE` lleva el header `X-XSRF-TOKEN`, con el valor de la cookie
  `XSRF-TOKEN`. `http.ts` la lee al mandar cada request, porque la cookie cambia en cada respuesta con
  sesión. Sin el header, el back responde `403`.
- Los errores llegan como ProblemDetail. Para decidir qué hacer se compara el `codigo` (por ejemplo
  `CONTRASENA_REQUERIDA`) y el status, no el texto del `detail`.

**Cliente** (anónimo, sin login):

- La mesa se identifica con el `tokenQR` de la URL. El número de mesa nunca viaja.
- El celular se identifica con el header `X-Session-Token`. El `tokenSesion` se guarda en `localStorage`,
  con la clave `chitgo-mesa:{tokenQR}`, una por mesa.
- Cada pedido lleva un `uuidCliente`, que se genera al armarlo y se reusa solo en los reintentos de ese mismo
  pedido. Así, si se corta la red o se toca dos veces, el back no crea otro.

## Para probar en local

Con el back levantado y con el perfil `dev`, la seed carga La Esquina. Estas son las URLs con sus tokens
(salen del encabezado de `db/dev/R__datos_de_prueba.sql` del back):

- Mesa 1: `http://localhost:5173/mesa/d4964b6b-fdae-4b4f-83e9-1c1e78a21723`
- Mesa 2: `http://localhost:5173/mesa/7ac79c59-b48d-4db2-8365-5c6a6565d9f4`
- Login del staff: `http://localhost:5173/staff/83f39b25-deac-4fde-80cc-4cfdf8117713`
- Login del Admin: `http://localhost:5173/admin/login`

Quién entra con qué PIN, usuario o contraseña está en la tabla de
["Datos de prueba (dev)"](https://github.com/AlanWeishein/Chit-Go-Backend/blob/develop/README.md#datos-de-prueba-dev)
del README del back.

Si el navegador ya tiene la cookie de dispositivo de un mozo (la deja el login con usuario y contraseña y
dura 7 días), `/staff/{tokenStaff}` abre directo el PIN de ese mozo. Para entrar como Caja o Cocina, tocá
"Cambiar" y elegí el nombre de la lista.

Dos cosas de la seed para tener en cuenta:

- Entrar a una mesa que no tiene cuenta la abre, y ese celular queda como el iniciador, el único que puede
  pedir. Para volver a ser iniciador hay que usar otra mesa o volver a cargar la seed. Un segundo celular en
  la misma mesa ve la carta en modo lectura.
- La seed borra todos los datos de negocio y los carga de nuevo. Se pierden las cuentas y los pedidos que
  hayas probado a mano.

## Diseño

La dirección visual está en `DESIGN.md`. Los colores son la paleta "Chocolate y Menta", decidida el 09/10, y
están como tokens de Tailwind en `src/compartido/estilos/index.css`. Los colores nuevos van con estos tokens
(`bg-fondo`, `text-texto`, `border-secundario`…), no con colores sueltos.

| Token | Color | Para qué |
|---|---|---|
| `fondo` | `#F6F5F2` | Fondo de la pantalla |
| `tarjeta` | `#FFFFFF` | Tarjetas |
| `linea` | `#E4E0DA` | Separadores |
| `texto` | `#2A211D` | Texto principal |
| `secundario` | `#6E635C` | Texto de apoyo y bordes de los campos |
| `primario` | `#4B3027` | Botón principal, marca y enlaces |
| `suave` | `#DCEDE4` | Resalte suave, como el hover |

## Ramas

`main` estable, `develop` en desarrollo, `feature/...` por tarea. PR a `develop`, lo revisa otro.

## Todavía no está

- La PWA: manifest, íconos y un service worker liviano que solo cachea archivos estáticos (sin modo offline
  para pedidos). Hoy `public/` está vacía.
- Las pantallas de Mozo, Caja, Cocina, Admin y Plataforma.
- Probar desde el celular con la IP de la compu. El pedido no sale por http con IP, porque
  `crypto.randomUUID()` solo existe en HTTPS o en `localhost`, y Vite escucha solo en `localhost`.
