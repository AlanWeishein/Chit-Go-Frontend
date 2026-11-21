import { api } from './http'
import type { Pagina } from './paginacion'

// Los reportes de HU-15 (P-17). El Admin los pide a /admin/reportes y el Gerente/Dueño a /gerente/reportes, con los
// mismos parámetros y la misma respuesta (ReportesController y ReportesGerenteController). Ninguno manda localId: el
// back lo saca de la sesión o del propietario. desde y hasta son AAAA-MM-DD, inclusivos, en la zona del local.
export type Ambito = 'admin' | 'gerente'

export interface Venta {
  cuentaId: number
  cerradaEn: string // ISO
  total: number
}

// ConsultarReportesService.VentasDto. Solo cuentas cerradas del período; el detalle va por cuenta, paginado.
export interface VentasDelPeriodo {
  desde: string
  hasta: string
  totalVentas: number
  cantidadCuentas: number
  detalle: Pagina<Venta>
}

// TiemposDto. El promedio va de En preparación a Listo, en segundos; es null si no hubo pedidos.
export interface TiemposDePreparacion {
  desde: string
  hasta: string
  cantidadPedidos: number
  promedioSegundos: number | null
}

export interface PlatoMasPedido {
  platoId: number
  nombre: string
  cantidad: number
}

function consulta(desde: string, hasta: string, size: number): string {
  return new URLSearchParams({ desde, hasta, page: '0', size: String(size) }).toString()
}

// La pantalla usa solo los totales: el detalle se pide de a 1 para no traer las cuentas.
export function obtenerVentas(ambito: Ambito, desde: string, hasta: string) {
  return api<VentasDelPeriodo>(`/${ambito}/reportes/ventas?${consulta(desde, hasta, 1)}`)
}

export function obtenerTiemposDePreparacion(ambito: Ambito, desde: string, hasta: string) {
  return api<TiemposDePreparacion>(`/${ambito}/reportes/tiempos-preparacion?${consulta(desde, hasta, 1)}`)
}

// Los más pedidos primero (el back ordena por cantidad). P-17 muestra los cinco primeros.
export async function listarPlatosMasPedidos(ambito: Ambito, desde: string, hasta: string): Promise<PlatoMasPedido[]> {
  const pagina = await api<Pagina<PlatoMasPedido>>(`/${ambito}/reportes/platos-mas-pedidos?${consulta(desde, hasta, 5)}`)
  return pagina.contenido
}
