import { api } from './http'

// Disponibilidad rápida (P-10 de Caja y P-10c del Admin, HU-09).

export interface PlatoConDisponibilidad {
  id: number
  nombre: string
  categoria: { id: number; nombre: string }
  disponible: boolean
}

export interface PedidoAfectado {
  id: number
  mesa: string
  estado: 'PENDIENTE_APROBACION' | 'APROBADO'
  platos: { platoId: number; nombre: string; cantidad: number }[] // todos los ítems del pedido
}

export interface CambioDeDisponibilidad {
  platoId: number
  disponible: boolean
  afectados: PedidoAfectado[] // vacío si se prendió el plato. Los En preparación no vienen.
}

// Todos los platos del local, también los apagados, en el orden de la carta.
export function listarPlatos() {
  return api<PlatoConDisponibilidad[]>('/platos')
}

// 200. 404 "El plato no existe".
export function cambiarDisponibilidad(platoId: number, disponible: boolean) {
  return api<CambioDeDisponibilidad>(`/platos/${platoId}/disponibilidad`, {
    method: 'PATCH',
    body: JSON.stringify({ disponible }),
  })
}
