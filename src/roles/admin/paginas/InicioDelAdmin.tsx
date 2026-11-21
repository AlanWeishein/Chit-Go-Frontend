import { Navigate } from 'react-router-dom'
import { useSesion } from '../../../compartido/sesion/SesionContext'

// A dónde va quien entra a /admin (o a una ruta que no existe dentro de /admin). El Gerente/Dueño no tiene carta:
// su única pantalla es Administradores. El resto va a Menú, como hasta ahora. Rutas absolutas a propósito, para
// que funcione igual desde el índice y desde la ruta comodín.
export default function InicioDelAdmin() {
  const { sesion } = useSesion()
  return <Navigate to={sesion?.rol === 'GERENTE_DUENO' ? '/admin/administradores' : '/admin/menu'} replace />
}
