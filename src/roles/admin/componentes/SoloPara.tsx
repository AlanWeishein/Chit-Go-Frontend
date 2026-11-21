import type { ReactNode } from 'react'
import type { Rol } from '../../../compartido/api/auth'
import { useSesion } from '../../../compartido/sesion/SesionContext'
import InicioDelAdmin from '../paginas/InicioDelAdmin'

// Una pantalla del marco del Admin que no es para el rol de la sesión manda al inicio de ese rol (CP-31-05: el
// Admin no ve Administradores, y el Gerente/Dueño no ve lo que es operar). Va adentro de RutaProtegida, que ya
// controló que hay sesión. Es comodidad: el permiso de verdad lo valida el back en cada endpoint.
export default function SoloPara({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { sesion } = useSesion()
  if (!sesion || !roles.includes(sesion.rol)) return <InicioDelAdmin />
  return <>{children}</>
}
