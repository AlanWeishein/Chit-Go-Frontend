// Lo que usa el cliente desde la mesa. Las pantallas usan estas funciones, nunca fetch directo.
// La mesa va por el tokenQR y el celular por el header X-Session-Token: el número de mesa nunca viaja (08/09).
import { api, ApiError, type ProblemDetail } from './http'
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

// POST /public/pedidos. El uuidCliente es la clave de idempotencia: una por pedido, la misma en sus reintentos (RNF-09).
export interface PedidoAEnviar {
  uuidCliente: string
  items: { platoId: number; cantidad: number; observacion: string | null }[]
}

// Los estados del pedido (sección 12 del contrato).
export type EstadoPedido =
  | 'PENDIENTE_APROBACION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'SERVIDO'
  | 'CANCELADO'

export type MotivoRechazo = 'NO_DISPONIBLE' | 'PEDIDO_INVALIDO' | 'MESA_NO_OCUPADA'

export interface PedidoDeLaCuenta {
  id: number
  estado: EstadoPedido
  motivoRechazo: MotivoRechazo | null
  enviadoEn: string
  total: number
  items: { platoId: number; plato: string; cantidad: number; precioUnitario: number; observacion: string | null }[]
}

// GET /public/sesion/estado: la cuenta y todos sus pedidos como están ahora. El total ya deja afuera
// los rechazados y los cancelados.
export interface EstadoDeSesion {
  esIniciador: boolean
  cuentaEstado: 'ABIERTA' | 'SOLICITADA' | 'CERRADA'
  total: number
  pedidos: PedidoDeLaCuenta[]
}

export type FalloCliente =
  | { motivo: 'mesa-inexistente' } // 404
  | { motivo: 'mesa-no-disponible' } // 409 al abrir la sesión: la mesa está inhabilitada
  | { motivo: 'mozo-ya-avisado' } // 409 al llamar al mozo: hay un llamado sin atender
  | { motivo: 'pedido-sin-permiso' } // 403 al pedir: no es la sesión iniciadora, o la sesión no vale
  | { motivo: 'pedido-en-conflicto'; detalle?: string } // 409 al pedir: la cuenta se cerró o un plato ya no está
  | { motivo: 'pedido-invalido' } // 400 al pedir
  | { motivo: 'cancelar-en-conflicto'; detalle?: string } // 409 al cancelar: el pedido ya no está en espera
  | { motivo: 'sesion-invalida' } // 403 al pedir el estado o al cancelar: la sesión no vale o el pedido es de otra
  | { motivo: 'red' } // sin conexión o error inesperado

export class ClienteFallido extends Error {
  constructor(public fallo: FalloCliente) {
    super(fallo.motivo)
  }
}

type Endpoint = 'mesa' | 'sesion' | 'carta' | 'llamar-mozo' | 'pedido' | 'estado' | 'cancelar'

function detalleDe(err: ApiError): string | undefined {
  const cuerpo = err.detalle as ProblemDetail | undefined
  return typeof cuerpo?.detail === 'string' && cuerpo.detail !== '' ? cuerpo.detail : undefined
}

// Se compara el status, nunca el texto de detail.
export function traducirError(err: unknown, endpoint?: Endpoint): FalloCliente {
  if (err instanceof ClienteFallido) return err.fallo
  if (!(err instanceof ApiError)) return { motivo: 'red' }

  if (endpoint === 'llamar-mozo') return err.status === 409 ? { motivo: 'mozo-ya-avisado' } : { motivo: 'red' }
  if (endpoint === 'pedido') {
    if (err.status === 403) return { motivo: 'pedido-sin-permiso' }
    if (err.status === 400) return { motivo: 'pedido-invalido' }
    // El 409 es la cuenta cerrada o un plato que ya no está, y el status no los distingue: se muestra el detail del back.
    if (err.status === 409) return { motivo: 'pedido-en-conflicto', detalle: detalleDe(err) }
    return { motivo: 'red' }
  }
  if (endpoint === 'estado' || endpoint === 'cancelar') {
    if (err.status === 403) return { motivo: 'sesion-invalida' }
    if (endpoint === 'cancelar' && err.status === 409) return { motivo: 'cancelar-en-conflicto', detalle: detalleDe(err) }
    return { motivo: 'red' }
  }
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

// Con varias etiquetas va un ?etiqueta= por cada una, y el back devuelve los platos que tienen todas (HU-01).
export function obtenerCarta(tokenQR: string, etiquetas: string[] = []): Promise<Carta> {
  const params = new URLSearchParams()
  etiquetas.forEach((e) => params.append('etiqueta', e))
  const filtro = etiquetas.length > 0 ? `?${params}` : ''
  return conTraduccion('carta', () => api<Carta>(`${rutaMesa(tokenQR)}/menu${filtro}`))
}

// POST /public/avisos/llamar-mozo. Lo puede usar cualquier sesión de la mesa, también la de modo lectura.
export async function llamarAlMozo(tokenSesion: string): Promise<void> {
  await conTraduccion('llamar-mozo', () =>
    api<unknown>('/public/avisos/llamar-mozo', { method: 'POST', headers: { 'X-Session-Token': tokenSesion } }),
  )
}

// Solo la sesión iniciadora. 201 si lo creó y 200 si era un reintento de ese pedido: para la app son lo mismo.
export async function enviarPedido(tokenSesion: string, pedido: PedidoAEnviar): Promise<void> {
  await conTraduccion('pedido', () =>
    api<unknown>('/public/pedidos', {
      method: 'POST',
      headers: { 'X-Session-Token': tokenSesion },
      body: JSON.stringify(pedido),
    }),
  )
}

// El estado completo de la cuenta de esta sesión. Se pide al entrar a P-03, en cada reconexión y con cada
// aviso del WebSocket: la pantalla nunca se arma sumando eventos (RNF-08).
export function obtenerEstadoDeSesion(tokenSesion: string): Promise<EstadoDeSesion> {
  return conTraduccion('estado', () =>
    api<EstadoDeSesion>('/public/sesion/estado', { headers: { 'X-Session-Token': tokenSesion } }),
  )
}

// Solo mientras está en PENDIENTE_APROBACION y si es de esta sesión. Si Caja lo aprobó antes, 409.
export async function cancelarPedido(tokenSesion: string, pedidoId: number): Promise<void> {
  await conTraduccion('cancelar', () =>
    api<unknown>(`/public/pedidos/${pedidoId}/cancelar`, {
      method: 'POST',
      headers: { 'X-Session-Token': tokenSesion },
    }),
  )
}
