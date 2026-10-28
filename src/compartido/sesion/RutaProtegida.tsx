import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Rol } from '../api/auth'
import { useSesion } from './SesionContext'
import { rutaInicial } from './rutas'
import { leerTokenStaff } from './tokenStaff'

// A qué login mandar cuando no hay sesión (nunca existió o venció).
function rutaDeLogin(roles: Rol[]): string {
  if (roles.every((r) => r === 'ADMIN' || r === 'GERENTE_DUENO')) return '/admin/login'
  const token = leerTokenStaff()
  if (!token) return '/' // sin token conocido no sabemos de qué local es
  const login = `/staff/${encodeURIComponent(token)}`
  return roles.every((r) => r === 'CAJA') ? `${login}/caja` : login // la tablet de Caja vuelve a P-22
}

// Comodidad de navegación: el permiso de verdad lo valida el servidor en cada endpoint.
export default function RutaProtegida({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { sesion, cargando } = useSesion()
  if (cargando) return <p className="p-6 text-secundario">Cargando…</p>
  if (!sesion) return <Navigate to={rutaDeLogin(roles)} replace />
  if (!roles.includes(sesion.rol)) return <Navigate to={rutaInicial(sesion.rol)} replace />
  return <>{children}</>
}
