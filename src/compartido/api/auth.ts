import { api, ApiError } from './http'

export type Rol = 'Mozo' | 'Caja' | 'Cocina' | 'Admin' | 'Gerente'

export interface Usuario { id: number; nombre: string; rol: Rol }
export interface Sesion { usuario: Usuario; debeCambiarCredencial: boolean }

export type FalloLogin =
  | { motivo: 'credenciales'; intentosRestantes?: number }
  | { motivo: 'bloqueado' }
  | { motivo: 'local-invalido' }
  | { motivo: 'red' }

export class LoginFallido extends Error {
  constructor(public fallo: FalloLogin) { super(fallo.motivo) }
}

export function traducirError(err: unknown): FalloLogin {
  if (err instanceof LoginFallido) return err.fallo
  if (err instanceof ApiError) {
    if (err.status === 401) {
      const d = err.detalle as { intentosRestantes?: number } | undefined
      return { motivo: 'credenciales', intentosRestantes: d?.intentosRestantes }
    }
    if (err.status === 423) return { motivo: 'bloqueado' }
    if (err.status === 404) return { motivo: 'local-invalido' }
  }
  return { motivo: 'red' }
}

const USAR_MOCKS = import.meta.env.DEV && import.meta.env.VITE_USAR_MOCKS !== 'false'

const USUARIOS_MOCK: (Usuario & { pin: string })[] = [
  { id: 1, nombre: 'Juan', rol: 'Mozo', pin: '1234' },
  { id: 2, nombre: 'Carla', rol: 'Caja', pin: '2468' },
  { id: 3, nombre: 'Marcos', rol: 'Cocina', pin: '1357' },
]
const intentosMock: Record<number, number> = {}
let sesionMock: Sesion | null = null 
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function listarUsuariosPin(tokenStaff: string): Promise<Usuario[]> {
  if (USAR_MOCKS) {
    await pausa(300)
    return USUARIOS_MOCK.map(({ id, nombre, rol }) => ({ id, nombre, rol }))
  }
  return api<Usuario[]>(`/auth/staff/${encodeURIComponent(tokenStaff)}/usuarios`)
}

export async function loginConPin(tokenStaff: string, usuarioId: number, pin: string): Promise<Sesion> {
  if (USAR_MOCKS) {
    await pausa(400)
    const u = USUARIOS_MOCK.find((x) => x.id === usuarioId)
    if (!u) throw new LoginFallido({ motivo: 'credenciales' })
    if ((intentosMock[u.id] ?? 0) >= 5) throw new LoginFallido({ motivo: 'bloqueado' })
    if (u.pin !== pin) {
      intentosMock[u.id] = (intentosMock[u.id] ?? 0) + 1
      throw new LoginFallido({ motivo: 'credenciales', intentosRestantes: 5 - intentosMock[u.id] })
    }
    intentosMock[u.id] = 0
    sesionMock = { usuario: { id: u.id, nombre: u.nombre, rol: u.rol }, debeCambiarCredencial: false }
    return sesionMock
  }
  return api<Sesion>('/auth/login-pin', { method: 'POST', body: JSON.stringify({ tokenStaff, usuarioId, pin }) })
}

export async function loginAdmin(email: string, password: string): Promise<Sesion> {
  if (USAR_MOCKS) {
    await pausa(400)
    if (email !== 'admin@laesquina.test' || password !== 'admin1234') throw new LoginFallido({ motivo: 'credenciales' })
    sesionMock = { usuario: { id: 99, nombre: 'Admin', rol: 'Admin' }, debeCambiarCredencial: false }
    return sesionMock
  }
  return api<Sesion>('/auth/login-admin', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function obtenerSesion(): Promise<Sesion | null> {
  if (USAR_MOCKS) return sesionMock
  try {
    return await api<Sesion>('/auth/sesion')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export async function cerrarSesion(): Promise<void> {
  if (USAR_MOCKS) { sesionMock = null; return; }
  await api<void>('/auth/logout', { method: 'POST' })
}
