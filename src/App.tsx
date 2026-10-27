import { Route, Routes } from 'react-router-dom'
import Pendiente from './compartido/ui/Pendiente'
import RutaProtegida from './compartido/sesion/RutaProtegida'
import LoginAdmin from './roles/acceso/paginas/LoginAdmin'
import LoginPin from './roles/acceso/paginas/LoginPin'
import ColaAprobacion from './roles/caja/paginas/ColaAprobacion'

export default function App() {
  return (
    <Routes>
      <Route path="/mesa/:token" element={<Pendiente titulo="Cliente: menú de la mesa" />} />
      <Route path="/staff/:token" element={<LoginPin />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route
        path="/caja/pedidos"
        element={
          <RutaProtegida roles={['CAJA']}>
            <ColaAprobacion />
          </RutaProtegida>
        }
      />
      <Route path="/admin/*" element={<Pendiente titulo="Admin y Gerente/Dueño" />} />
      <Route path="/plataforma/*" element={<Pendiente titulo="Super Admin" />} />
      <Route path="*" element={<Pendiente titulo="Chit&Go" />} />
    </Routes>
  )
}
