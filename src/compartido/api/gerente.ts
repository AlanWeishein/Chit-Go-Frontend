import { api } from './http'

// Los Admins del local del Gerente/Dueño (HU-16, P-19), contra AdminsGerenteController. El local sale de la sesión:
// ninguna ruta lleva localId. Un Admin que las llama recibe 403 (CP-31-05).

// AdminDto: nunca trae la contraseña ni su hash, ni la fecha de alta.
export interface Admin {
  id: number
  nombre: string
  email: string
  activo: boolean
  bloqueado: boolean
}

// AltaDeAdminRequest: nombre hasta 120, email hasta 160 y contraseña de 8 a 64 caracteres y hasta 72 bytes.
export interface AltaDeAdmin {
  nombre: string
  email: string
  password: string
}

// Una lista, sin paginar: son pocos por local. Trae también los dados de baja, ordenados por nombre.
export function listarAdmins() {
  return api<Admin[]>('/gerente/admins')
}

// 201 con el Admin creado. El email repetido, de cualquier local, da 409 "Ya hay un usuario con ese email".
export function crearAdmin(datos: AltaDeAdmin) {
  return api<Admin>('/gerente/admins', { method: 'POST', body: JSON.stringify(datos) })
}

// Baja (activo: false) o reactivación (true). Mandar el estado que ya tiene responde lo mismo.
export function cambiarActivoDeAdmin(id: number, activo: boolean) {
  return api<Admin>(`/gerente/admins/${id}/activo`, { method: 'PATCH', body: JSON.stringify({ activo }) })
}

// Levanta el bloqueo por intentos fallidos. Con el Admin dado de baja da 409 "El Admin está dado de baja".
export function desbloquearAdmin(id: number) {
  return api<Admin>(`/gerente/admins/${id}/desbloquear`, { method: 'POST' })
}
