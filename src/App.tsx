import { Route, Routes } from 'react-router-dom'
import Pendiente from './compartido/ui/Pendiente'
import LoginAdmin from './roles/acceso/paginas/LoginAdmin'
import LoginPin from './roles/acceso/paginas/LoginPin'
import { PaginaMenuCliente } from './roles/cliente/paginas/PaginaMenuCliente'

export default function App() {
  return (
    <Routes>
      <Route path="/mesa/:token" element={<PaginaMenuCliente />} />
      <Route path="/staff/:token" element={<LoginPin />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/admin/*" element={<Pendiente titulo="Admin y Gerente/Dueño" />} />
      <Route path="/plataforma/*" element={<Pendiente titulo="Super Admin" />} />
      <Route path="*" element={<Pendiente titulo="Chit&Go" />} />
    </Routes>
  )
}
