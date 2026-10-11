import { Route, Routes } from 'react-router-dom'
import Pendiente from './compartido/ui/Pendiente'

// Una sola PWA con una sección por rol. Cada ruta apunta a la página de su rol cuando exista.
export default function App() {
  return (
    <Routes>
      <Route path="/mesa/:token" element={<Pendiente titulo="Cliente: menú de la mesa" />} />
      <Route path="/staff/:token" element={<Pendiente titulo="Login con PIN (Mozo, Caja, Cocina)" />} />
      <Route path="/admin/*" element={<Pendiente titulo="Admin y Gerente/Dueño" />} />
      <Route path="/plataforma/*" element={<Pendiente titulo="Super Admin" />} />
      <Route path="*" element={<Pendiente titulo="Chit&Go" />} />
    </Routes>
  )
}
