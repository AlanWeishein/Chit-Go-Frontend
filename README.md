# chit-go-front

Front de Chit&Go: una sola PWA con React, Vite, TypeScript y Tailwind, con una sección por rol.

## Estructura

```
src/
├── roles/        cliente, acceso, caja, cocina, mozo, admin, plataforma (cada uno con paginas/ y componentes/)
├── compartido/   api (cliente HTTP), ws (conexión STOMP), sesion, ui, estilos
└── mocks/        respuestas de prueba según el contrato de la API
```

Rutas: `/mesa/{token}` (Cliente), `/staff/{token}` (login con PIN), `/admin` (Admin y Gerente/Dueño), `/plataforma` (Super Admin).
Las pantallas nunca llaman a `fetch` directo: pasan por `compartido/api`.

## Cómo correrlo

```
npm install
npm run dev
```

En desarrollo `/api` y `/ws` se reenvían a `http://localhost:8080` (el back).

## Ramas

`main` estable, `develop` en desarrollo, `feature/...` por tarea. PR a `develop`, lo revisa otro.

## Pendiente

- PWA: manifest, íconos y service worker liviano que solo cachea archivos estáticos (sin modo offline para pedidos).
- Página de cada rol y mocks según `chit-go-endpoints-api`.
