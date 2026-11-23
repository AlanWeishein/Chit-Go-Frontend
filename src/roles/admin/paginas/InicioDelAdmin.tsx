import { Navigate } from 'react-router-dom'
import { useSesion } from '../../../compartido/sesion/SesionContext'

// A dónde va quien entra a /admin, a una ruta que no existe dentro de /admin o a una que no es de su rol (SoloPara).
// El Gerente/Dueño no opera el local: su inicio es Administradores. El Admin va al Dashboard (P-13). Rutas
// absolutas a propósito, para que funcione igual desde el índice, la ruta comodín y SoloPara.
export default function InicioDelAdmin() {
  const { sesion } = useSesion()
  return <Navigate to={sesion?.rol === 'GERENTE_DUENO' ? '/admin/administradores' : '/admin/dashboard'} replace />
}
