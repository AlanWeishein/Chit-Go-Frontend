// Lo que usa el cliente desde la mesa. Las pantallas usan estas funciones, nunca fetch directo.
// La mesa va por el tokenQR y el celular por el header X-Session-Token: el número de mesa nunca viaja (08/09).
import { api, ApiError } from './http'
import { guardarTokenSesion, leerTokenSesion } from '../sesion/sesionMesa'
import type { Carta } from '../tipos/menu'

// GET /public/mesas/{tokenQR}. Una mesa inhabilitada responde 200 con disponible: false.
export interface EstadoMesa {
  numero: string
  disponible: boolean
  cuentaAbierta: boolean
}

// POST /public/mesas/{tokenQR}/sesiones
export interface SesionMesa {
  tokenSesion: string
  esIniciador: boolean
}

export type FalloCliente =
  | { motivo: 'mesa-inexistente' } // 404
  | { motivo: 'mesa-no-disponible' } // 409 al abrir la sesión: la mesa está inhabilitada
  | { motivo: 'mozo-ya-avisado' } // 409 al llamar al mozo: hay un llamado sin atender
  | { motivo: 'red' } // sin conexión o error inesperado

export class ClienteFallido extends Error {
  constructor(public fallo: FalloCliente) {
    super(fallo.motivo)
  }
}

type Endpoint = 'mesa' | 'sesion' | 'carta' | 'llamar-mozo'

// Se compara el status, nunca el texto de detail.
export function traducirError(err: unknown, endpoint?: Endpoint): FalloCliente {
  if (err instanceof ClienteFallido) return err.fallo
  if (!(err instanceof ApiError)) return { motivo: 'red' }

  if (endpoint === 'llamar-mozo') return err.status === 409 ? { motivo: 'mozo-ya-avisado' } : { motivo: 'red' }
  if (err.status === 404) return { motivo: 'mesa-inexistente' }
  if (endpoint === 'sesion' && err.status === 409) return { motivo: 'mesa-no-disponible' }

  return { motivo: 'red' }
}

async function conTraduccion<T>(endpoint: Endpoint, pedido: () => Promise<T>): Promise<T> {
  try {
    return await pedido()
  } catch (err) {
    throw new ClienteFallido(traducirError(err, endpoint))
  }
}

const rutaMesa = (tokenQR: string) => `/public/mesas/${encodeURIComponent(tokenQR)}`

export function consultarMesa(tokenQR: string): Promise<EstadoMesa> {
  return conTraduccion('mesa', () => api<EstadoMesa>(rutaMesa(tokenQR)))
}

// Una sola entrada en curso por mesa. Si la pantalla la pide dos veces seguidas (StrictMode en desarrollo),
// las dos esperan el mismo POST: un segundo POST saldría sin token y el back lo dejaría en modo lectura.
const entradasEnCurso = new Map<string, Promise<SesionMesa>>()

// 201 si la sesión es nueva; 200 si el back reconoce el token que este celular guardó para esa mesa.
export function entrarALaMesa(tokenQR: string): Promise<SesionMesa> {
  const enCurso = entradasEnCurso.get(tokenQR)
  if (enCurso) return enCurso

  const tokenGuardado = leerTokenSesion(tokenQR)
  const entrada = conTraduccion('sesion', () =>
    api<SesionMesa>(`${rutaMesa(tokenQR)}/sesiones`, {
      method: 'POST',
      headers: tokenGuardado ? { 'X-Session-Token': tokenGuardado } : undefined,
    }),
  )
    .then((sesion) => {
      guardarTokenSesion(tokenQR, sesion.tokenSesion)
      return sesion
    })
    .finally(() => entradasEnCurso.delete(tokenQR))

  entradasEnCurso.set(tokenQR, entrada)
  return entrada
}

export function obtenerCarta(tokenQR: string, etiqueta?: string): Promise<Carta> {
  const filtro = etiqueta ? `?etiqueta=${encodeURIComponent(etiqueta)}` : ''
  return conTraduccion('carta', () => api<Carta>(`${rutaMesa(tokenQR)}/menu${filtro}`))
}

// POST /public/avisos/llamar-mozo. Lo puede usar cualquier sesión de la mesa, también la de modo lectura.
export async function llamarAlMozo(tokenSesion: string): Promise<void> {
  await conTraduccion('llamar-mozo', () =>
    api<unknown>('/public/avisos/llamar-mozo', { method: 'POST', headers: { 'X-Session-Token': tokenSesion } }),
  )
}
