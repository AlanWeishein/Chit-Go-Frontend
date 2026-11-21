import { api } from './http'
import type { Pagina } from './paginacion'

export interface Admin {
  id: number
  nombre: string
  email: string
  activo: boolean
  bloqueado: boolean
}

export interface AltaDeAdmin {
  nombre: string
  email: string
  password: string
}

export async function listarAdmins(): Promise<Admin[]> {
  const respuesta = await api<Admin[] | Pagina<Admin>>('/gerente/admins')
  return Array.isArray(respuesta) ? respuesta : respuesta.contenido
}

// La respuesta no se usa: la pantalla vuelve a pedir la lista. Así no depende de lo que devuelva el back.
export function crearAdmin(datos: AltaDeAdmin) {
  return api<void>('/gerente/admins', { method: 'POST', body: JSON.stringify(datos) })
}

export function cambiarActivoDeAdmin(id: number, activo: boolean) {
  return api<void>(`/gerente/admins/${id}/activo`, { method: 'PATCH', body: JSON.stringify({ activo }) })
}

export function desbloquearAdmin(id: number) {
  return api<void>(`/gerente/admins/${id}/desbloquear`, { method: 'POST' })
}
