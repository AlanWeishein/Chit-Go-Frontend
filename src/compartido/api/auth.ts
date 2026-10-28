// Autenticación. Las pantallas usan estas funciones, nunca fetch directo.
// El JWT viaja en una cookie HttpOnly: el front no lo guarda ni lo lee.
import { api, ApiError, type ProblemDetail } from './http'

/* ---------------- Tipos (forma exacta del contrato del back) ---------------- */

export type Rol = 'MOZO' | 'CAJA' | 'COCINA' | 'ADMIN' | 'GERENTE_DUENO'

export interface Local {
  id: number
  nombre: string
}

// La devuelven POST /auth/pin, POST /auth/admin/login y GET /auth/sesion. Es plana.
export interface Sesion {
  id: number
  nombre: string
  rol: Rol
  local: Local | null // null para el Gerente/Dueño
  debeCambiarCredencial: boolean
  expiraEn: string // ISO
}

// Un ítem de la lista de nombres de P-04b (el back no manda el rol)
export interface Usuario {
  id: number
  nombre: string
}

// GET /public/staff/{tokenStaff}
export interface DatosStaff {
  nombreLocal: string
  usuarios: Usuario[]
}

// GET /auth/dispositivo y POST /auth/mozo/login: el mozo que validó su contraseña en este navegador
export interface Dispositivo {
  id: number
  nombre: string
  venceEn: string // ISO
}

// POST /auth/credencial. Cada rol manda solo lo suyo; lo que no va, sin mandar.
export interface CredencialNueva {
  pin?: string
  pinRepetido?: string
  password?: string
  passwordRepetida?: string
}

/* ---------------- Errores ---------------- */

export type FalloLogin =
  | { motivo: 'qr-invalido' } // 404
  | { motivo: 'bloqueado' } // 423
  | { motivo: 'contrasena-requerida' } // 401 + codigo CONTRASENA_REQUERIDA (mozo sin cookie de dispositivo)
  | { motivo: 'pin-incorrecto' } // 401 sin codigo, en /auth/pin
  | { motivo: 'pin-invalido' } // 400 en /auth/pin
  | { motivo: 'admin-incorrecto' } // 401 en /auth/admin/login
  | { motivo: 'mozo-incorrecto' } // 401 en /auth/mozo/login
  | { motivo: 'mozo-invalido' } // 400 en /auth/mozo/login
  | { motivo: 'credencial-provisoria' } // 403 + codigo CREDENCIAL_PROVISORIA
  | { motivo: 'credencial-rechazada'; detalle?: string } // 400 en /auth/credencial: el detail del back
  | { motivo: 'credencial-elegida' } // 409 en /auth/credencial
  | { motivo: 'sesion-vencida' } // 401 en /auth/credencial
  | { motivo: 'red' } // sin conexión o error inesperado

export class LoginFallido extends Error {
  constructor(public fallo: FalloLogin) {
    super(fallo.motivo)
  }
}

export type Endpoint = 'staff' | 'pin' | 'admin' | 'mozo' | 'credencial'

function codigoDe(err: ApiError): string | undefined {
  const d = err.detalle as ProblemDetail | undefined
  return typeof d?.codigo === 'string' ? d.codigo : undefined
}

function detailDe(err: ApiError): string | undefined {
  const d = err.detalle as ProblemDetail | undefined
  return typeof d?.detail === 'string' && d.detail.trim() !== '' ? d.detail : undefined
}

// Se compara status y codigo del ProblemDetail, nunca el texto de detail.
export function traducirError(err: unknown, endpoint?: Endpoint): FalloLogin {
  if (err instanceof LoginFallido) return err.fallo
  if (!(err instanceof ApiError)) return { motivo: 'red' }

  const codigo = codigoDe(err)
  if (err.status === 403 && codigo === 'CREDENCIAL_PROVISORIA') return { motivo: 'credencial-provisoria' }

  if (endpoint === 'staff' && err.status === 404) return { motivo: 'qr-invalido' }

  if (endpoint === 'pin') {
    if (err.status === 404) return { motivo: 'qr-invalido' }
    if (err.status === 423) return { motivo: 'bloqueado' }
    if (err.status === 401 && codigo === 'CONTRASENA_REQUERIDA') return { motivo: 'contrasena-requerida' }
    if (err.status === 401 && codigo === undefined) return { motivo: 'pin-incorrecto' }
    if (err.status === 400) return { motivo: 'pin-invalido' }
  }

  if (endpoint === 'admin' && err.status === 401) return { motivo: 'admin-incorrecto' }

  if (endpoint === 'mozo') {
    if (err.status === 404) return { motivo: 'qr-invalido' }
    if (err.status === 423) return { motivo: 'bloqueado' }
    if (err.status === 401) return { motivo: 'mozo-incorrecto' }
    if (err.status === 400) return { motivo: 'mozo-invalido' }
  }

  // El 400 tiene varios sentidos sin codigo ("No coinciden", "distinto del anterior"…): se muestra el detail.
  if (endpoint === 'credencial') {
    if (err.status === 400) return { motivo: 'credencial-rechazada', detalle: detailDe(err) }
    if (err.status === 409) return { motivo: 'credencial-elegida' }
    if (err.status === 401) return { motivo: 'sesion-vencida' }
  }

  return { motivo: 'red' }
}

