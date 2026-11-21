import { api } from './http'
export type RolDeEmpleado = 'CAJA' | 'COCINA' | 'MOZO'

export interface Empleado {
  id: number
  nombre: string
  rol: RolDeEmpleado
  turno: string | null
  // Sin PIN a propósito: es una credencial y el back no debería devolverla.
}

export interface DatosDeEmpleado {
  nombre: string
  rol: RolDeEmpleado
  turno: string | null
}

export interface AltaDeEmpleado extends DatosDeEmpleado {
  pin: string
}

export function listarEmpleados() {
  return api<Empleado[]>('/admin/empleados')
}

export function crearEmpleado(datos: AltaDeEmpleado) {
  return api<Empleado>('/admin/empleados', { method: 'POST', body: JSON.stringify(datos) })
}

export function editarEmpleado(id: number, datos: DatosDeEmpleado) {
  return api<Empleado>(`/admin/empleados/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
}

export function borrarEmpleado(id: number) {
  return api<void>(`/admin/empleados/${id}`, { method: 'DELETE' })
}
