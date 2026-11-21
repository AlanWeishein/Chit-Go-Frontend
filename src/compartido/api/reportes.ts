import { api } from './http'
import type { Pagina } from './paginacion'
export interface VentasDelPeriodo {
  total: number
  cantidadCuentas?: number
  ticketPromedio?: number
}

export interface TiempoDePreparacion {
  promedioSegundos: number
  cantidadPedidos?: number
}

export interface PlatoMasPedido {
  plato: string
  cantidad: number
}

function rango(desde: string, hasta: string): string {
  return new URLSearchParams({ desde, hasta }).toString()
}

export function obtenerVentas(desde: string, hasta: string) {
  return api<VentasDelPeriodo>(`/admin/reportes/ventas?${rango(desde, hasta)}`)
}

export function obtenerTiemposDePreparacion(desde: string, hasta: string) {
  return api<TiempoDePreparacion>(`/admin/reportes/tiempos-preparacion?${rango(desde, hasta)}`)
}

export async function listarPlatosMasPedidos(desde: string, hasta: string): Promise<PlatoMasPedido[]> {
  const respuesta = await api<PlatoMasPedido[] | Pagina<PlatoMasPedido>>(
    `/admin/reportes/platos-mas-pedidos?${rango(desde, hasta)}`,
  )
  return Array.isArray(respuesta) ? respuesta : respuesta.contenido
}
