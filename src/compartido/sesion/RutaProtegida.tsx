import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Rol } from '../api/auth'
import { useSesion } from './SesionContext'
import { rutaInicial } from './rutas'

// Comodidad de navegación: el permiso de verdad lo valida el servidor en cada endpoint.
export default function RutaProtegida({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { sesion, cargando } = useSesion()
  if (cargando) return <p className="p-6 text-secundario">Cargando…</p>
  // TODO: mandar al login que corresponda (/staff/:token) cuando sepamos de dónde vino el operador
  if (!sesion) return <Navigate to="/" replace />
  if (!roles.includes(sesion.usuario.rol)) return <Navigate to={rutaInicial(sesion.usuario.rol)} replace />
  return <>{children}</>
}
