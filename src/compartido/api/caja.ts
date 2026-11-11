import type { PedidoDeCocina } from './cocina'
import { api } from './http'

// ---------- Cola de aprobación (P-08, HU-07 y la alerta de HU-08) ----------

export interface ItemPorAprobar {
  platoId: number
  plato: string
  cantidad: number
  observacion: string | null
  disponible: boolean // false: el plato se apagó después de que el cliente lo pidió
}

export interface PedidoPorAprobar {
  id: number
  mesa: string // el número que se muestra, no el id
  enviadoEn: string // ISO
  segundosDeEspera: number // calculado por el back en el momento del GET
  demorado: boolean // más de 3 minutos sin resolver (a los 181 segundos)
  items: ItemPorAprobar[] // sin precios: el back no los manda
}

export type MotivoRechazo = 'NO_DISPONIBLE' | 'PEDIDO_INVALIDO' | 'MESA_NO_OCUPADA'

export const TEXTO_MOTIVO: Record<MotivoRechazo, string> = {
  NO_DISPONIBLE: 'No disponible',
  PEDIDO_INVALIDO: 'Pedido inválido',
  MESA_NO_OCUPADA: 'Mesa no ocupada',
}

// Del más viejo al más nuevo.
export function listarPorAprobar() {
  return api<PedidoPorAprobar[]>('/caja/pedidos?estado=PENDIENTE_APROBACION')
}

// 204. 404 "El pedido no existe"; 409 "El pedido ya fue cancelado" o "El pedido ya fue resuelto".
export function aprobarPedido(id: number) {
  return api<void>(`/caja/pedidos/${id}/aprobar`, { method: 'POST' })
}

// Mismos errores que aprobar. Sin version: el back la toma de la base.
export function rechazarPedido(id: number, motivo: MotivoRechazo) {
  return api<void>(`/caja/pedidos/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo }) })
}

// ---------- Cuentas y cierre (P-09, HU-10) ----------

export interface CuentaPorCobrar {
  id: number
  mesa: string
  estado: 'ABIERTA' | 'SOLICITADA'
  abiertaEn: string
  solicitadaEn: string | null
  total: number // OJO: incluye lo sin servir; si se cierra ahora, el ticket sale por menos
  pedidosSinServir: number
}

export interface ItemDeTicket {
  plato: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Ticket {
  numero: number
  local: string
  mesa: string
  emitidoEn: string
  items: ItemDeTicket[]
  total: number
  letra: string // "X"
  leyenda: string // "DOCUMENTO NO VÁLIDO COMO FACTURA"
}

export type MotivoDeConfirmacion = 'NADIE_PIDIO_LA_CUENTA' | 'PEDIDOS_SIN_SERVIR'

export interface PedidoSinServir {
  id: number
  estado: string
  platos: { plato: string; cantidad: number }[]
}

// El cuerpo del 409 cuando hay que confirmar el cierre (codigo === 'CONFIRMAR_CIERRE').
export interface ConfirmacionDeCierre {
  status: 409
  detail: string
  codigo: 'CONFIRMAR_CIERRE'
  motivos: MotivoDeConfirmacion[]
  pedidosSinServir: PedidoSinServir[] // [] si el único motivo es que nadie pidió la cuenta
}

// Primero las Solicitadas y después las Abiertas.
export function listarCuentasPorCobrar() {
  return api<CuentaPorCobrar[]>('/caja/cuentas?estado=ABIERTA,SOLICITADA')
}

// Sin confirmación: 200 con el ticket, o 409 con codigo CONFIRMAR_CIERRE (ver ConfirmacionDeCierre).
// Con confirmación: confirmar true y los ids de pedidosSinServir que Caja vio. Si entró otro pedido, vuelve el 409.
// Otros errores: 404 "La cuenta no existe", 409 "La cuenta ya está cerrada", 409 de choque (reintentar).
export function cerrarCuenta(id: number, confirmacion?: { pedidosACancelar: number[] }) {
  const cuerpo = confirmacion ? { confirmar: true, pedidosACancelar: confirmacion.pedidosACancelar } : { confirmar: false }
  return api<Ticket>(`/caja/cuentas/${id}/cerrar`, { method: 'POST', body: JSON.stringify(cuerpo) })
}

// El mismo ticket del cierre. 404 si la cuenta todavía no se cerró.
export function reimprimirTicket(cuentaId: number) {
  return api<Ticket>(`/caja/cuentas/${cuentaId}/ticket`)
}

// ---------- Cancelar y priorizar (P-10b, P-36) ----------

// 204. Pendientes y aprobados. 404 si uno no existe o es de otro local; 409 si uno ya no se puede cancelar
// (y no se cancela ninguno).
export function cancelarPedidos(pedidoIds: number[]) {
  return api<void>('/caja/pedidos/cancelar', { method: 'POST', body: JSON.stringify({ pedidoIds }) })
}

export function cancelarPedido(id: number) {
  return api<void>(`/caja/pedidos/${id}/cancelar`, { method: 'POST' })
}

// 204. Solo pedidos APROBADO (todavía sin empezar en cocina).
export function cambiarPrioridad(id: number, prioridadManual: boolean) {
  return api<void>(`/caja/pedidos/${id}/prioridad`, { method: 'PUT', body: JSON.stringify({ prioridadManual }) })
}

// ---------- Pedidos aprobados (P-36) ----------

// El mismo DTO que la cola de cocina, en el mismo orden: sinEmpezar con los prioritarios primero y después por
// aprobación; enPreparacion por la hora en que Cocina los empezó. Sin precios ni disponibilidad: el back no los manda.
export interface ListaDeAprobados {
  sinEmpezar: PedidoDeCocina[]
  enPreparacion: PedidoDeCocina[]
}

// Sin pedidos, las dos listas vacías (200, no 404). Pide el permiso pedido.priorizar: solo Caja.
export function listarAprobados() {
  return api<ListaDeAprobados>('/caja/pedidos/aprobados')
}
