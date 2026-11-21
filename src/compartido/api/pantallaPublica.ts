import { api } from './http'
import type { AccesoPantalla, PantallaPublica } from '../tipos/pantallaPublica'

// Pública: el token de la dirección dice de qué local es. Con un token que no existe responde 404 "La pantalla
// no está disponible".
export function pedidosEnCurso(tokenPantalla: string): Promise<PantallaPublica> {
  return api<PantallaPublica>(`/pantalla/${encodeURIComponent(tokenPantalla)}/pedidos-en-curso`)
}

// Del Admin (local.configurar): el token del local, para armar la dirección que se abre en el televisor.
export function accesoDePantalla(): Promise<AccesoPantalla> {
  return api<AccesoPantalla>('/admin/pantalla')
}
