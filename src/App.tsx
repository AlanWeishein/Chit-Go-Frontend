import { Route, Routes, Navigate } from 'react-router-dom'
import Pendiente from './compartido/ui/Pendiente'
import RutaProtegida from './compartido/sesion/RutaProtegida'
import ConCredencialPropia from './compartido/sesion/ConCredencialPropia'
import CambiarContrasena from './roles/acceso/paginas/CambiarContrasena'
import ElegirPin from './roles/acceso/paginas/ElegirPin'
import LoginAdmin from './roles/acceso/paginas/LoginAdmin'
import LoginPin from './roles/acceso/paginas/LoginPin'
import { PaginaMenuCliente } from './roles/cliente/paginas/PaginaMenuCliente'
import PaginaPedidoCliente from './roles/cliente/paginas/PaginaPedidoCliente'
import PaginaCuentaCliente from './roles/cliente/paginas/PaginaCuentaCliente'

// Rutas del Mozo
import MarcoMozo from './roles/mozo/componentes/MarcoMozo'
import MisMesas from './roles/mozo/paginas/MisMesas'
import DetalleMesa from './roles/mozo/paginas/DetalleMesa'
import Avisos from './roles/mozo/paginas/Avisos'
import MiTurno from './roles/mozo/paginas/MiTurno'

// Rutas de Caja
import MarcoCaja from './roles/caja/componentes/MarcoCaja'
import { CierreCuentaPage } from './roles/caja/paginas/CierreCuentaPage'
import ColaAprobacion from './roles/caja/paginas/ColaAprobacion'
import DisponibilidadRapida from './roles/caja/paginas/DisponibilidadRapida'

// Rutas de Cocina
import ColaCocina from './roles/cocina/paginas/ColaCocina'

// Rutas del Admin
import MarcoAdmin from './roles/admin/componentes/MarcoAdmin'
import CartaAdmin from './roles/admin/paginas/CartaAdmin'

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
      
      {/* Vista del Mozo */}
      <Route
        path="/mozo"
        element={
          <RutaProtegida roles={['MOZO']}>
            <ConCredencialPropia>
              <MarcoMozo />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="mesas" replace />} />
        <Route path="mesas" element={<MisMesas />} />
        <Route path="mesas/:mesaId" element={<DetalleMesa />} />
        <Route path="avisos" element={<Avisos />} />
        <Route path="turno" element={<MiTurno />} />
      </Route>

      {/* Caja: el marco con el menú lateral y sus pantallas */}
      <Route
        path="/caja"
        element={
          <RutaProtegida roles={['CAJA']}>
            <ConCredencialPropia>
              <MarcoCaja />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<ColaAprobacion />} />
        {/* Cuentas por cobrar y cierre (P-09, HU-10) */}
        <Route path="cuentas" element={<CierreCuentaPage />} />
        {/* Disponibilidad rápida (P-10, HU-09) */}
        <Route path="disponibilidad" element={<DisponibilidadRapida />} />
        <Route path="aprobados" element={<Pendiente titulo="Pedidos aprobados" />} />
      </Route>

      {/* Cocina: el KDS (P-11) */}
      <Route
        path="/cocina/*"
        element={
          <RutaProtegida roles={['COCINA']}>
            <ConCredencialPropia>
              <ColaCocina />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      />

      {/* Admin: el marco con el menú lateral y sus pantallas. /admin/login y /admin/cambiar-contrasena van arriba. */}
      <Route
        path="/admin"
        element={
          <RutaProtegida roles={['ADMIN', 'GERENTE_DUENO']}>
            <ConCredencialPropia>
              <MarcoAdmin />
            </ConCredencialPropia>
          </RutaProtegida>
        }
      >
        {/* El Dashboard (P-13) todavía no existe: se entra por el menú */}
        <Route index element={<Navigate to="menu" replace />} />
        <Route path="dashboard" element={<Pendiente titulo="Dashboard" />} />
        {/* La carta (P-14, HU-12). El alta y la edición (P-14b) y las categorías (P-14c) cuelgan de acá. */}
        <Route path="menu" element={<CartaAdmin />} />
        <Route path="mesas" element={<Pendiente titulo="Mesas y QR" />} />
        <Route path="empleados" element={<Pendiente titulo="Empleados y turnos" />} />
        <Route path="reportes" element={<Pendiente titulo="Reportes" />} />
        <Route path="auditoria" element={<Pendiente titulo="Auditoría" />} />
        <Route path="administradores" element={<Pendiente titulo="Administradores" />} />
        {/* Disponibilidad rápida del Admin (P-10c, HU-09). El padding extra lleva los 24 px de la pantalla de
            Caja a los 32 × 28 del Mockup del Admin. */}
        <Route
          path="disponibilidad"
          element={
            <div className="min-h-full px-2 pt-1">
              <DisponibilidadRapida subtitulo="Lo mismo que ve Caja (P-10): el Admin lo usa de respaldo cuando Caja no está" />
            </div>
          }
        />
        <Route path="configuracion" element={<Pendiente titulo="Configuración" />} />
        <Route path="*" element={<Navigate to="menu" replace />} />
      </Route>
      <Route path="/plataforma/*" element={<Pendiente titulo="Super Admin" />} />
      <Route path="*" element={<Pendiente titulo="Chit&Go" />} />
    </Routes>
  )
}
