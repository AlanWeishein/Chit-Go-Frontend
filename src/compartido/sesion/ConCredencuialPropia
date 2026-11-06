import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSesion } from './SesionContext'
import { rutaDeEntrada, rutaInicial } from './rutas'
import { leerTokenStaff } from './tokenStaff'

// Va adentro de RutaProtegida, envolviendo el marco de cada rol. Si la credencial es provisoria, primero manda a
// elegir la suya (lo mismo que hacía PantallaProvisoria).
export default function ConCredencialPropia({ children }: { children: ReactNode }) {
  const { sesion } = useSesion()
  if (!sesion) return null
  const destino = rutaDeEntrada(sesion, leerTokenStaff())
  if (destino !== rutaInicial(sesion.rol)) return <Navigate to={destino} replace />
  return <>{children}</>
}
