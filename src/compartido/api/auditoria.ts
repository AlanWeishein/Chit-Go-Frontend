import { api } from './http'
import type { Pagina } from './paginacion'
export interface RegistroDeAuditoria {
  id: number
  fecha: string // ISO
  usuario: string
  entidad: string
  accion: string
  valorAnterior: unknown
  valorNuevo: unknown
}

export interface FiltrosDeAuditoria {
  entidad?: string
  usuarioId?: number
  desde?: string
  hasta?: string
}

export function listarAuditoria(page: number, filtros: FiltrosDeAuditoria = {}, size?: number) {
  const query = new URLSearchParams({ page: String(page) })
  if (size !== undefined) query.set('size', String(size))
  if (filtros.entidad) query.set('entidad', filtros.entidad)
  if (filtros.usuarioId !== undefined) query.set('usuarioId', String(filtros.usuarioId))
  if (filtros.desde) query.set('desde', filtros.desde)
  if (filtros.hasta) query.set('hasta', filtros.hasta)
  return api<Pagina<RegistroDeAuditoria>>(`/admin/auditoria?${query.toString()}`)
}
