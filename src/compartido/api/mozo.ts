import { api } from './http'

// Vista del mozo (P-05, P-06 y P-07, HU-05).

export interface ItemDePedido {
  platoId: number
  plato: string
  cantidad: number
  precioUnitario: number
  observacion: string | null
}

export interface PedidoDeMesa {
  id: number
  estado: string // PENDIENTE_APROBACION, APROBADO, EN_PREPARACION, LISTO, SERVIDO, RECHAZADO, CANCELADO
  motivoRechazo: string | null
  prioridadManual: boolean
  enviadoEn: string
  total: number
  items: ItemDePedido[]
}

export interface MesaDelMozo {
  id: number
  numero: string
  inhabilitada: boolean
  asignada: boolean // false: la ve (salón completo) pero no puede actuar sobre ella
  cuentaId: number | null
  estado: 'LIBRE' | 'ABIERTA' | 'SOLICITADA'
  pedidos: PedidoDeMesa[] // [] si está libre
}

export type TipoDeAviso = 'LLAMAR_MOZO' | 'CUENTA_SOLICITADA' | 'MESA_SIN_MOZO'

export interface Aviso {
  id: number
  mesaId: number
  mesa: string
  tipo: TipoDeAviso
  creadoEn: string
  atendidoPorUsuarioId: number | null
  atendidoEn: string | null
}

// todas=false: sus mesas (también las libres). todas=true: el salón completo, solo para mirar.
export function listarMesas(todas: boolean) {
  return api<MesaDelMozo[]>(`/mozo/mesas?todas=${todas}`)
}

// pendientes=true: los de sus mesas sin atender, del más viejo al más nuevo. false: también los atendidos.
export function listarAvisos(pendientes: boolean) {
  return api<Aviso[]>(`/mozo/avisos?pendientes=${pendientes}`)
}

// 204. 403 mesa ajena, 404 no existe, 409 ya fue atendido.
export function atenderAviso(id: number) {
  return api<void>(`/mozo/avisos/${id}/atender`, { method: 'POST' })
}

// 204. Solo LISTO -> SERVIDO. 403 mesa ajena, 404 no existe, 409 ya no corresponde.
export function marcarServido(pedidoId: number) {
  return api<void>(`/mozo/pedidos/${pedidoId}/servido`, { method: 'POST' })
}
