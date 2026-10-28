import { Route, Routes } from 'react-router-dom'
import Pendiente from './compartido/ui/Pendiente'
import RutaProtegida from './compartido/sesion/RutaProtegida'
import CambiarContrasena from './roles/acceso/paginas/CambiarContrasena'
import ElegirPin from './roles/acceso/paginas/ElegirPin'
import LoginAdmin from './roles/acceso/paginas/LoginAdmin'
import LoginPin from './roles/acceso/paginas/LoginPin'
import PantallaProvisoria from './roles/acceso/paginas/PantallaProvisoria'
import { PaginaMenuCliente } from './roles/cliente/paginas/PaginaMenuCliente'
import PaginaPedidoCliente from './roles/cliente/paginas/PaginaPedidoCliente'
import PaginaCuentaCliente from './roles/cliente/paginas/PaginaCuentaCliente'

export default function App() {
  return (
    <Routes>
      <Route path="/mesa/:token" element={<PaginaMenuCliente />} />
      <Route path="/mesa/:token/pedido" element={<PaginaPedidoCliente />} />
      <Route path="/mesa/:token/cuenta" element={<PaginaCuentaCliente />} />
      <Route path="/staff/:token" element={<LoginPin />} />
      <Route path="/staff/:token/caja" element={<LoginPin caja />} />
      <Route path="/staff/:token/elegir-pin" element={<ElegirPin />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/admin/cambiar-contrasena" element={<CambiarContrasena />} />
      {/* Hasta que cada rol tenga sus pantallas: quién entró y "Cerrar sesión" */}
      <Route path="/mozo/*" element={<RutaProtegida roles={['MOZO']}><PantallaProvisoria /></RutaProtegida>} />
      <Route path="/caja/*" element={<RutaProtegida roles={['CAJA']}><PantallaProvisoria /></RutaProtegida>} />
      <Route path="/cocina/*" element={<RutaProtegida roles={['COCINA']}><PantallaProvisoria /></RutaProtegida>} />
      <Route
        path="/admin/*"
        element={<RutaProtegida roles={['ADMIN', 'GERENTE_DUENO']}><PantallaProvisoria /></RutaProtegida>}
      />
      <Route path="/plataforma/*" element={<Pendiente titulo="Super Admin" />} />
      <Route path="*" element={<Pendiente titulo="Chit&Go" />} />
    </Routes>
  )
}
