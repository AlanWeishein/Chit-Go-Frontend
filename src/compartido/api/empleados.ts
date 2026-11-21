import { api } from './http'
import type { Pagina } from './paginacion'

export type RolDeEmpleado = 'CAJA' | 'COCINA' | 'MOZO'

export type DiaSemana = 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB' | 'DOM'

// TurnoDto del back. Las horas llegan como "19:00:00". Si horaFin es menor que horaInicio, termina al día siguiente.
export interface Turno {
  dia: DiaSemana
  horaInicio: string
  horaFin: string
}

// Una fila de GET /admin/empleados (EmpleadoResumenDto). Solo Mozo, Caja y Cocina: el Admin no sale. Los dados de
// baja también salen, con activo en false. nombreUsuario va en null si no es mozo. Sin PIN: el back nunca lo manda.
export interface EmpleadoResumen {
  id: number
  nombre: string
  rol: RolDeEmpleado
  nombreUsuario: string | null
  activo: boolean
  bloqueado: boolean
  ausenciaVigente: boolean
  turnos: Turno[]
}

// Lo que usa el formulario de la tarea 7 hasta que se rehaga contra el contrato del back.
export interface DatosDeEmpleado {
  nombre: string
  rol: RolDeEmpleado
  turno: string | null
}

export interface AltaDeEmpleado extends DatosDeEmpleado {
  pin: string
}

// Ordenados por nombre y, si empatan, por id. page empieza en 0 y size va de 1 a 100.
export function listarEmpleados(page: number, size: number) {
  return api<Pagina<EmpleadoResumen>>(`/admin/empleados?page=${page}&size=${size}`)
}

export function crearEmpleado(datos: AltaDeEmpleado) {
  return api<EmpleadoResumen>('/admin/empleados', { method: 'POST', body: JSON.stringify(datos) })
}

export function editarEmpleado(id: number, datos: DatosDeEmpleado) {
  return api<EmpleadoResumen>(`/admin/empleados/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
}

// Baja lógica: el empleado no entra más y sigue en la lista, de solo lectura. Darlo de baja dos veces responde lo
// mismo (204).
export function darDeBajaEmpleado(id: number) {
  return api<void>(`/admin/empleados/${id}`, { method: 'DELETE' })
}
