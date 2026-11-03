import { api, ApiError } from './http'
import { suscribir } from '../ws/conexion'

export interface PlatoPedido {
  platoId: number
  plato: string
  cantidad: number
  precioUnitario: number
  observacion?: string
}

export interface PedidoMozo {
  id: number
  estado: string
  motivoRechazo?: string
  prioridadManual?: boolean
  enviadoEn: string
  total: number
  items: PlatoPedido[]
}

export interface MesaMozo {
  id: number
  numero: string
  inhabilitada: boolean
  asignada: boolean
  cuentaId: number | null
  estado: 'LIBRE' | 'ABIERTA' | 'SOLICITADA'
  pedidos: PedidoMozo[]
}

export interface AvisoMozo {
  id: number
  mesaId: number
  mesa: string
  tipo: 'LLAMAR_MOZO' | 'CUENTA_SOLICITADA' | 'MESA_SIN_MOZO'
  creadoEn: string
}

export type EventoMozo =
  | { tipo: 'PEDIDO_LISTO' | 'SERVIDO' | 'PEDIDO_CANCELADO'; pedidoId: number; mesaId: number; cuentaId: number | null; estado: string | null; detalle: string | null; ocurridoEn: string }
  | { tipo: 'AVISO_CREADO' | 'AVISO_ATENDIDO'; mesaId: number; cuentaId: number | null; pedidoId: number | null; estado: string | null; detalle: string | null; ocurridoEn: string }
  | { tipo: 'CUENTA_CERRADA'; cuentaId: number; mesaId: number; pedidoId: number | null; estado: string | null; detalle: string | null; ocurridoEn: string }

export function listarMesasAsignadas() {
  return api<MesaMozo[]>('/mozo/mesas?todas=false')
}

export function listarAvisosPendientes() {
  return api<AvisoMozo[]>('/mozo/avisos?pendientes=true')
}

export function servirPedido(id: number) {
  return api<void>(`/mozo/pedidos/${id}/servido`, { method: 'POST' })
}

export function atenderAviso(id: number) {
  return api<void>(`/mozo/avisos/${id}/atender`, { method: 'POST' })
}

export function escucharMozo(localId: number, alRecibir: (e: EventoMozo) => void, alConectar: () => void) {
  return suscribir(`/topic/local/${localId}/mozo/avisos`, (dato) => alRecibir(dato as EventoMozo), {
    alConectar
  })
}
