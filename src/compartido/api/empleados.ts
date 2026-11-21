import { api } from './http'
import type { Pagina } from './paginacion'

// Los empleados del Admin (EmpleadosAdminController, HU-14). Todo es del local de la sesión. Solo Mozo, Caja y
// Cocina: el Admin no sale, y su id da 404 "El empleado no existe", lo mismo que uno de otro local. Un dado de baja
// queda de solo lectura: todo lo que lo cambia responde 409 "El empleado está dado de baja".

export type RolDeEmpleado = 'CAJA' | 'COCINA' | 'MOZO'

export type DiaSemana = 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB' | 'DOM'

export type TipoAusencia = 'VACACIONES' | 'FRANCO' | 'BAJA_TEMPORAL'

// TurnoDto del back. Las horas llegan como "19:00:00" y se mandan como "19:00". Si horaFin es menor que
// horaInicio, termina al día siguiente. Una hora igual a la otra da 400 "El turno no puede empezar y terminar a la
// misma hora", y dos turnos que se pisan dan 400 sin guardar ninguno.
export interface Turno {
  dia: DiaSemana
  horaInicio: string
  horaFin: string
}

// AusenciaDto: las fechas como "2026-11-21". Los dos días cuentan: el día siguiente a `hasta` vuelve. Sin `hasta`,
// no tiene fecha de vuelta.
export interface Ausencia {
  id: number
  tipo: TipoAusencia
  desde: string
  hasta: string | null
}

// Una fila de GET /admin/empleados (EmpleadoResumenDto). Los dados de baja también salen, con activo en false.
// nombreUsuario va en null si no es mozo. Sin PIN: el back nunca lo manda.
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

// GET /admin/empleados/{id} (EmpleadoDetalleDto). Las mesas van como id; las ausencias, de la más nueva a la más
// vieja. Es también lo que responden el alta, la edición, los turnos, las mesas y el blanqueo.
export interface EmpleadoDetalle extends EmpleadoResumen {
  debeCambiarCredencial: boolean
  contrasenaProvisoria: boolean
  mesaIds: number[]
  ausencias: Ausencia[]
}

// El alta: el PIN de 4 a 10 dígitos. Si es Mozo, también el usuario (hasta 40, único en el local sin distinguir
// mayúsculas: si no, 409 "Ya existe un usuario con ese nombre") y la contraseña provisoria (de 8 a 64 caracteres).
// Caja y Cocina no los pueden mandar.
export interface AltaDeEmpleado {
  nombre: string
  rol: RolDeEmpleado
  pin: string
  nombreUsuario?: string
  password?: string
}

// La edición: el rol, el PIN y la contraseña no cambian. Si es Mozo, el usuario es obligatorio.
export interface EdicionDeEmpleado {
  nombre: string
  nombreUsuario?: string
}

const base = (id: number) => `/admin/empleados/${id}`

// Ordenados por nombre y, si empatan, por id. page empieza en 0 y size va de 1 a 100.
export function listarEmpleados(page: number, size: number) {
  return api<Pagina<EmpleadoResumen>>(`/admin/empleados?page=${page}&size=${size}`)
}

export function detalleEmpleado(id: number) {
  return api<EmpleadoDetalle>(base(id))
}

// 201 con el detalle. Nace con la marca de cambio obligatorio y, si es mozo, con la contraseña provisoria.
export function crearEmpleado(datos: AltaDeEmpleado) {
  return api<EmpleadoDetalle>('/admin/empleados', { method: 'POST', body: JSON.stringify(datos) })
}

export function editarEmpleado(id: number, datos: EdicionDeEmpleado) {
  return api<EmpleadoDetalle>(base(id), { method: 'PUT', body: JSON.stringify(datos) })
}

// Reemplaza la plantilla semanal entera. La lista vacía lo deja sin turnos.
export function reemplazarTurnos(id: number, turnos: Turno[]) {
  return api<EmpleadoDetalle>(`${base(id)}/turnos`, { method: 'PUT', body: JSON.stringify(turnos) })
}

// Solo Mozo. Reemplaza sus mesas; una mesa que no es del local da 404 "La mesa no existe" y no guarda ninguna.
export function reemplazarMesas(id: number, mesaIds: number[]) {
  return api<EmpleadoDetalle>(`${base(id)}/mesas`, { method: 'PUT', body: JSON.stringify({ mesaIds }) })
}

// El PIN nuevo es provisorio: vuelve a pedir el cambio, pone los intentos en 0 y levanta el bloqueo (CP-10-06).
export function blanquearPin(id: number, pin: string) {
  return api<EmpleadoDetalle>(`${base(id)}/pin`, { method: 'POST', body: JSON.stringify({ pin }) })
}

export function listarAusencias(id: number) {
  return api<Ausencia[]>(`${base(id)}/ausencias`)
}

// `hasta` en null: sin fecha de vuelta. Antes que `desde`: 400 "La ausencia no puede terminar antes de empezar".
export function cargarAusencia(id: number, datos: { tipo: TipoAusencia; desde: string; hasta: string | null }) {
  return api<Ausencia>(`${base(id)}/ausencias`, { method: 'POST', body: JSON.stringify(datos) })
}

// No hay DELETE: terminarla es ponerle `hasta`, así queda de cuándo a cuándo faltó. `hasta` no puede ser anterior
// a `desde`, así que una ausencia que todavía no empezó no se puede sacar.
export function cambiarFinDeAusencia(id: number, ausenciaId: number, hasta: string) {
  return api<Ausencia>(`${base(id)}/ausencias/${ausenciaId}`, { method: 'PATCH', body: JSON.stringify({ hasta }) })
}

// Baja lógica: el empleado no entra más y sigue en la lista, de solo lectura. Darlo de baja dos veces responde lo
// mismo (204).
export function darDeBajaEmpleado(id: number) {
  return api<void>(base(id), { method: 'DELETE' })
}
