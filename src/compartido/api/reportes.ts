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

// Todas las cuentas cerradas del período, para el gráfico del dashboard (P-13). El detalle pagina de a 100 como mucho,
// así que se pide hasta la última página, como listarMesas(). Si una página falla, falla todo, para no mostrar barras
// a medias. El back las ordena de la más nueva a la más vieja.
export async function listarVentasDelPeriodo(ambito: Ambito, desde: string, hasta: string): Promise<Venta[]> {
  const todas: Venta[] = []
  for (let page = 0; ; page++) {
    const consultaDePagina = new URLSearchParams({ desde, hasta, page: String(page), size: '100' }).toString()
    const { detalle } = await api<VentasDelPeriodo>(`/${ambito}/reportes/ventas?${consultaDePagina}`)
    todas.push(...detalle.contenido)
    if (page + 1 >= detalle.totalPaginas) break
  }
  return todas
}

export function obtenerTiemposDePreparacion(ambito: Ambito, desde: string, hasta: string) {
  return api<TiemposDePreparacion>(`/${ambito}/reportes/tiempos-preparacion?${consulta(desde, hasta, 1)}`)
}

// Los más pedidos primero (el back ordena por cantidad). P-17 muestra los cinco primeros.
export async function listarPlatosMasPedidos(ambito: Ambito, desde: string, hasta: string): Promise<PlatoMasPedido[]> {
  const pagina = await api<Pagina<PlatoMasPedido>>(`/${ambito}/reportes/platos-mas-pedidos?${consulta(desde, hasta, 5)}`)
  return pagina.contenido
}