async function conTraduccion<T>(endpoint: Endpoint, pedido: () => Promise<T>): Promise<T> {
  try {
    return await pedido()
  } catch (err) {
    throw new LoginFallido(traducirError(err, endpoint))
  }
}

/* ---------------- Mocks (solo en desarrollo) ----------------
   Devuelven la misma forma que el back real y fallan con ApiError + ProblemDetail, igual que
   http.ts, así que pasan por el mismo traducirError. Se prenden solo con VITE_MOCKS=true en
   .env.local. En un build de producción nunca se usan.

   Datos de prueba (token de staff: cualquiera; con "invalido" da 404):
   - PIN:   Carla (CAJA) 2468 · Marcos (COCINA) 1357
            Juan (MOZO): siempre pide usuario y contraseña (CONTRASENA_REQUERIDA), como un mozo sin cookie de dispositivo
            Lucía (COCINA) 0000: da 403 CREDENCIAL_PROVISORIA
            5 PIN incorrectos seguidos de un usuario y el siguiente intento da 423 (bloqueado)
   - Admin: admin@laesquina.test / admin1234 (ADMIN) · dueno@laesquina.test / dueno1234 (GERENTE_DUENO, local null) */
export const USAR_MOCKS = import.meta.env.DEV && import.meta.env.VITE_MOCKS === 'true'

const LOCAL_MOCK: Local = { id: 1, nombre: 'La Esquina' }

interface UsuarioMock extends Usuario {
  rol: Rol
  pin: string
  provisoria?: boolean
}
const USUARIOS_MOCK: UsuarioMock[] = [
  { id: 1, nombre: 'Juan', rol: 'MOZO', pin: '1234' },
  { id: 2, nombre: 'Carla', rol: 'CAJA', pin: '2468' },
  { id: 3, nombre: 'Marcos', rol: 'COCINA', pin: '1357' },
  { id: 4, nombre: 'Lucía', rol: 'COCINA', pin: '0000', provisoria: true },
]

interface AdminMock extends Usuario {
  rol: Rol
  email: string
  password: string
  local: Local | null
}
const ADMINS_MOCK: AdminMock[] = [
  { id: 90, nombre: 'Admin La Esquina', rol: 'ADMIN', email: 'admin@laesquina.test', password: 'admin1234', local: LOCAL_MOCK },
  { id: 91, nombre: 'Dueño', rol: 'GERENTE_DUENO', email: 'dueno@laesquina.test', password: 'dueno1234', local: null },
]

const INTENTOS_MAX = 5
const intentosMock: Record<number, number> = {}
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

function problema(status: number, title: string, detail: string, codigo?: string): ApiError {
  const cuerpo: ProblemDetail = { title, status, detail, ...(codigo ? { codigo } : {}) }
  return new ApiError(status, cuerpo)
}

// La cookie de sesión del mock vive en sessionStorage solo para que F5 no te saque en desarrollo.
const CLAVE_SESION_MOCK = 'chitgo-sesion-mock'
function leerSesionMock(): Sesion | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION_MOCK)
    const s = crudo ? (JSON.parse(crudo) as Sesion) : null
    return s && Date.parse(s.expiraEn) > Date.now() ? s : null
  } catch {
    return null
  }
}
function guardarSesionMock(s: Sesion | null) {
  try {
    if (s) sessionStorage.setItem(CLAVE_SESION_MOCK, JSON.stringify(s))
    else sessionStorage.removeItem(CLAVE_SESION_MOCK)
  } catch {
    /* sin storage: el mock simplemente no persiste */
  }
}
function nuevaSesionMock(base: { id: number; nombre: string; rol: Rol; local: Local | null }): Sesion {
  const minutos = base.rol === 'CAJA' ? 60 : 10 // inactividad por rol (09/10)
  const sesion: Sesion = {
    ...base,
    debeCambiarCredencial: false,
    expiraEn: new Date(Date.now() + minutos * 60_000).toISOString(),
  }
  guardarSesionMock(sesion)
  return sesion
}

async function mockDatosStaff(tokenStaff: string): Promise<DatosStaff> {
  await pausa(300)
  if (tokenStaff === 'invalido') throw problema(404, 'Not Found', 'QR de staff inexistente')
  return { nombreLocal: LOCAL_MOCK.nombre, usuarios: USUARIOS_MOCK.map(({ id, nombre }) => ({ id, nombre })) }
}

