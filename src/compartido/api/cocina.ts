import { api } from './http'

// Cola de cocina, el KDS (P-11, HU-11).

export interface ItemDeCocina {
  plato: string
  cantidad: number
  observacion: string | null
}

export interface PedidoDeCocina {
  id: number
  mesa: string
  estado: string
  prioritario: boolean
  aprobadoEn: string
  enPreparacionEn: string | null
  listoEn: string | null
  items: ItemDeCocina[]
}

// La cola ya viene en el orden en que hay que preparar (prioritarios primero).
export interface VistaDeCocina {
  enCola: PedidoDeCocina[]
  enPreparacion: PedidoDeCocina[]
  listos: PedidoDeCocina[]
}

export function obtenerCola() {
  return api<VistaDeCocina>('/cocina/pedidos')
}

export function empezarPedido(id: number) {
  return api<void>(`/cocina/pedidos/${id}/en-preparacion`, { method: 'POST' })
}

export function marcarListo(id: number) {
  return api<void>(`/cocina/pedidos/${id}/listo`, { method: 'POST' })
}