async function mockLoginPin(tokenStaff: string, usuarioId: number, pin: string): Promise<Sesion> {
  await pausa(400)
  if (tokenStaff === 'invalido') throw problema(404, 'Not Found', 'QR de staff inexistente')
  if (!/^\d{4,10}$/.test(pin)) throw problema(400, 'Bad Request', 'El PIN tiene de 4 a 10 dígitos')
  const u = USUARIOS_MOCK.find((x) => x.id === usuarioId)
  if (!u) throw problema(401, 'Unauthorized', 'Credenciales inválidas')
  if ((intentosMock[u.id] ?? 0) >= INTENTOS_MAX) throw problema(423, 'Locked', 'Usuario bloqueado')
  if (u.rol === 'MOZO') {
    throw problema(401, 'Unauthorized', 'Falta usuario y contraseña en este dispositivo', 'CONTRASENA_REQUERIDA')
  }
  if (u.pin !== pin) {
    intentosMock[u.id] = (intentosMock[u.id] ?? 0) + 1
    throw problema(401, 'Unauthorized', 'Credenciales inválidas')
  }
  if (u.provisoria) throw problema(403, 'Forbidden', 'Hay que elegir la credencial', 'CREDENCIAL_PROVISORIA')
  intentosMock[u.id] = 0
  return nuevaSesionMock({ id: u.id, nombre: u.nombre, rol: u.rol, local: LOCAL_MOCK })
}

async function mockLoginAdmin(email: string, password: string): Promise<Sesion> {
  await pausa(400)
  const a = ADMINS_MOCK.find((x) => x.email === email && x.password === password)
  if (!a) throw problema(401, 'Unauthorized', 'Credenciales inválidas')
  return nuevaSesionMock({ id: a.id, nombre: a.nombre, rol: a.rol, local: a.local })
}

async function mockSesion(): Promise<Sesion> {
  const s = leerSesionMock()
  if (!s) throw problema(401, 'Unauthorized', 'No hay sesión')
  return s
}

/* ---------------- Funciones públicas ---------------- */

// GET /public/staff/{tokenStaff}. Un token inválido da 404.
export function obtenerDatosStaff(tokenStaff: string): Promise<DatosStaff> {
  return conTraduccion('staff', () =>
    USAR_MOCKS ? mockDatosStaff(tokenStaff) : api<DatosStaff>(`/public/staff/${encodeURIComponent(tokenStaff)}`),
  )
}

// POST /auth/pin
export function loginConPin(tokenStaff: string, usuarioId: number, pin: string): Promise<Sesion> {
  return conTraduccion('pin', () =>
    USAR_MOCKS
      ? mockLoginPin(tokenStaff, usuarioId, pin)
      : api<Sesion>('/auth/pin', { method: 'POST', body: JSON.stringify({ tokenStaff, usuarioId, pin }) }),
  )
}

// POST /auth/admin/login
export function loginAdmin(email: string, password: string): Promise<Sesion> {
  return conTraduccion('admin', () =>
    USAR_MOCKS
      ? mockLoginAdmin(email, password)
      : api<Sesion>('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  )
}

// GET /auth/dispositivo: el front no puede leer la cookie de dispositivo. 204 (o cualquier falla) = no hay,
// y se muestra la lista de nombres. No tiene mock: con VITE_MOCKS=true también va al back.
export async function obtenerDispositivo(): Promise<Dispositivo | null> {
  try {
    return (await api<Dispositivo | undefined>('/auth/dispositivo')) ?? null
  } catch {
    return null
  }
}

// POST /auth/mozo/login (P-32). No abre la sesión: deja la cookie de dispositivo y después va el PIN.
export function loginMozo(tokenStaff: string, nombreUsuario: string, password: string): Promise<Dispositivo> {
  return conTraduccion('mozo', () =>
    api<Dispositivo>('/auth/mozo/login', {
      method: 'POST',
      body: JSON.stringify({ tokenStaff, nombreUsuario, password }),
    }),
  )
}

// POST /auth/credencial (P-29, P-30, P-31 y P-32b). Devuelve la sesión nueva, ya sin la marca.
export function elegirCredencial(credencial: CredencialNueva): Promise<Sesion> {
  return conTraduccion('credencial', () =>
    api<Sesion>('/auth/credencial', { method: 'POST', body: JSON.stringify(credencial) }),
  )
}

// GET /auth/sesion: el front no puede leer la cookie, así que pregunta quién está logueado. 401 = nadie.
export async function obtenerSesion(): Promise<Sesion | null> {
  try {
    return await (USAR_MOCKS ? mockSesion() : api<Sesion>('/auth/sesion'))
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

// POST /auth/logout → 204
export async function cerrarSesion(): Promise<void> {
  if (USAR_MOCKS) {
    guardarSesionMock(null)
    return
  }
  await api<void>('/auth/logout', { method: 'POST' })
}
